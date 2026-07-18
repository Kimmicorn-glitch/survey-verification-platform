package com.backofficepro.surveyplatform.verification.domain;

import com.backofficepro.surveyplatform.shared.domain.AggregateRoot;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.verification.domain.event.VerificationCompletedEvent;
import com.backofficepro.surveyplatform.verification.domain.event.VerificationRequestedEvent;
import com.backofficepro.surveyplatform.verification.domain.valueobject.VerificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Aggregate root representing a verification request.
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "verification_requests", schema = "verification")
public class VerificationRequest extends AggregateRoot {

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

    protected VerificationRequest() {
        super();
    }

    /**
     * Creates a new verification request.
     *
     * @param surveyId         the survey to verify
     * @param respondentId     the respondent to verify
     * @param verificationType the type of verification
     * @param expiresAt        when the request expires
     * @return the new VerificationRequest
     */
    public static VerificationRequest create(final String surveyId,
                                             final String respondentId,
                                             final String verificationType,
                                             final LocalDateTime expiresAt) {
        if (surveyId == null || surveyId.isBlank()) {
            throw new BusinessRuleValidationException(
                    "SurveyIdRequired", "Survey ID is required for verification");
        }
        if (respondentId == null || respondentId.isBlank()) {
            throw new BusinessRuleValidationException(
                    "RespondentIdRequired", "Respondent ID is required for verification");
        }
        final VerificationRequest request = new VerificationRequest();
        request.surveyId = surveyId;
        request.respondentId = respondentId;
        request.verificationType = verificationType;
        request.status = VerificationStatus.PENDING.getValue();
        request.expiresAt = expiresAt;
        request.registerEvent(new VerificationRequestedEvent(
                null, surveyId, respondentId, verificationType));
        return request;
    }

    /**
     * Starts the verification process.
     *
     * @param verifierId the verifier performing the check
     */
    public void start(final String verifierId) {
        if (!VerificationStatus.PENDING.getValue().equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "InvalidState", "Only PENDING requests can be started");
        }
        this.verifierId = verifierId;
        this.status = VerificationStatus.IN_PROGRESS.getValue();
        this.startedAt = LocalDateTime.now();
    }

    /**
     * Completes the verification with a result.
     *
     * @param result          the verification result
     * @param confidenceScore the confidence score (0.0 to 1.0)
     * @param notes           additional notes
     */
    public void complete(final String result, final Double confidenceScore, final String notes) {
        if (!VerificationStatus.IN_PROGRESS.getValue().equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "InvalidState", "Only IN_PROGRESS requests can be completed");
        }
        this.result = result;
        this.confidenceScore = confidenceScore;
        this.notes = notes;
        this.status = VerificationStatus.COMPLETED.getValue();
        this.completedAt = LocalDateTime.now();
        registerEvent(new VerificationCompletedEvent(
                getId().toString(), surveyId, respondentId, result, confidenceScore));
    }

    /**
     * Fails the verification.
     *
     * @param reason the failure reason
     */
    public void fail(final String reason) {
        this.result = reason;
        this.status = VerificationStatus.FAILED.getValue();
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Cancels the verification request.
     */
    public void cancel() {
        this.status = VerificationStatus.CANCELLED.getValue();
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Checks if the verification has expired.
     *
     * @return true if expired
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
