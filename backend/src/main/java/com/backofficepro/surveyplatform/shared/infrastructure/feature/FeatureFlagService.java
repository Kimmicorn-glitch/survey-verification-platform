package com.backofficepro.surveyplatform.shared.infrastructure.feature;

import com.backofficepro.surveyplatform.shared.domain.model.FeatureFlag;
import com.backofficepro.surveyplatform.shared.domain.model.FeatureFlagRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Service for evaluating feature flags with Redis caching and percentage-based rollouts.
 *
 * <p>Flags are cached in Redis with a configurable TTL to minimize database reads.
 * When a flag is not cached, the database is queried as a fallback. Percentage-based
 * rollouts use a deterministic hash of the context identifier to ensure consistent
 * assignment across requests.</p>
 *
 * @author BackOffice Pro
 */
@Service
public class FeatureFlagService {

    private static final Logger log = LoggerFactory.getLogger(FeatureFlagService.class);

    private static final String CACHE_PREFIX = "feature_flag:";
    private static final Duration DEFAULT_CACHE_TTL = Duration.ofMinutes(10);

    private final FeatureFlagRepository featureFlagRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * Constructs a new FeatureFlagService.
     *
     * @param featureFlagRepository the flag repository
     * @param redisTemplate         the Redis template for caching
     */
    public FeatureFlagService(final FeatureFlagRepository featureFlagRepository,
                              final StringRedisTemplate redisTemplate) {
        this.featureFlagRepository = featureFlagRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Checks whether a feature flag is enabled, optionally for a specific context.
     *
     * <p>When a contextId is provided, percentage-based rollouts are evaluated.
     * Without a contextId, only the global enabled state is checked.</p>
     *
     * @param featureName the flag name
     * @param contextId   optional context identifier for rollout evaluation
     * @return true if the flag is enabled for the given context
     */
    public boolean isEnabled(final String featureName, final String contextId) {
        final Optional<FeatureFlag> flag = getCachedOrDb(featureName);
        if (flag.isEmpty()) {
            log.debug("Feature flag '{}' not found, defaulting to disabled", featureName);
            return false;
        }
        if (contextId != null) {
            return flag.get().isEnabledFor(contextId);
        }
        return flag.get().isEnabled();
    }

    /**
     * Checks whether a feature flag is globally enabled.
     *
     * @param featureName the flag name
     * @return true if the flag is enabled
     */
    public boolean isEnabled(final String featureName) {
        return isEnabled(featureName, null);
    }

    /**
     * Returns the flag's string value or the provided default.
     *
     * @param featureName  the flag name
     * @param defaultValue the fallback value when the flag does not exist or is disabled
     * @return the flag value or the default
     */
    public String getFlag(final String featureName, final String defaultValue) {
        final Optional<FeatureFlag> flag = getCachedOrDb(featureName);
        if (flag.isEmpty() || !flag.get().isEnabled()) {
            return defaultValue;
        }
        return flag.get().getName();
    }

    /**
     * Reloads a flag from the database, bypassing the cache.
     *
     * @param featureName the flag name
     */
    public void refreshFlag(final String featureName) {
        final String cacheKey = CACHE_PREFIX + featureName;
        redisTemplate.delete(cacheKey);
        log.info("Refreshed feature flag cache for '{}'", featureName);
    }

    /**
     * Invalidates all cached feature flags.
     */
    public void refreshAll() {
        final var keys = redisTemplate.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        log.info("Refreshed all feature flag caches");
    }

    private Optional<FeatureFlag> getCachedOrDb(final String featureName) {
        final String cacheKey = CACHE_PREFIX + featureName;
        final String cachedEnabled = redisTemplate.opsForValue().get(cacheKey);

        if (cachedEnabled != null) {
            final boolean enabled = Boolean.parseBoolean(cachedEnabled);
            final Optional<FeatureFlag> dbFlag = featureFlagRepository.findByName(featureName);
            if (dbFlag.isPresent() && dbFlag.get().isEnabled() == enabled) {
                return dbFlag;
            }
        }

        final Optional<FeatureFlag> dbFlag = featureFlagRepository.findByName(featureName);
        dbFlag.ifPresent(flag ->
                redisTemplate.opsForValue().set(cacheKey,
                        String.valueOf(flag.isEnabled()),
                        DEFAULT_CACHE_TTL));
        return dbFlag;
    }
}
