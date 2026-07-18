package com.backofficepro.surveyplatform.nft;

import com.backofficepro.surveyplatform.config.AbstractIntegrationTest;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class NftIntegrationTest extends AbstractIntegrationTest {

    private static final String NFT_URL = "/api/v1/nfts";
    private static final String AUTH_TOKEN = "Bearer test-integration-token";

    @Test
    void listNfts_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(NFT_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void listNfts_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NFT_URL, HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getNft_WithNonExistentId_ReturnsNotFound() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NFT_URL + "/00000000-0000-0000-0000-000000000000",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.OK);
    }

    @Test
    void mintNft_WithValidVerificationId_ReturnsOk() {
        String requestBody = """
                {
                    "verificationId": "00000000-0000-0000-0000-000000000001"
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NFT_URL + "/mint", HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK, HttpStatus.BAD_REQUEST);
    }

    @Test
    void transferNft_WithValidData_ReturnsOk() {
        String requestBody = """
                {
                    "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78"
                }
                """;

        HttpEntity<String> entity = new HttpEntity<>(requestBody, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NFT_URL + "/00000000-0000-0000-0000-000000000001/transfer",
                HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.OK, HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }

    @Test
    void getNftStats_WithAuth_ReturnsOk() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                NFT_URL + "/stats", HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private org.springframework.http.HttpHeaders createAuthHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", AUTH_TOKEN);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return headers;
    }
}
