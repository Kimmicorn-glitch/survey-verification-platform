package com.backofficepro.surveyplatform.payment.application;

import com.backofficepro.surveyplatform.payment.domain.Invoice;
import com.backofficepro.surveyplatform.payment.domain.Subscription;
import com.backofficepro.surveyplatform.payment.domain.repository.InvoiceRepository;
import com.backofficepro.surveyplatform.payment.domain.repository.SubscriptionRepository;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;

    public SubscriptionService(final SubscriptionRepository subscriptionRepository,
                               final InvoiceRepository invoiceRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public Subscription createSubscription(final String userId, final String plan) {
        log.info("Creating subscription for user {} with plan {}", userId, plan);

        final boolean hasActive = subscriptionRepository.existsByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE);
        if (hasActive) {
            throw new BusinessRuleValidationException(
                    "SubscriptionAlreadyExists", "User already has an active subscription");
        }

        final Subscription subscription = Subscription.create(userId, plan);

        final Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription {} created for user {}", saved.getId(), userId);
        return saved;
    }

    @Transactional(readOnly = true)
    public Subscription getSubscription(final String subscriptionId) {
        return subscriptionRepository.findById(UUID.fromString(subscriptionId))
                .orElseThrow(() -> new EntityNotFoundException("Subscription", subscriptionId));
    }

    @Transactional(readOnly = true)
    public Subscription getUserSubscription(final String userId) {
        return subscriptionRepository.findByUserIdAndStatus(userId, Subscription.STATUS_ACTIVE)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Subscription", "active subscription for user " + userId));
    }

    @Transactional(readOnly = true)
    public List<Subscription> getUserSubscriptions(final String userId) {
        return subscriptionRepository.findByUserId(userId);
    }

    public Subscription upgradePlan(final String userId, final String newPlan) {
        log.info("Upgrading plan for user {} to {}", userId, newPlan);

        final Subscription subscription = getUserSubscription(userId);

        final SubscriptionPlanConfig newConfig = SubscriptionPlanConfig.fromPlan(newPlan);
        subscription.updatePlan(newPlan, newConfig.monthlySurveys(), newConfig.monthlyVerifications());

        final Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription {} upgraded to plan {}", saved.getId(), newPlan);
        return saved;
    }

    public Subscription downgradePlan(final String userId, final String newPlan) {
        log.info("Downgrading plan for user {} to {}", userId, newPlan);

        final Subscription subscription = getUserSubscription(userId);

        final SubscriptionPlanConfig newConfig = SubscriptionPlanConfig.fromPlan(newPlan);
        subscription.updatePlan(newPlan, newConfig.monthlySurveys(), newConfig.monthlyVerifications());

        final Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription {} downgraded to plan {}", saved.getId(), newPlan);
        return saved;
    }

    @CircuitBreaker(name = "stripeService", fallbackMethod = "cancelSubscriptionFallback")
    @Retry(name = "stripeService")
    public Subscription cancelSubscription(final String userId, final String subscriptionId) {
        log.info("Canceling subscription {} for user {}", subscriptionId, userId);

        final Subscription subscription = getSubscription(subscriptionId);
        authorizeSubscriptionOwnership(subscription, userId);

        subscription.cancel();

        final Subscription saved = subscriptionRepository.save(subscription);

        createCancellationInvoice(saved);

        log.info("Subscription {} canceled", subscriptionId);
        return saved;
    }

    @CircuitBreaker(name = "stripeService", fallbackMethod = "reactivateSubscriptionFallback")
    @Retry(name = "stripeService")
    public Subscription reactivateSubscription(final String userId, final String subscriptionId) {
        log.info("Reactivating subscription {} for user {}", subscriptionId, userId);

        final Subscription subscription = getSubscription(subscriptionId);
        authorizeSubscriptionOwnership(subscription, userId);

        subscription.reactivate();

        final Subscription saved = subscriptionRepository.save(subscription);
        log.info("Subscription {} reactivated", subscriptionId);
        return saved;
    }

    @Transactional(readOnly = true)
    public boolean checkUsageLimits(final String userId) {
        final Subscription subscription = subscriptionRepository.findByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE)
                .orElse(null);

        if (subscription == null) {
            return false;
        }

        return subscription.isWithinLimits();
    }

    @Transactional(readOnly = true)
    public boolean checkSurveyLimits(final String userId) {
        final Subscription subscription = subscriptionRepository.findByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE)
                .orElse(null);

        if (subscription == null) {
            return false;
        }

        return subscription.isWithinSurveyLimits();
    }

    @Transactional(readOnly = true)
    public boolean checkVerificationLimits(final String userId) {
        final Subscription subscription = subscriptionRepository.findByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE)
                .orElse(null);

        if (subscription == null) {
            return false;
        }

        return subscription.isWithinVerificationLimits();
    }

    public void incrementSurveyUsage(final String userId) {
        final Subscription subscription = subscriptionRepository.findByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE)
                .orElseThrow(() -> new BusinessRuleValidationException(
                        "NoActiveSubscription", "No active subscription found for user: " + userId));

        subscription.incrementSurveyUsage();
        subscriptionRepository.save(subscription);
        log.debug("Survey usage incremented for user {}, now {}/{}",
                userId, subscription.getSurveysUsed(), subscription.getMonthlySurveys());
    }

    public void incrementVerificationUsage(final String userId) {
        final Subscription subscription = subscriptionRepository.findByUserIdAndStatus(
                userId, Subscription.STATUS_ACTIVE)
                .orElseThrow(() -> new BusinessRuleValidationException(
                        "NoActiveSubscription", "No active subscription found for user: " + userId));

        subscription.incrementVerificationUsage();
        subscriptionRepository.save(subscription);
        log.debug("Verification usage incremented for user {}, now {}/{}",
                userId, subscription.getVerificationsUsed(), subscription.getMonthlyVerifications());
    }

    public void resetMonthlyUsage() {
        final List<Subscription> subscriptions = subscriptionRepository.findSubscriptionsNeedingUsageReset();
        log.info("Resetting monthly usage for {} subscriptions", subscriptions.size());

        for (final Subscription subscription : subscriptions) {
            subscription.resetMonthlyUsage();
            subscriptionRepository.save(subscription);
            log.debug("Usage reset for subscription {}", subscription.getId());
        }
    }

    public void syncSubscriptionStatus(final String stripeSubscriptionId, final String status) {
        log.info("Syncing status for Stripe subscription {} to {}", stripeSubscriptionId, status);

        final Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Subscription", "Stripe subscription " + stripeSubscriptionId));

        subscription.setStatus(status);

        if (Subscription.STATUS_CANCELED.equals(status)) {
            subscription.setCancelAtPeriodEnd(false);
            if (subscription.getCanceledAt() == null) {
                subscription.cancel();
            }
        }

        subscriptionRepository.save(subscription);
        log.info("Subscription {} status synced to {}", subscription.getId(), status);
    }

    private void authorizeSubscriptionOwnership(final Subscription subscription, final String userId) {
        if (!subscription.getUserId().equals(userId)) {
            throw new BusinessRuleValidationException(
                    "Unauthorized",
                    "You are not authorized to modify this subscription");
        }
    }

    private void createCancellationInvoice(final Subscription subscription) {
        final String invoiceNumber = generateInvoiceNumber();
        final Invoice invoice = Invoice.create(
                subscription.getUserId(),
                subscription.getId(),
                invoiceNumber,
                BigDecimal.ZERO,
                "USD");
        invoice.setDescription("Subscription cancellation - " + subscription.getPlan());
        invoiceRepository.save(invoice);
    }

    private String generateInvoiceNumber() {
        final String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        final long count = invoiceRepository.countByStatus(Invoice.STATUS_PENDING) + 1;
        return String.format("INV-%s-%04d", datePart, count);
    }

    public Subscription cancelSubscriptionFallback(final String userId,
                                                   final String subscriptionId,
                                                   final Throwable throwable) {
        log.error("Stripe circuit breaker open for cancel subscription, falling back. Error: {}",
                throwable.getMessage());
        final Subscription subscription = getSubscription(subscriptionId);
        authorizeSubscriptionOwnership(subscription, userId);
        subscription.cancel();
        return subscriptionRepository.save(subscription);
    }

    public Subscription reactivateSubscriptionFallback(final String userId,
                                                       final String subscriptionId,
                                                       final Throwable throwable) {
        log.error("Stripe circuit breaker open for reactivate subscription, falling back. Error: {}",
                throwable.getMessage());
        final Subscription subscription = getSubscription(subscriptionId);
        authorizeSubscriptionOwnership(subscription, userId);
        subscription.reactivate();
        return subscriptionRepository.save(subscription);
    }

    private enum SubscriptionPlanConfig {
        FREE(10, 50),
        STARTER(50, 200),
        PROFESSIONAL(200, 1000),
        ENTERPRISE(Integer.MAX_VALUE, Integer.MAX_VALUE);

        private final int monthlySurveys;
        private final int monthlyVerifications;

        SubscriptionPlanConfig(final int monthlySurveys, final int monthlyVerifications) {
            this.monthlySurveys = monthlySurveys;
            this.monthlyVerifications = monthlyVerifications;
        }

        public int monthlySurveys() {
            return monthlySurveys;
        }

        public int monthlyVerifications() {
            return monthlyVerifications;
        }

        public static SubscriptionPlanConfig fromPlan(final String plan) {
            try {
                return valueOf(plan.toUpperCase());
            } catch (final IllegalArgumentException e) {
                throw new BusinessRuleValidationException(
                        "InvalidPlan", "Unknown subscription plan: " + plan);
            }
        }
    }
}
