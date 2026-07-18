package com.backofficepro.surveyplatform.verification.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a verification is completed.
 *
 * @author BackOffice Pro
 */
public class VerificationCompletedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "VERIFICATION_COMPLETED";

    private final String surveyId;
    private final String respondentId;
    private final String result;
    private final Double confidenceScore;

    public VerificationCompletedEvent(final String verificationId,
                                      final String surveyId,
                                      final String respondentId,
                                      final String result,
                                      final Double confidenceScore) {
        super(EVENT_TYPE, verificationId);
        this.surveyId = surveyId;
        this.respondentId = respondentId;
        this.result = result;
        this.confidenceScore = confidenceScore;
    }

    public String getSurveyId() {
        return surveyId;
    }

    public String getRespondentId() {
        return respondentId;
    }

    public String getResult() {
        return result;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }
}
