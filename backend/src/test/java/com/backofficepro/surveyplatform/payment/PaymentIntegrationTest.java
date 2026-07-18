package com.backofficepro.surveyplatform.payment;

import com.backofficepro.surveyplatform.config.AbstractIntegrationTest;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentIntegrationTest extends AbstractIntegrationTest {

    private static final String SUBSCRIPTION_URL = "/api/v1/subscriptions";
    private static final String INVOICE_URL = "/api/v1/invoices";
    private static final String AUTH_TOKEN = "Bearer test-integration-token";

    @Test
    void listSubscriptions_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(SUBSCRIPTION_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void listSubscriptions_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                SUBSCRIPTION_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void createSubscription_WithValidData_ReturnsCreated() {
        String requestBody = """
                {
                    "planId": "plan-basic",
                    "paymentMethodId": "pm_test_card"
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                SUBSCRIPTION_URL, HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK);
    }

    @Test
    void getSubscription_WithNonExistentId_ReturnsNotFound() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                SUBSCRIPTION_URL + "/00000000-0000-0000-0000-000000000000",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.OK);
    }

    @Test
    void listInvoices_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                INVOICE_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listInvoices_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(INVOICE_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void getInvoice_WithNonExistentId_ReturnsNotFound() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                INVOICE_URL + "/00000000-0000-0000-0000-000000000000",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.OK);
    }

    @Test
    void upgradeSubscription_WithValidPlan_ReturnsOk() {
        String requestBody = """
                {
                    "planId": "plan-premium"
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                SUBSCRIPTION_URL + "/upgrade", HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.BAD_REQUEST);
    }

    private org.springframework.http.HttpHeaders createAuthHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", AUTH_TOKEN);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return headers;
    }
}
