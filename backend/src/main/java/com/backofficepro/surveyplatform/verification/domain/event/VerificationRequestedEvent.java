package com.backofficepro.surveyplatform.verification.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a verification is requested.
 *
 * @author BackOffice Pro
 */
public class VerificationRequestedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "VERIFICATION_REQUESTED";

    private final String surveyId;
    private final String respondentId;
    private final String verificationType;

    public VerificationRequestedEvent(final String verificationId,
                                      final String surveyId,
                                      final String respondentId,
                                      final String verificationType) {
        super(EVENT_TYPE, verificationId);
        this.surveyId = surveyId;
        this.respondentId = respondentId;
        this.verificationType = verificationType;
    }

    public String getSurveyId() {
        return surveyId;
    }

    public String getRespondentId() {
        return respondentId;
    }

    public String getVerificationType() {
        return verificationType;
    }
}
