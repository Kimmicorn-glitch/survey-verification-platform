package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing a single response to a survey question.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "survey_responses", schema = "survey")
public class SurveyResponse extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "respondent_id")
    private String respondentId;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "text_answer", length = 4000)
    private String textAnswer;

    @Column(name = "numeric_answer")
    private Integer numericAnswer;

    @Column(name = "selected_option_id")
    private String selectedOptionId;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "responded_at", nullable = false)
    private LocalDateTime respondedAt;

    /**
     * Creates a text-based response.
     *
     * @param survey      the survey
     * @param question    the question
     * @param respondentId the respondent identifier
     * @param textAnswer  the text answer
     * @return the new SurveyResponse entity
     */
    public static SurveyResponse createTextResponse(final Survey survey,
                                                    final Question question,
                                                    final String respondentId,
                                                    final String textAnswer) {
        final SurveyResponse response = new SurveyResponse();
        response.survey = survey;
        response.question = question;
        response.respondentId = respondentId;
        response.textAnswer = textAnswer;
        response.respondedAt = LocalDateTime.now();
        return response;
    }

    /**
     * Creates a numeric-based response.
     *
     * @param survey       the survey
     * @param question     the question
     * @param respondentId the respondent identifier
     * @param numericAnswer the numeric answer
     * @return the new SurveyResponse entity
     */
    public static SurveyResponse createNumericResponse(final Survey survey,
                                                       final Question question,
                                                       final String respondentId,
                                                       final Integer numericAnswer) {
        final SurveyResponse response = new SurveyResponse();
        response.survey = survey;
        response.question = question;
        response.respondentId = respondentId;
        response.numericAnswer = numericAnswer;
        response.respondedAt = LocalDateTime.now();
        return response;
    }

    /**
     * Creates a choice-based response.
     *
     * @param survey          the survey
     * @param question        the question
     * @param respondentId    the respondent identifier
     * @param selectedOptionId the selected option identifier
     * @return the new SurveyResponse entity
     */
    public static SurveyResponse createChoiceResponse(final Survey survey,
                                                      final Question question,
                                                      final String respondentId,
                                                      final String selectedOptionId) {
        final SurveyResponse response = new SurveyResponse();
        response.survey = survey;
        response.question = question;
        response.respondentId = respondentId;
        response.selectedOptionId = selectedOptionId;
        response.respondedAt = LocalDateTime.now();
        return response;
    }
}
