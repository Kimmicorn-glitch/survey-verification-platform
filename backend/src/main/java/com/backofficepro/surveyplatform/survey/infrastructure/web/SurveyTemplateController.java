package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import com.backofficepro.surveyplatform.survey.application.SurveyTemplateService;
import com.backofficepro.surveyplatform.survey.domain.SurveyTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api/v1/templates")
@Tag(name = "Survey Templates", description = "Survey template management endpoints")
public class SurveyTemplateController {

    private final SurveyTemplateService templateService;

    public SurveyTemplateController(final SurveyTemplateService templateService) {
        this.templateService = templateService;
    }

    @PostMapping
    @Operation(summary = "Create template", description = "Creates a new survey template")
    public ResponseEntity<ApiResponse<SurveyTemplate>> createTemplate(
            @Valid @RequestBody final CreateTemplateRequest request,
            final Authentication authentication) {
        final SurveyTemplate template = templateService.createTemplate(
                request.getName(), request.getDescription(), request.getCategory(),
                authentication.getName(), request.getTemplateData());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(template, "Template created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get template", description = "Gets a template by ID")
    public ResponseEntity<ApiResponse<SurveyTemplate>> getTemplate(@PathVariable final String id) {
        return ResponseEntity.ok(ApiResponse.success(templateService.getTemplate(id)));
    }

    @GetMapping("/public")
    @Operation(summary = "List public templates", description = "Lists all public templates")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyTemplate>>> listPublicTemplates(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<SurveyTemplate> templates = templateService.listPublicTemplates(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(templates)));
    }

    @GetMapping("/my")
    @Operation(summary = "List my templates", description = "Lists templates created by the current user")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyTemplate>>> listMyTemplates(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size,
            final Authentication authentication) {
        final Page<SurveyTemplate> templates = templateService.listUserTemplates(authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(templates)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "List by category", description = "Lists templates by category")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyTemplate>>> listByCategory(
            @PathVariable final String category,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<SurveyTemplate> templates = templateService.listByCategory(category, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(templates)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search templates", description = "Searches templates by name or description")
    public ResponseEntity<ApiResponse<PaginatedResponse<SurveyTemplate>>> searchTemplates(
            @RequestParam final String q,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<SurveyTemplate> templates = templateService.searchTemplates(q, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(templates)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update template", description = "Updates a template")
    public ResponseEntity<ApiResponse<SurveyTemplate>> updateTemplate(
            @PathVariable final String id,
            @RequestBody final UpdateTemplateRequest request,
            final Authentication authentication) {
        final SurveyTemplate template = templateService.updateTemplate(
                id, request.getName(), request.getDescription(), request.getCategory(),
                request.getTemplateData(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(template, "Template updated successfully"));
    }

    @PutMapping("/{id}/publish")
    @Operation(summary = "Publish template", description = "Makes a template public")
    public ResponseEntity<ApiResponse<Void>> publishTemplate(
            @PathVariable final String id,
            final Authentication authentication) {
        templateService.publishTemplate(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Template published successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete template", description = "Deletes a template")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(
            @PathVariable final String id,
            final Authentication authentication) {
        templateService.deleteTemplate(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Template deleted successfully"));
    }

    public record CreateTemplateRequest(
            @NotBlank String name,
            String description,
            @NotBlank String category,
            @NotBlank String templateData
    ) {}

    public record UpdateTemplateRequest(
            String name,
            String description,
            String category,
            String templateData
    ) {}
}
