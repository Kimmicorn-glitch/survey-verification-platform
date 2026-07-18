package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.survey.application.SurveyBranchingService;
import com.backofficepro.surveyplatform.survey.domain.BranchRule;
import com.backofficepro.surveyplatform.survey.domain.Question;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/surveys/{surveyId}/branching")
@Tag(name = "Survey Branching", description = "Survey branching and conditional logic endpoints")
public class SurveyBranchingController {

    private final SurveyBranchingService branchingService;

    public SurveyBranchingController(final SurveyBranchingService branchingService) {
        this.branchingService = branchingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Add branch rule", description = "Adds a branching rule to a survey")
    public ResponseEntity<ApiResponse<BranchRule>> addBranchRule(
            @PathVariable final String surveyId,
            @RequestBody final BranchRuleRequest request) {
        final BranchRule rule = branchingService.addBranchRule(
                surveyId, request.getSourceQuestionId(), request.getTargetQuestionId(),
                request.getConditionType(), request.getConditionValue(), request.getOperator());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rule, "Branch rule added successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get branch rules", description = "Gets all branch rules for a survey")
    public ResponseEntity<ApiResponse<List<BranchRule>>> getBranchRules(
            @PathVariable final String surveyId) {
        final List<BranchRule> rules = branchingService.getBranchRules(surveyId);
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/next")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get next questions", description = "Gets the next questions based on current answer")
    public ResponseEntity<ApiResponse<List<Question>>> getNextQuestions(
            @PathVariable final String surveyId,
            @RequestParam final String currentQuestionId,
            @RequestParam(required = false) final String answerValue) {
        final List<Question> next = branchingService.getNextQuestions(surveyId, currentQuestionId, answerValue);
        return ResponseEntity.ok(ApiResponse.success(next));
    }

    @DeleteMapping("/{ruleId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Delete branch rule", description = "Deletes a branch rule")
    public ResponseEntity<ApiResponse<Void>> deleteBranchRule(
            @PathVariable final String surveyId,
            @PathVariable final String ruleId) {
        branchingService.deleteBranchRule(ruleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Branch rule deleted successfully"));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Delete all branch rules", description = "Deletes all branch rules for a survey")
    public ResponseEntity<ApiResponse<Void>> deleteAllBranchRules(
            @PathVariable final String surveyId) {
        branchingService.deleteAllBranchRules(surveyId);
        return ResponseEntity.ok(ApiResponse.success(null, "All branch rules deleted successfully"));
    }

    public record BranchRuleRequest(
            @NotBlank String sourceQuestionId,
            @NotBlank String targetQuestionId,
            @NotBlank String conditionType,
            @NotBlank String conditionValue,
            String operator
    ) {}
}
