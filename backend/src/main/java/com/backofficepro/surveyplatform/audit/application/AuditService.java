package com.backofficepro.surveyplatform.audit.application;

import com.backofficepro.surveyplatform.audit.domain.AuditLog;
import com.backofficepro.surveyplatform.audit.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditLog logAction(String userId, String action, String entityType, String entityId,
                              String oldValues, String newValues, String ipAddress,
                              String userAgent, String requestId) {
        AuditLog auditLog = AuditLog.create(userId, action, entityType, entityId);
        auditLog.setOldValues(oldValues);
        auditLog.setNewValues(newValues);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setRequestId(requestId);

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("Audit log recorded: userId={}, action={}, entityType={}, entityId={}", userId, action, entityType, entityId);
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(String userId, int page, int size) {
        log.debug("Fetching audit logs for userId={}, page={}, size={}", userId, page, size);
        return auditLogRepository.findByUserId(userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getEntityAuditLogs(String entityType, String entityId) {
        log.debug("Fetching audit logs for entity: {}#{}", entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentActivity(String userId) {
        log.debug("Fetching recent activity for userId={}", userId);
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        return auditLogRepository.findByCreatedAtBetween(since, LocalDateTime.now()).stream()
                .filter(log -> log.getUserId().equals(userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAuditStats() {
        log.debug("Fetching audit statistics");
        Map<String, Object> stats = new HashMap<>();
        List<String> actions = List.of("CREATE", "UPDATE", "DELETE", "VIEW", "EXPORT");

        Map<String, Long> actionCounts = new HashMap<>();
        for (String action : actions) {
            actionCounts.put(action, auditLogRepository.countByAction(action));
        }

        stats.put("actionCounts", actionCounts);
        stats.put("totalLogs", auditLogRepository.count());
        return stats;
    }
}
