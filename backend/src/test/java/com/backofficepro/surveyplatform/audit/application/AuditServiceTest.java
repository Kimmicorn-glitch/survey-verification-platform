package com.backofficepro.surveyplatform.audit.application;

import com.backofficepro.surveyplatform.audit.domain.AuditLog;
import com.backofficepro.surveyplatform.audit.domain.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditService auditService;

    private static final String USER_ID = "user-123";

    @Test
    void testLogAction_Success() {
        final AuditLog auditLog = AuditLog.create(USER_ID, "CREATE", "Survey", "survey-1");
        auditLog.setId(1L);
        auditLog.setOldValues("{\"title\":\"old\"}");
        auditLog.setNewValues("{\"title\":\"new\"}");
        auditLog.setIpAddress("127.0.0.1");
        auditLog.setUserAgent("Mozilla/5.0");
        auditLog.setRequestId("req-001");

        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(auditLog);

        final AuditLog result = auditService.logAction(
                USER_ID, "CREATE", "Survey", "survey-1",
                "{\"title\":\"old\"}", "{\"title\":\"new\"}",
                "127.0.0.1", "Mozilla/5.0", "req-001");

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(USER_ID);
        assertThat(result.getAction()).isEqualTo("CREATE");
        assertThat(result.getEntityType()).isEqualTo("Survey");
        assertThat(result.getEntityId()).isEqualTo("survey-1");
        assertThat(result.getOldValues()).isEqualTo("{\"title\":\"old\"}");
        assertThat(result.getNewValues()).isEqualTo("{\"title\":\"new\"}");
        assertThat(result.getIpAddress()).isEqualTo("127.0.0.1");
        assertThat(result.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(result.getRequestId()).isEqualTo("req-001");
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void testGetAuditLogs_ReturnsPage() {
        final AuditLog log1 = AuditLog.create(USER_ID, "CREATE", "Survey", "s1");
        log1.setId(1L);
        final AuditLog log2 = AuditLog.create(USER_ID, "UPDATE", "Survey", "s2");
        log2.setId(2L);

        final Page<AuditLog> page = new PageImpl<>(
                List.of(log1, log2), PageRequest.of(0, 10), 2);

        when(auditLogRepository.findByUserId(eq(USER_ID), any(PageRequest.class)))
                .thenReturn(page);

        final Page<AuditLog> result = auditService.getAuditLogs(USER_ID, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("CREATE");
        assertThat(result.getContent().get(1).getAction()).isEqualTo("UPDATE");
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void testGetEntityAuditLogs_ReturnsLogs() {
        final AuditLog log1 = AuditLog.create(USER_ID, "CREATE", "Survey", "survey-1");
        log1.setId(1L);
        final AuditLog log2 = AuditLog.create(USER_ID, "UPDATE", "Survey", "survey-1");
        log2.setId(2L);

        when(auditLogRepository.findByEntityTypeAndEntityId("Survey", "survey-1"))
                .thenReturn(List.of(log1, log2));

        final List<AuditLog> result = auditService.getEntityAuditLogs("Survey", "survey-1");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEntityType()).isEqualTo("Survey");
        assertThat(result.get(0).getEntityId()).isEqualTo("survey-1");
        assertThat(result.get(1).getAction()).isEqualTo("UPDATE");
        verify(auditLogRepository).findByEntityTypeAndEntityId("Survey", "survey-1");
    }
}
