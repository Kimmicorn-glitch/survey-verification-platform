package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.survey.application.SurveyDistributionService;
import com.backofficepro.surveyplatform.survey.domain.SurveyDistribution;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/surveys/{surveyId}/distribute")
@Tag(name = "Survey Distribution", description = "Survey distribution endpoints")
public class SurveyDistributionController {

    private final SurveyDistributionService distributionService;

    public SurveyDistributionController(final SurveyDistributionService distributionService) {
        this.distributionService = distributionService;
    }

    @PostMapping
    @Operation(summary = "Distribute survey", description = "Distributes a survey via the specified channel")
    public ResponseEntity<ApiResponse<SurveyDistribution>> distributeSurvey(
            @PathVariable final String surveyId,
            @RequestBody final DistributeRequest request,
            final Authentication authentication) {
        final SurveyDistribution distribution = distributionService.distributeSurvey(
                surveyId, request.getChannel(), request.getTarget(), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(distribution, "Survey distributed successfully"));
    }

    @GetMapping
    @Operation(summary = "Get distributions", description = "Gets all distributions for a survey")
    public ResponseEntity<ApiResponse<List<SurveyDistribution>>> getDistributions(
            @PathVariable final String surveyId) {
        return ResponseEntity.ok(ApiResponse.success(distributionService.getDistributions(surveyId)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get distribution stats", description = "Gets distribution statistics for a survey")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDistributionStats(
            @PathVariable final String surveyId) {
        return ResponseEntity.ok(ApiResponse.success(distributionService.getDistributionStats(surveyId)));
    }

    public record DistributeRequest(
            @NotBlank String channel,
            @NotBlank String target
    ) {}
}
