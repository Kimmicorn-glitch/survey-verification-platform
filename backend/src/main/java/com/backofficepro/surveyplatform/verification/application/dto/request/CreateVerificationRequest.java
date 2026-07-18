package com.backofficepro.surveyplatform.verification.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request DTO for creating a verification request.
 *
 * @author BackOffice Pro
 */
@Data
public class CreateVerificationRequest {

    @NotBlank(message = "Survey ID is required")
    private String surveyId;

    @NotBlank(message = "Respondent ID is required")
    private String respondentId;

    @NotBlank(message = "Verification type is required")
    private String verificationType;

    private LocalDateTime expiresAt;
}
