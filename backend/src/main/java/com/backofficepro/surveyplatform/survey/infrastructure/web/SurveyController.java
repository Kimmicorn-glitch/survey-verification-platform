package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import com.backofficepro.surveyplatform.survey.application.SurveyService;
import com.backofficepro.surveyplatform.survey.application.dto.request.AddQuestionRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.CreateSurveyRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.SubmitSurveyResponseRequest;
import com.backofficepro.surveyplatform.survey.application.dto.response.SurveyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for survey management operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/surveys")
@Tag(name = "Surveys", description = "Survey management endpoints")
public class SurveyController {

    private final SurveyService surveyService;

    /**
     * Constructs a new SurveyController.
     *
     * @param surveyService the survey service
     */
    public SurveyController(final SurveyService surveyService) {
        this.surveyService = surveyService;
    }

    /**
     * Creates a new survey.
     *
     * @param request        the creation request
     * @param authentication the current user
     * @return the created survey
     */
    @PostMapping
    @Operation(summary = "Create survey", description = "Creates a new survey")
    public ResponseEntity<ApiResponse<SurveyResponse>> createSurvey(
            @Valid @RequestBody final CreateSurveyRequest request,
            final Authentication authentication) {
        final SurveyResponse survey = surveyService.createSurvey(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(survey, "Survey created successfully"));
    }

    /**
     * Retrieves a survey by ID.
     *
     * @param id the survey identifier
     * @return the survey details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get survey", description = "Retrieves a survey by its identifier")
    public ResponseEntity<ApiResponse<SurveyResponse>> getSurvey(@PathVariable final String id) {
        final SurveyResponse survey = surveyService.getSurvey(id);
        return ResponseEntity.ok(ApiResponse.success(survey));
    }

    /**
     * Lists surveys for the current user.
     *
     * @param page the page number
     * @param size the page size
     * @param authentication the current user
     * @return paginated survey list
     */
    @GetMapping("/my")
    @Operation(summary = "List my surveys", description = "Lists surveys created by the current user")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyResponse>>> listMySurveys(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size,
            final Authentication authentication) {
        final Page<SurveyResponse> surveys = surveyService.listUserSurveys(
                authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(surveys)));
    }

    /**
     * Lists all active surveys.
     *
     * @param page the page number
     * @param size the page size
     * @return paginated list of active surveys
     */
    @GetMapping("/active")
    @Operation(summary = "List active surveys", description = "Lists all currently active surveys")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyResponse>>> listActiveSurveys(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<SurveyResponse> surveys = surveyService.listActiveSurveys(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(surveys)));
    }

    /**
     * Adds a question to a survey.
     *
     * @param surveyId       the survey identifier
     * @param request        the question request
     * @param authentication the current user
     * @return the updated survey
     */
    @PostMapping("/{id}/questions")
    @Operation(summary = "Add question", description = "Adds a question to a survey")
    public ResponseEntity<ApiResponse<SurveyResponse>> addQuestion(
            @PathVariable final String id,
            @Valid @RequestBody final AddQuestionRequest request,
            final Authentication authentication) {
        final SurveyResponse survey = surveyService.addQuestion(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(survey, "Question added successfully"));
    }

    /**
     * Publishes a survey.
     *
     * @param id             the survey identifier
     * @param authentication the current user
     * @return the updated survey
     */
    @PutMapping("/{id}/publish")
    @Operation(summary = "Publish survey", description = "Publishes a survey, making it active")
    public ResponseEntity<ApiResponse<SurveyResponse>> publishSurvey(
            @PathVariable final String id,
            final Authentication authentication) {
        final SurveyResponse survey = surveyService.publishSurvey(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(survey, "Survey published successfully"));
    }

    /**
     * Closes a survey.
     *
     * @param id             the survey identifier
     * @param authentication the current user
     * @return the updated survey
     */
    @PutMapping("/{id}/close")
    @Operation(summary = "Close survey", description = "Closes a survey, preventing further responses")
    public ResponseEntity<ApiResponse<SurveyResponse>> closeSurvey(
            @PathVariable final String id,
            final Authentication authentication) {
        final SurveyResponse survey = surveyService.closeSurvey(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(survey, "Survey closed successfully"));
    }

    /**
     * Submits a response to a survey.
     *
     * @param request the response submission request
     * @return the submission confirmation
     */
    @PostMapping("/responses")
    @Operation(summary = "Submit response", description = "Submits a response to a survey")
    public ResponseEntity<ApiResponse<String>> submitResponse(
            @Valid @RequestBody final SubmitSurveyResponseRequest request) {
        final String result = surveyService.submitResponse(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Deletes a survey (admin only).
     *
     * @param id the survey identifier
     * @return success response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete survey", description = "Deletes a survey (admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteSurvey(@PathVariable final String id) {
        surveyService.deleteSurvey(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Survey deleted successfully"));
    }
}
