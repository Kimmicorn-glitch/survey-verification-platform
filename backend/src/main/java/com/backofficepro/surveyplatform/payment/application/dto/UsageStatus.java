package com.backofficepro.surveyplatform.payment.application.dto;

public record UsageStatus(
        long surveysUsed,
        long responsesUsed,
        long apiCallsUsed,
        long surveysLimit,
        long responsesLimit,
        boolean withinLimits
) {
}
