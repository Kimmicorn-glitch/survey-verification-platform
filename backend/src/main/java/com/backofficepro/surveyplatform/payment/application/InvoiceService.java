package com.backofficepro.surveyplatform.payment.application;

import com.backofficepro.surveyplatform.payment.domain.Invoice;
import com.backofficepro.surveyplatform.payment.domain.PaymentHistory;
import com.backofficepro.surveyplatform.payment.domain.Subscription;
import com.backofficepro.surveyplatform.payment.domain.repository.InvoiceRepository;
import com.backofficepro.surveyplatform.payment.domain.repository.PaymentHistoryRepository;
import com.backofficepro.surveyplatform.payment.domain.repository.SubscriptionRepository;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Transactional
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    // PLACEHOLDER: AtomicLong resets on application restart. In production, use a database-backed
    // sequence (e.g., a PostgreSQL sequence or hi-lo algorithm) to guarantee uniqueness.
    private static final AtomicLong SEQUENCE = new AtomicLong(0);

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;

    public InvoiceService(final InvoiceRepository invoiceRepository,
                          final SubscriptionRepository subscriptionRepository,
                          final PaymentHistoryRepository paymentHistoryRepository) {
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentHistoryRepository = paymentHistoryRepository;
    }

    public Invoice createInvoice(final String userId,
                                 final UUID subscriptionId,
                                 final BigDecimal amount,
                                 final String currency,
                                 final String description) {
        log.info("Creating invoice for user {} subscription {} amount {} {}",
                userId, subscriptionId, amount, currency);

        final String invoiceNumber = generateInvoiceNumber();

        final Invoice invoice = Invoice.create(userId, subscriptionId, invoiceNumber, amount, currency);
        invoice.setDescription(description);
        invoice.setDueDate(LocalDateTime.now().plusDays(30));

        final Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} created", saved.getInvoiceNumber());
        return saved;
    }

    @Transactional(readOnly = true)
    public Invoice getInvoice(final String invoiceId) {
        return invoiceRepository.findById(UUID.fromString(invoiceId))
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId));
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceByNumber(final String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceNumber));
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getUserInvoices(final String userId, final Pageable pageable) {
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getUserInvoicesByStatus(final String userId,
                                                  final String status,
                                                  final Pageable pageable) {
        return invoiceRepository.findByUserIdAndStatus(userId, status, pageable);
    }

    @Transactional(readOnly = true)
    public byte[] downloadInvoice(final String invoiceId) {
        final Invoice invoice = getInvoice(invoiceId);
        if (invoice.getPdfUrl() == null) {
            throw new BusinessRuleValidationException(
                    "InvoicePdfNotAvailable", "Invoice PDF has not been generated yet");
        }
        log.info("Download requested for invoice {}", invoice.getInvoiceNumber());
        return invoice.getPdfUrl().getBytes();
    }

    public Invoice markAsPaid(final String invoiceId,
                              final String stripeInvoiceId,
                              final String stripePaymentIntentId) {
        log.info("Marking invoice {} as paid via Stripe invoice {}", invoiceId, stripeInvoiceId);

        final Invoice invoice = getInvoice(invoiceId);
        invoice.markAsPaid(stripeInvoiceId, stripePaymentIntentId);

        final Invoice saved = invoiceRepository.save(invoice);

        recordPaymentHistory(saved, stripePaymentIntentId);

        log.info("Invoice {} marked as paid", saved.getInvoiceNumber());
        return saved;
    }

    @CircuitBreaker(name = "stripeService", fallbackMethod = "processPaymentFallback")
    @Retry(name = "stripeService")
    public Invoice processPayment(final String invoiceId, final String userId) {
        log.info("Processing payment for invoice {} by user {}", invoiceId, userId);

        final Invoice invoice = getInvoice(invoiceId);

        if (!invoice.getUserId().equals(userId)) {
            throw new BusinessRuleValidationException(
                    "Unauthorized", "You are not authorized to pay this invoice");
        }

        if (Invoice.STATUS_PAID.equals(invoice.getStatus())) {
            throw new BusinessRuleValidationException(
                    "InvoiceAlreadyPaid", "Invoice has already been paid");
        }

        final PaymentHistory history = PaymentHistory.create(
                userId,
                invoice.getId(),
                invoice.getTotalAmount(),
                invoice.getCurrency(),
                "card");

        history.setDescription("Payment for invoice " + invoice.getInvoiceNumber());
        paymentHistoryRepository.save(history);

        log.info("Payment processing initiated for invoice {}", invoice.getInvoiceNumber());
        return invoice;
    }

    public Invoice syncInvoiceStatus(final String stripeInvoiceId, final String status) {
        log.info("Syncing status for Stripe invoice {} to {}", stripeInvoiceId, status);

        final Invoice invoice = invoiceRepository.findByStripeInvoiceId(stripeInvoiceId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Invoice", "Stripe invoice " + stripeInvoiceId));

        switch (status) {
            case "paid":
                invoice.markAsPaid(stripeInvoiceId, invoice.getStripePaymentIntentId());
                break;
            case "void":
            case "uncollectible":
                invoice.markAsFailed("Stripe status: " + status);
                break;
            default:
                log.warn("Unhandled Stripe invoice status: {}", status);
        }

        return invoiceRepository.save(invoice);
    }

    private void recordPaymentHistory(final Invoice invoice, final String stripePaymentIntentId) {
        final PaymentHistory history = PaymentHistory.create(
                invoice.getUserId(),
                invoice.getId(),
                invoice.getTotalAmount(),
                invoice.getCurrency(),
                "card");
        history.markAsSucceeded(stripePaymentIntentId);
        history.setDescription("Payment for invoice " + invoice.getInvoiceNumber());
        paymentHistoryRepository.save(history);
    }

    private String generateInvoiceNumber() {
        final String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        final long seq = SEQUENCE.incrementAndGet();
        final long pendingCount = invoiceRepository.countByStatus(Invoice.STATUS_PENDING);
        return String.format("INV-%s-%04d", datePart, pendingCount + seq);
    }

    public Invoice processPaymentFallback(final String invoiceId,
                                          final String userId,
                                          final Throwable throwable) {
        log.error("Stripe circuit breaker open for payment processing, falling back. Error: {}",
                throwable.getMessage());
        return getInvoice(invoiceId);
    }
}
