package com.backofficepro.surveyplatform.shared.domain.model;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA entity representing a feature flag configuration.
 *
 * <p>Feature flags enable runtime control of feature availability, including
 * percentage-based gradual rollouts to specific user segments.</p>
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "feature_flags", schema = "shared")
public class FeatureFlag extends BaseEntity {

    @Column(name = "name", unique = true, nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "percentage", nullable = false)
    private int percentage = 100;

    @Column(name = "rollout_seed", length = 100)
    private String rolloutSeed;

    /**
     * Determines whether the flag is enabled for the given context identifier.
     *
     * <p>If the flag is globally disabled, returns false. If globally enabled
     * with 100% rollout, returns true. Otherwise, uses a deterministic hash
     * of the rolloutSeed and contextId to decide.</p>
     *
     * @param contextId a stable identifier such as user ID or session ID
     * @return true if the flag is active for this context
     */
    public boolean isEnabledFor(final String contextId) {
        if (!enabled) {
            return false;
        }
        if (percentage >= 100) {
            return true;
        }
        if (percentage <= 0) {
            return false;
        }
        final String input = (rolloutSeed != null ? rolloutSeed : name) + ":" + contextId;
        final int hash = Math.abs(input.hashCode());
        return (hash % 100) < percentage;
    }
}
