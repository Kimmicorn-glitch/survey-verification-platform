package com.backofficepro.surveyplatform.survey.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a survey is closed.
 *
 * @author BackOffice Pro
 */
public class SurveyClosedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "SURVEY_CLOSED";

    private final String title;
    private final String creatorId;

    /**
     * Constructs a SurveyClosedEvent.
     *
     * @param surveyId  the survey identifier
     * @param title     the survey title
     * @param creatorId the creator's user identifier
     */
    public SurveyClosedEvent(final String surveyId, final String title, final String creatorId) {
        super(EVENT_TYPE, surveyId);
        this.title = title;
        this.creatorId = creatorId;
    }

    public String getTitle() {
        return title;
    }

    public String getCreatorId() {
        return creatorId;
    }
}
