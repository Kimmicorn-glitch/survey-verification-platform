package com.backofficepro.surveyplatform.survey.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Request DTO for creating a new survey.
 *
 * @author BackOffice Pro
 */
@Data
public class CreateSurveyRequest {

    @NotBlank(message = "Survey title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    private boolean anonymous;

    private Integer maxResponses;

    private LocalDateTime endsAt;
}
