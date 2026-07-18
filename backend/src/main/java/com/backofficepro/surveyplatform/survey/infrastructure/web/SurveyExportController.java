package com.backofficepro.surveyplatform.survey.infrastructure.web;

import com.backofficepro.surveyplatform.survey.application.SurveyExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/surveys/{surveyId}/export")
@Tag(name = "Survey Export", description = "Survey data export endpoints")
public class SurveyExportController {

    private final SurveyExportService exportService;

    public SurveyExportController(final SurveyExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/csv")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Export to CSV", description = "Exports survey responses to CSV format")
    public ResponseEntity<byte[]> exportCsv(@PathVariable final String surveyId) {
        final byte[] csvData = exportService.exportToCsv(surveyId);
        final String filename = "survey-" + surveyId + "-responses.csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .contentLength(csvData.length)
                .body(csvData);
    }

    @GetMapping("/json")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Export to JSON", description = "Exports survey responses to JSON format")
    public ResponseEntity<Map<String, Object>> exportJson(@PathVariable final String surveyId) {
        return ResponseEntity.ok(exportService.exportToJson(surveyId));
    }
}
