package com.backofficepro.surveyplatform.audit;

import com.backofficepro.surveyplatform.config.AbstractIntegrationTest;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class AuditIntegrationTest extends AbstractIntegrationTest {

    private static final String AUDIT_URL = "/api/v1/audit-logs";
    private static final String NOTIFICATION_URL = "/api/v1/notifications";
    private static final String ADMIN_TOKEN = "Bearer test-admin-token";
    private static final String USER_TOKEN = "Bearer test-user-token";

    @Test
    void listAuditLogs_WithAdmin_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(ADMIN_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                AUDIT_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listAuditLogs_WithoutAdmin_ReturnsForbidden() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                AUDIT_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED);
    }

    @Test
    void listAuditLogs_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(AUDIT_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void listAuditLogs_WithDateFilter_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(ADMIN_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                AUDIT_URL + "?startDate=2026-01-01&endDate=2026-12-31",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listNotifications_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NOTIFICATION_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getUnreadCount_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NOTIFICATION_URL + "/unread-count", HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void markNotificationAsRead_WithValidId_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NOTIFICATION_URL + "/00000000-0000-0000-0000-000000000000/read",
                HttpMethod.PUT, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.NOT_FOUND);
    }

    @Test
    void markAllNotificationsAsRead_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NOTIFICATION_URL + "/read-all", HttpMethod.PUT, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void archiveNotification_WithValidId_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders(USER_TOKEN));
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NOTIFICATION_URL + "/00000000-0000-0000-0000-000000000000/archive",
                HttpMethod.PUT, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.NOT_FOUND);
    }

    private org.springframework.http.HttpHeaders createAuthHeaders(String token) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", token);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return headers;
    }
}
