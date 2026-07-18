package com.backofficepro.surveyplatform.survey.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request DTO for adding a question to a survey.
 *
 * @author BackOffice Pro
 */
@Data
public class AddQuestionRequest {

    @NotBlank(message = "Question text is required")
    @Size(min = 1, max = 1000, message = "Question text must be between 1 and 1000 characters")
    private String text;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Question type is required")
    private String questionType;

    private boolean required;

    private Integer minValue;
    private Integer maxValue;

    private List<OptionRequest> options;

    /**
     * Nested DTO for question options.
     */
    @Data
    public static class OptionRequest {
        @NotBlank(message = "Option text is required")
        private String text;
        private String value;
    }
}
