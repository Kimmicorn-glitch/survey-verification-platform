package com.backofficepro.surveyplatform.survey.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO containing survey details.
 *
 * @author BackOffice Pro
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResponse {

    private UUID id;
    private String title;
    private String description;
    private String creatorId;
    private String status;
    private boolean anonymous;
    private Integer maxResponses;
    private int responseCount;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private List<QuestionResponse> questions;

    /**
     * Response DTO for question details within a survey.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private UUID id;
        private String text;
        private String description;
        private String questionType;
        private boolean required;
        private int sortOrder;
        private List<OptionResponse> options;
    }

    /**
     * Response DTO for question option details.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponse {
        private UUID id;
        private String text;
        private String value;
        private int sortOrder;
    }
}
