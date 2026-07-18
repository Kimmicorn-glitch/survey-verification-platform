package com.backofficepro.surveyplatform.audit.infrastructure.web;

import com.backofficepro.surveyplatform.audit.application.AuditService;
import com.backofficepro.surveyplatform.audit.domain.AuditLog;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Audit log management endpoints")
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit logs", description = "Retrieve paginated audit logs with optional filters")
    public ResponseEntity<ApiResponse<PaginatedResponse<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (entityType != null && entityId != null) {
            List<AuditLog> logs = auditService.getEntityAuditLogs(entityType, entityId);
            PaginatedResponse<AuditLog> response = PaginatedResponse.<AuditLog>builder()
                    .content(logs)
                    .page(0)
                    .size(logs.size())
                    .totalElements(logs.size())
                    .totalPages(1)
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response));
        }

        Page<AuditLog> logs = auditService.getAuditLogs(userId, page, size);
        PaginatedResponse<AuditLog> response = PaginatedResponse.<AuditLog>builder()
                .content(logs.getContent())
                .page(logs.getNumber())
                .size(logs.getSize())
                .totalElements(logs.getTotalElements())
                .totalPages(logs.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/logs/recent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent activity", description = "Retrieve recent audit activity for the current user")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentActivity(Authentication authentication) {
        String userId = authentication.getName();
        List<AuditLog> activity = auditService.getRecentActivity(userId);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit statistics", description = "Retrieve audit statistics and action counts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditStats() {
        Map<String, Object> stats = auditService.getAuditStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
