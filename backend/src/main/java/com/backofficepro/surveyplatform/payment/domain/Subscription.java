package com.backofficepro.surveyplatform.payment.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "subscriptions", schema = "payment")
public class Subscription extends BaseEntity {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CANCELED = "CANCELED";
    public static final String STATUS_PAST_DUE = "PAST_DUE";
    public static final String STATUS_TRIALING = "TRIALING";

    public static final int DEFAULT_MONTHLY_SURVEYS = 10;
    public static final int DEFAULT_MONTHLY_VERIFICATIONS = 50;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "plan", nullable = false, length = 50)
    private String plan;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "trial_start")
    private LocalDateTime trialStart;

    @Column(name = "trial_end")
    private LocalDateTime trialEnd;

    @Column(name = "monthly_surveys", nullable = false)
    private int monthlySurveys;

    @Column(name = "monthly_verifications", nullable = false)
    private int monthlyVerifications;

    @Column(name = "surveys_used", nullable = false)
    private int surveysUsed;

    @Column(name = "verifications_used", nullable = false)
    private int verificationsUsed;

    @Column(name = "usage_reset_at")
    private LocalDateTime usageResetAt;

    protected Subscription() {
        super();
    }

    public static Subscription create(final String userId, final String plan) {
        if (userId == null || userId.isBlank()) {
            throw new BusinessRuleValidationException(
                    "SubscriptionUserIdRequired", "User ID must not be blank");
        }
        if (plan == null || plan.isBlank()) {
            throw new BusinessRuleValidationException(
                    "SubscriptionPlanRequired", "Plan must not be blank");
        }

        final Subscription subscription = new Subscription();
        subscription.userId = userId;
        subscription.plan = plan;
        subscription.status = STATUS_ACTIVE;
        subscription.cancelAtPeriodEnd = false;
        subscription.monthlySurveys = DEFAULT_MONTHLY_SURVEYS;
        subscription.monthlyVerifications = DEFAULT_MONTHLY_VERIFICATIONS;
        subscription.surveysUsed = 0;
        subscription.verificationsUsed = 0;
        subscription.currentPeriodStart = LocalDateTime.now();
        subscription.currentPeriodEnd = LocalDateTime.now().plusMonths(1);
        subscription.usageResetAt = LocalDateTime.now().plusMonths(1);
        return subscription;
    }

    public boolean isWithinLimits() {
        return surveysUsed < monthlySurveys && verificationsUsed < monthlyVerifications;
    }

    public boolean isWithinSurveyLimits() {
        return surveysUsed < monthlySurveys;
    }

    public boolean isWithinVerificationLimits() {
        return verificationsUsed < monthlyVerifications;
    }

    public void incrementSurveyUsage() {
        if (!isWithinSurveyLimits()) {
            throw new BusinessRuleValidationException(
                    "SubscriptionSurveyLimitExceeded",
                    "Monthly survey limit has been reached for plan: " + plan);
        }
        this.surveysUsed++;
    }

    public void incrementVerificationUsage() {
        if (!isWithinVerificationLimits()) {
            throw new BusinessRuleValidationException(
                    "SubscriptionVerificationLimitExceeded",
                    "Monthly verification limit has been reached for plan: " + plan);
        }
        this.verificationsUsed++;
    }

    public void incrementUsage() {
        incrementSurveyUsage();
        incrementVerificationUsage();
    }

    public void cancel() {
        if (STATUS_CANCELED.equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "SubscriptionAlreadyCanceled", "Subscription is already canceled");
        }
        this.status = STATUS_CANCELED;
        this.canceledAt = LocalDateTime.now();
    }

    public void cancelAtPeriodEnd() {
        if (STATUS_CANCELED.equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "SubscriptionAlreadyCanceled", "Subscription is already canceled");
        }
        this.cancelAtPeriodEnd = true;
    }

    public void reactivate() {
        if (!STATUS_CANCELED.equals(this.status) && !this.cancelAtPeriodEnd) {
            throw new BusinessRuleValidationException(
                    "SubscriptionNotCanceled", "Subscription is not canceled or pending cancellation");
        }
        this.status = STATUS_ACTIVE;
        this.cancelAtPeriodEnd = false;
        this.canceledAt = null;
    }

    public void resetMonthlyUsage() {
        this.surveysUsed = 0;
        this.verificationsUsed = 0;
        this.usageResetAt = LocalDateTime.now().plusMonths(1);
        this.currentPeriodStart = LocalDateTime.now();
        this.currentPeriodEnd = LocalDateTime.now().plusMonths(1);
    }

    public void updatePlan(final String newPlan, final int newMonthlySurveys, final int newMonthlyVerifications) {
        if (newPlan == null || newPlan.isBlank()) {
            throw new BusinessRuleValidationException(
                    "SubscriptionPlanRequired", "New plan must not be blank");
        }
        this.plan = newPlan;
        this.monthlySurveys = newMonthlySurveys;
        this.monthlyVerifications = newMonthlyVerifications;
    }

    public void setStripeSubscriptionId(final String stripeSubscriptionId) {
        this.stripeSubscriptionId = stripeSubscriptionId;
    }

    public void setStripeCustomerId(final String stripeCustomerId) {
        this.stripeCustomerId = stripeCustomerId;
    }

    public void setStatus(final String status) {
        this.status = status;
    }

    public void setCurrentPeriodStart(final LocalDateTime currentPeriodStart) {
        this.currentPeriodStart = currentPeriodStart;
    }

    public void setCurrentPeriodEnd(final LocalDateTime currentPeriodEnd) {
        this.currentPeriodEnd = currentPeriodEnd;
    }

    public void setTrialStart(final LocalDateTime trialStart) {
        this.trialStart = trialStart;
    }

    public void setTrialEnd(final LocalDateTime trialEnd) {
        this.trialEnd = trialEnd;
    }
}
