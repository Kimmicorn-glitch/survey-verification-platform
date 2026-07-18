package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.survey.application.SurveyAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/surveys/{surveyId}/analytics")
@Tag(name = "Survey Analytics", description = "Survey analytics and reporting endpoints")
public class SurveyAnalyticsController {

    private final SurveyAnalyticsService analyticsService;

    public SurveyAnalyticsController(final SurveyAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @Operation(summary = "Get survey analytics", description = "Gets comprehensive analytics for a survey")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSurveyAnalytics(
            @PathVariable final String surveyId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSurveyAnalytics(surveyId)));
    }

    @GetMapping("/questions/{questionId}")
    @Operation(summary = "Get question analytics", description = "Gets analytics for a specific question")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQuestionAnalytics(
            @PathVariable final String surveyId,
            @PathVariable final String questionId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getQuestionAnalytics(surveyId, questionId)));
    }

    @GetMapping("/timeline")
    @Operation(summary = "Get response timeline", description = "Gets the response timeline for a survey")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResponseTimeline(
            @PathVariable final String surveyId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getResponseTimeline(surveyId)));
    }
}
