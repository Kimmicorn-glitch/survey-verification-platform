package com.backofficepro.surveyplatform.survey.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a survey response is submitted.
 *
 * @author BackOffice Pro
 */
public class SurveyResponseSubmittedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "SURVEY_RESPONSE_SUBMITTED";

    private final String surveyId;
    private final String respondentId;
    private final int responseCount;

    /**
     * Constructs a SurveyResponseSubmittedEvent.
     *
     * @param surveyId     the survey identifier
     * @param respondentId the respondent's identifier
     * @param responseCount the total response count after this submission
     */
    public SurveyResponseSubmittedEvent(final String surveyId, final String respondentId,
                                        final int responseCount) {
        super(EVENT_TYPE, surveyId);
        this.surveyId = surveyId;
        this.respondentId = respondentId;
        this.responseCount = responseCount;
    }

    public String getSurveyId() {
        return surveyId;
    }

    public String getRespondentId() {
        return respondentId;
    }

    public int getResponseCount() {
        return responseCount;
    }
}
