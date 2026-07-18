package com.backofficepro.surveyplatform.survey.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Request DTO for submitting survey responses.
 *
 * @author BackOffice Pro
 */
@Data
public class SubmitSurveyResponseRequest {

    @NotNull(message = "Survey ID is required")
    private String surveyId;

    private String respondentId;
    private String sessionId;

    @NotNull(message = "Responses are required")
    private List<AnswerRequest> responses;

    /**
     * Nested DTO for a single answer.
     */
    @Data
    public static class AnswerRequest {
        @NotNull(message = "Question ID is required")
        private String questionId;
        private String textAnswer;
        private Integer numericAnswer;
        private String selectedOptionId;
        private String fileUrl;
    }
}
