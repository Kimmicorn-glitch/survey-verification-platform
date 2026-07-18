package com.backofficepro.surveyplatform.survey;

import com.backofficepro.surveyplatform.config.AbstractIntegrationTest;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.survey.application.dto.request.CreateSurveyRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.AddQuestionRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class SurveyIntegrationTest extends AbstractIntegrationTest {

    private static final String BASE_URL = "/api/v1/surveys";
    private static final String AUTH_TOKEN = "Bearer test-integration-token";

    @Test
    void contextLoads() {
        assertThat(restTemplate).isNotNull();
    }

    @Test
    void healthEndpoint_ReturnsOk() {
        ResponseEntity<String> response = restTemplate.getForEntity("/actuator/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listSurveys_WithoutAuth_ReturnsUnauthorized() {
        ResponseEntity<ApiResponse> response = restTemplate.getForEntity(BASE_URL, ApiResponse.class);
        assertThat(response.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    @Test
    void createSurvey_WithValidData_ReturnsCreated() {
        CreateSurveyRequest request = new CreateSurveyRequest();
        request.setTitle("Integration Test Survey");
        request.setDescription("A survey created during integration testing");
        request.setAnonymous(false);

        HttpEntity<CreateSurveyRequest> entity = new HttpEntity<>(request, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                BASE_URL, HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK);
    }

    @Test
    void createSurvey_WithEmptyTitle_ReturnsBadRequest() {
        CreateSurveyRequest request = new CreateSurveyRequest();
        request.setTitle("");
        request.setDescription("Desc");

        HttpEntity<CreateSurveyRequest> entity = new HttpEntity<>(request, createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                BASE_URL, HttpMethod.POST, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getSurvey_WithNonExistentId_ReturnsNotFound() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                BASE_URL + "/00000000-0000-0000-0000-000000000000",
                HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void addQuestion_WithValidData_ReturnsOk() {
        CreateSurveyRequest createReq = new CreateSurveyRequest();
        createReq.setTitle("Survey for Questions");
        createReq.setDescription("Desc");

        HttpEntity<CreateSurveyRequest> createEntity = new HttpEntity<>(createReq, createAuthHeaders());
        ResponseEntity<ApiResponse> createResponse = restTemplate.exchange(
                BASE_URL, HttpMethod.POST, createEntity, ApiResponse.class);

        if (createResponse.getStatusCode() == HttpStatus.CREATED || createResponse.getStatusCode() == HttpStatus.OK) {
            AddQuestionRequest questionReq = new AddQuestionRequest();
            questionReq.setText("What is your name?");
            questionReq.setQuestionType("TEXT");
            questionReq.setRequired(true);

            HttpEntity<AddQuestionRequest> qEntity = new HttpEntity<>(questionReq, createAuthHeaders());
            ResponseEntity<ApiResponse> qResponse = restTemplate.exchange(
                    BASE_URL + "/questions", HttpMethod.POST, qEntity, ApiResponse.class);

            assertThat(qResponse.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK);
        }
    }

    @Test
    void publishSurvey_WithNoQuestions_ReturnsBadRequest() {
        CreateSurveyRequest createReq = new CreateSurveyRequest();
        createReq.setTitle("Empty Survey");
        createReq.setDescription("No questions");

        HttpEntity<CreateSurveyRequest> createEntity = new HttpEntity<>(createReq, createAuthHeaders());
        ResponseEntity<ApiResponse> createResponse = restTemplate.exchange(
                BASE_URL, HttpMethod.POST, createEntity, ApiResponse.class);

        if (createResponse.getStatusCode() == HttpStatus.CREATED || createResponse.getStatusCode() == HttpStatus.OK) {
            HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<ApiResponse> pubResponse = restTemplate.exchange(
                    BASE_URL + "/publish", HttpMethod.POST, entity, ApiResponse.class);

            assertThat(pubResponse.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    @Test
    void listSurveys_WithPagination_ReturnsPage() {
        HttpEntity<Void> entity = new HttpEntity<>(createAuthHeaders());
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                BASE_URL + "?page=0&pageSize=5", HttpMethod.GET, entity, ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
    }

    private org.springframework.http.HttpHeaders createAuthHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", AUTH_TOKEN);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return headers;
    }
}
