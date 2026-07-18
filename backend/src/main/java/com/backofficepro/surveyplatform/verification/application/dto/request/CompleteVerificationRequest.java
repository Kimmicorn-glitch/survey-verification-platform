package com.backofficepro.surveyplatform.verification.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for completing a verification.
 *
 * @author BackOffice Pro
 */
@Data
public class CompleteVerificationRequest {

    @NotNull(message = "Result is required")
    private String result;

    private Double confidenceScore;
    private String notes;
}
