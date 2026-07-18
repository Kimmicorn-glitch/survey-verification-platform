package com.backofficepro.surveyplatform.survey.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a survey is published and made active.
 *
 * @author BackOffice Pro
 */
public class SurveyPublishedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "SURVEY_PUBLISHED";

    private final String title;
    private final String creatorId;
    private final int questionCount;

    /**
     * Constructs a SurveyPublishedEvent.
     *
     * @param surveyId      the survey identifier
     * @param title         the survey title
     * @param creatorId     the creator's user identifier
     * @param questionCount the number of questions in the survey
     */
    public SurveyPublishedEvent(final String surveyId, final String title,
                                final String creatorId, final int questionCount) {
        super(EVENT_TYPE, surveyId);
        this.title = title;
        this.creatorId = creatorId;
        this.questionCount = questionCount;
    }

    public String getTitle() {
        return title;
    }

    public String getCreatorId() {
        return creatorId;
    }

    public int getQuestionCount() {
        return questionCount;
    }
}
