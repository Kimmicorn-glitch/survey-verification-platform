package com.backofficepro.surveyplatform.audit.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "audit_logs", schema = "audit")
public class AuditLog extends BaseEntity {

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 100)
    private String entityType;

    @Column(nullable = false, length = 255)
    private String entityId;

    @Column(columnDefinition = "jsonb")
    private String oldValues;

    @Column(columnDefinition = "jsonb")
    private String newValues;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(length = 100)
    private String requestId;

    private Long durationMs;

    @Column(nullable = false, length = 20)
    private String status;

    public static AuditLog create(String userId, String action, String entityType, String entityId) {
        return AuditLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .status("SUCCESS")
                .build();
    }
}
