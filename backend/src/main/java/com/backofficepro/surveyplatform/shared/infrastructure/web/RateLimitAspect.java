package com.backofficepro.surveyplatform.shared.infrastructure.web;

import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Aspect
@Component
public class RateLimitAspect {

    private static final Logger log = LoggerFactory.getLogger(RateLimitAspect.class);

    private final RateLimiterRegistry rateLimiterRegistry;

    public RateLimitAspect(final RateLimiterRegistry rateLimiterRegistry) {
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    @Around("@annotation(rateLimited)")
    public Object rateLimit(final ProceedingJoinPoint joinPoint,
                             final RateLimited rateLimited) throws Throwable {
        final String limiterName = rateLimited.name().isEmpty()
                ? joinPoint.getSignature().getDeclaringType().getSimpleName()
                : rateLimited.name();

        final RateLimiter rateLimiter = rateLimiterRegistry.rateLimiter(limiterName);

        try {
            final boolean permission = rateLimiter.acquirePermission(
                    rateLimited.timeoutDuration(), TimeUnit.MILLISECONDS);
            if (!permission) {
                log.warn("Rate limit exceeded for {} on {}", limiterName, joinPoint.getSignature().toShortString());
                throw new BusinessRuleValidationException(
                        "RateLimitExceeded",
                        "Too many requests. Please try again later.");
            }
        } catch (final InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessRuleValidationException(
                    "RequestTimeout", "Request was interrupted");
        }

        return joinPoint.proceed();
    }
}
