package com.backofficepro.surveyplatform.payment.application;

import com.backofficepro.surveyplatform.payment.application.dto.InvoiceData;
import com.backofficepro.surveyplatform.payment.domain.Invoice;
import com.backofficepro.surveyplatform.payment.domain.repository.InvoiceRepository;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class InvoicePdfService {

    private static final Logger log = LoggerFactory.getLogger(InvoicePdfService.class);

    private final InvoiceRepository invoiceRepository;

    public InvoicePdfService(final InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public InvoiceData generateInvoiceData(final String invoiceId) {
        final Invoice invoice = invoiceRepository.findById(UUID.fromString(invoiceId))
                .orElseThrow(() -> new EntityNotFoundException("Invoice", invoiceId));

        log.info("Generating invoice data for {}", invoice.getInvoiceNumber());

        return new InvoiceData(
                invoice.getInvoiceNumber(),
                invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : "",
                invoice.getUserId(),
                "Unknown",
                invoice.getAmount(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount());
    }

    public String renderInvoiceHtml(final InvoiceData invoiceData) {
        return """
                <html>
                <head><title>Invoice %s</title></head>
                <body>
                    <h1>Invoice</h1>
                    <p><strong>Invoice Number:</strong> %s</p>
                    <p><strong>Date:</strong> %s</p>
                    <p><strong>Organization:</strong> %s</p>
                    <p><strong>Plan:</strong> %s</p>
                    <table>
                        <tr><td>Amount</td><td>%s</td></tr>
                        <tr><td>Tax</td><td>%s</td></tr>
                        <tr><td><strong>Total</strong></td><td><strong>%s</strong></td></tr>
                    </table>
                </body>
                </html>
                """.formatted(
                invoiceData.invoiceNumber(),
                invoiceData.invoiceNumber(),
                invoiceData.date(),
                invoiceData.organizationName(),
                invoiceData.planName(),
                invoiceData.amount(),
                invoiceData.tax(),
                invoiceData.total());
    }
}
