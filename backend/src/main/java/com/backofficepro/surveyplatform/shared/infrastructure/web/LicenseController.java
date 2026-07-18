package com.backofficepro.surveyplatform.shared.infrastructure.web;

import com.backofficepro.surveyplatform.shared.domain.model.License;
import com.backofficepro.surveyplatform.shared.domain.model.LicenseRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for software license management and validation.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/licenses")
@Tag(name = "Licenses", description = "License validation and management endpoints")
public class LicenseController {

    private final LicenseRepository licenseRepository;

    /**
     * Constructs a new LicenseController.
     *
     * @param licenseRepository the license repository
     */
    public LicenseController(final LicenseRepository licenseRepository) {
        this.licenseRepository = licenseRepository;
    }

    /**
     * Validates a license key and returns its status and limits.
     *
     * @param licenseId the license identifier
     * @return the license validation result
     */
    @GetMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Validate license", description = "Validates a license and returns its current status and limits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateLicense(@PathVariable final UUID id) {
        final var license = licenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("License not found"));

        final Map<String, Object> result = new LinkedHashMap<>();
        result.put("licenseId", license.getId());
        result.put("organizationId", license.getOrganizationId());
        result.put("plan", license.getPlan());
        result.put("isValid", license.isValid());
        result.put("isActive", license.isActive());
        result.put("maxUsers", license.getMaxUsers());
        result.put("maxSurveys", license.getMaxSurveys());
        result.put("expiresAt", license.getExpiresAt());
        result.put("expiresSoon", license.getExpiresAt().isBefore(LocalDateTime.now().plusDays(30)));

        final String message = license.isActive()
                ? "License is valid and active"
                : "License is invalid or expired";

        return ResponseEntity.ok(ApiResponse.success(result, message));
    }
}
