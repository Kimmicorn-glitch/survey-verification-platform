package com.backofficepro.surveyplatform.verification.infrastructure.persistence;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity for verification request persistence.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "verification_requests", schema = "verification")
public class VerificationRequestJpaEntity extends BaseEntity {

    @Column(name = "survey_id", nullable = false)
    private String surveyId;

    @Column(name = "respondent_id", nullable = false)
    private String respondentId;

    @Column(name = "verifier_id")
    private String verifierId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "verification_type", nullable = false, length = 50)
    private String verificationType;

    @Column(name = "result", length = 1000)
    private String result;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
