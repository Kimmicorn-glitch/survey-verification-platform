package com.backofficepro.surveyplatform.verification.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for verification request details.
 *
 * @author BackOffice Pro
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {

    private UUID id;
    private String surveyId;
    private String respondentId;
    private String verifierId;
    private String status;
    private String verificationType;
    private String result;
    private Double confidenceScore;
    private String notes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
