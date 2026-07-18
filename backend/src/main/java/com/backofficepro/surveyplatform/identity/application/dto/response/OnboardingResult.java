package com.backofficepro.surveyplatform.identity.application.dto.response;

public record OnboardingResult(
        String organizationId,
        boolean success,
        String message
) {
}
