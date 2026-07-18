package com.backofficepro.surveyplatform.shared.infrastructure.web;

import com.backofficepro.surveyplatform.audit.application.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AuditAspect(final AuditService auditService, final ObjectMapper objectMapper) {
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Around("@annotation(auditable)")
    public Object audit(final ProceedingJoinPoint joinPoint,
                         final Auditable auditable) throws Throwable {
        final long startTime = System.currentTimeMillis();
        final String requestId = UUID.randomUUID().toString();
        final String userId = getCurrentUserId();
        final String ipAddress = getClientIp();
        final String userAgent = getUserAgent();

        Object result = null;
        String status = "SUCCESS";
        try {
            result = joinPoint.proceed();
            return result;
        } catch (final Exception e) {
            status = "FAILURE";
            throw e;
        } finally {
            final long duration = System.currentTimeMillis() - startTime;
            try {
                auditService.logAction(
                        userId,
                        auditable.action(),
                        auditable.entityType(),
                        "",
                        null,
                        null,
                        ipAddress,
                        userAgent,
                        requestId
                );
            } catch (final Exception e) {
                log.error("Failed to write audit log", e);
            }
        }
    }

    private String getCurrentUserId() {
        final Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getName();
        }
        return "anonymous";
    }

    private String getClientIp() {
        final ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            final HttpServletRequest request = attrs.getRequest();
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isEmpty()) {
                return xff.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return "unknown";
    }

    private String getUserAgent() {
        final ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            return attrs.getRequest().getHeader("User-Agent");
        }
        return "unknown";
    }
}
