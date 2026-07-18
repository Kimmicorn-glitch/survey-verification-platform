package com.backofficepro.surveyplatform.shared.infrastructure.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST controller returning application version and build metadata.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/system")
@Tag(name = "System", description = "System health, diagnostics, and version endpoints")
public class VersionController {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Value("${app.version:1.0.0-SNAPSHOT}")
    private String appVersion;

    @Value("${app.build-time:unknown}")
    private String buildTime;

    @Value("${app.git-commit:unknown}")
    private String gitCommit;

    private final Environment environment;

    /**
     * Constructs a new VersionController.
     *
     * @param environment the Spring environment
     */
    public VersionController(final Environment environment) {
        this.environment = environment;
    }

    /**
     * Returns the current application version, git commit, and build timestamp.
     *
     * @return version metadata payload
     */
    @GetMapping("/version")
    @Operation(summary = "Application version", description = "Returns the current version, git commit, and build info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVersion() {
        final Map<String, Object> versionInfo = new LinkedHashMap<>();
        versionInfo.put("version", appVersion);
        versionInfo.put("gitCommit", gitCommit);
        versionInfo.put("buildTime", buildTime);
        versionInfo.put("activeProfiles", environment.getActiveProfiles());
        versionInfo.put("serverTime", LocalDateTime.now());
        versionInfo.put("serverZone", ZoneId.systemDefault().getId());
        versionInfo.put("javaVersion", System.getProperty("java.version"));
        versionInfo.put("vmName", ManagementFactory.getRuntimeMXBean().getVmName());

        return ResponseEntity.ok(ApiResponse.success(versionInfo, "Version information retrieved successfully"));
    }
}
