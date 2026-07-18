package com.backofficepro.surveyplatform.payment.application.dto;

import java.math.BigDecimal;

public record InvoiceData(
        String invoiceNumber,
        String date,
        String organizationName,
        String planName,
        BigDecimal amount,
        BigDecimal tax,
        BigDecimal total
) {
}
