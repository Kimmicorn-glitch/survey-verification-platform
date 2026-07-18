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
@Table(name = "invoices", schema = "payment")
public class Invoice extends BaseEntity {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PAID = "PAID";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_REFUNDED = "REFUNDED";

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "subscription_id", nullable = false)
    private UUID subscriptionId;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "stripe_invoice_id")
    private String stripeInvoiceId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "period_start")
    private LocalDateTime periodStart;

    @Column(name = "period_end")
    private LocalDateTime periodEnd;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "line_items", columnDefinition = "jsonb")
    private String lineItems;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    protected Invoice() {
        super();
    }

    public static Invoice create(final String userId,
                                 final UUID subscriptionId,
                                 final String invoiceNumber,
                                 final BigDecimal amount,
                                 final String currency) {
        if (userId == null || userId.isBlank()) {
            throw new BusinessRuleValidationException(
                    "InvoiceUserIdRequired", "User ID must not be blank");
        }
        if (subscriptionId == null) {
            throw new BusinessRuleValidationException(
                    "InvoiceSubscriptionIdRequired", "Subscription ID must not be null");
        }
        if (invoiceNumber == null || invoiceNumber.isBlank()) {
            throw new BusinessRuleValidationException(
                    "InvoiceNumberRequired", "Invoice number must not be blank");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleValidationException(
                    "InvoiceAmountInvalid", "Invoice amount must be greater than zero");
        }
        if (currency == null || currency.isBlank()) {
            throw new BusinessRuleValidationException(
                    "InvoiceCurrencyRequired", "Currency must not be blank");
        }

        final Invoice invoice = new Invoice();
        invoice.userId = userId;
        invoice.subscriptionId = subscriptionId;
        invoice.invoiceNumber = invoiceNumber;
        invoice.amount = amount;
        invoice.currency = currency.toUpperCase();
        invoice.status = STATUS_PENDING;
        invoice.taxAmount = BigDecimal.ZERO;
        invoice.totalAmount = amount;
        return invoice;
    }

    public void markAsPaid(final String stripeInvoiceId, final String stripePaymentIntentId) {
        if (STATUS_PAID.equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "InvoiceAlreadyPaid", "Invoice is already paid");
        }
        this.status = STATUS_PAID;
        this.stripeInvoiceId = stripeInvoiceId;
        this.stripePaymentIntentId = stripePaymentIntentId;
        this.paidAt = LocalDateTime.now();
    }

    public void markAsFailed(final String reason) {
        this.status = STATUS_FAILED;
        this.description = (this.description != null ? this.description + " | " : "") + "Failed: " + reason;
    }

    public void markAsRefunded() {
        if (!STATUS_PAID.equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "InvoiceNotPaid", "Only paid invoices can be refunded");
        }
        this.status = STATUS_REFUNDED;
    }

    public void setTaxAmount(final BigDecimal taxAmount) {
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.totalAmount = this.amount.add(this.taxAmount);
    }

    public void setLineItems(final String lineItems) {
        this.lineItems = lineItems;
    }

    public void setPdfUrl(final String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public void setDescription(final String description) {
        this.description = description;
    }

    public void setDueDate(final LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public void setPeriodStart(final LocalDateTime periodStart) {
        this.periodStart = periodStart;
    }

    public void setPeriodEnd(final LocalDateTime periodEnd) {
        this.periodEnd = periodEnd;
    }
}
