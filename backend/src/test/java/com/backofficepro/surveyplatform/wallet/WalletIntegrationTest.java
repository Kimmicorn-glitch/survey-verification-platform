package com.backofficepro.surveyplatform.wallet;

import com.backofficepro.surveyplatform.config.AbstractIntegrationTest;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class WalletIntegrationTest extends AbstractIntegrationTest {

    private static final String WALLET_URL = "/api/v1/wallets";
    private static final String AUTH_TOKEN = "Bearer test-integration-token";

    @Test
    void listWallets_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(WALLET_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void listWallets_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                WALLET_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void connectWallet_WithValidData_ReturnsCreated() {
        String requestBody = """
                {
                    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78",
                    "chainId": 1
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                WALLET_URL + "/connect", HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK);
    }

    @Test
    void connectWallet_WithInvalidAddress_ReturnsBadRequest() {
        String requestBody = """
                {
                    "address": "invalid-address",
                    "chainId": 1
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                WALLET_URL + "/connect", HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void disconnectWallet_WithValidId_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                WALLET_URL + "/00000000-0000-0000-0000-000000000000",
                HttpMethod.DELETE, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.NOT_FOUND);
    }

    @Test
    void getTransactions_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                WALLET_URL + "/transactions?page=0&pageSize=10",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getTransactions_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(
                WALLET_URL + "/transactions", ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    private org.springframework.http.HttpHeaders createAuthHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", AUTH_TOKEN);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return headers;
    }
}
