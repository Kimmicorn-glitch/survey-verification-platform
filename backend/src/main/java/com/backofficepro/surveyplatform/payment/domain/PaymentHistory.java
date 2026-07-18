package com.backofficepro.surveyplatform.payment.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "payment_history", schema = "payment")
public class PaymentHistory extends BaseEntity {

    public static final String STATUS_SUCCEEDED = "SUCCEEDED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_REFUNDED = "REFUNDED";

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "stripe_payment_id")
    private String stripePaymentId;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    protected PaymentHistory() {
        super();
    }

    public static PaymentHistory create(final String userId,
                                        final UUID invoiceId,
                                        final BigDecimal amount,
                                        final String currency,
                                        final String paymentMethod) {
        if (userId == null || userId.isBlank()) {
            throw new BusinessRuleValidationException(
                    "PaymentHistoryUserIdRequired", "User ID must not be blank");
        }
        if (invoiceId == null) {
            throw new BusinessRuleValidationException(
                    "PaymentHistoryInvoiceIdRequired", "Invoice ID must not be null");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleValidationException(
                    "PaymentHistoryAmountInvalid", "Payment amount must be greater than zero");
        }
        if (currency == null || currency.isBlank()) {
            throw new BusinessRuleValidationException(
                    "PaymentHistoryCurrencyRequired", "Currency must not be blank");
        }

        final PaymentHistory history = new PaymentHistory();
        history.userId = userId;
        history.invoiceId = invoiceId;
        history.amount = amount;
        history.currency = currency.toUpperCase();
        history.status = STATUS_PENDING;
        history.paymentMethod = paymentMethod;
        return history;
    }

    public void markAsSucceeded(final String stripePaymentId) {
        this.status = STATUS_SUCCEEDED;
        this.stripePaymentId = stripePaymentId;
        this.processedAt = LocalDateTime.now();
    }

    public void markAsFailed() {
        this.status = STATUS_FAILED;
        this.processedAt = LocalDateTime.now();
    }

    public void markAsRefunded() {
        this.status = STATUS_REFUNDED;
        this.processedAt = LocalDateTime.now();
    }

    public void setStripePaymentId(final String stripePaymentId) {
        this.stripePaymentId = stripePaymentId;
    }

    public void setDescription(final String description) {
        this.description = description;
    }

    public void setMetadata(final String metadata) {
        this.metadata = metadata;
    }

    public void setPaymentMethod(final String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
