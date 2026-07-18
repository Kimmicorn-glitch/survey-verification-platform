package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.SurveyResponse;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyResponseRepository;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyExportServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private SurveyResponseRepository responseRepository;

    @InjectMocks
    private SurveyExportService exportService;

    private static final String SURVEY_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID SURVEY_ID = UUID.fromString(SURVEY_ID_STRING);
    private static final UUID QUESTION_ID = UUID.randomUUID();

    private Survey survey;
    private Question textQuestion;

    @BeforeEach
    void setUp() {
        survey = Survey.create("Export Survey", "Survey description", "user-1", false);
        survey.setId(SURVEY_ID);

        textQuestion = Question.create("Your name?", QuestionType.TEXT, true);
        textQuestion.setId(QUESTION_ID);
        survey.addQuestion(textQuestion);
    }

    @Test
    void testExportToCsv_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));

        final SurveyResponse response = SurveyResponse.createTextResponse(
                survey, textQuestion, "respondent-1", "John");
        response.setId(UUID.randomUUID());

        when(responseRepository.findBySurveyIdAndDeletedFalse(SURVEY_ID))
                .thenReturn(List.of(response));

        final byte[] result = exportService.exportToCsv(SURVEY_ID_STRING);

        assertThat(result).isNotNull();
        final String csv = new String(result, StandardCharsets.UTF_8);
        assertThat(csv).contains("Response ID,Respondent ID,Session ID,Timestamp");
        assertThat(csv).contains("Your name?");
        assertThat(csv).contains("John");
    }

    @Test
    void testExportToCsv_EmptyResponses() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(responseRepository.findBySurveyIdAndDeletedFalse(SURVEY_ID))
                .thenReturn(Collections.emptyList());

        final byte[] result = exportService.exportToCsv(SURVEY_ID_STRING);

        assertThat(result).isNotNull();
        final String csv = new String(result, StandardCharsets.UTF_8);
        assertThat(csv).contains("Response ID,Respondent ID,Session ID,Timestamp");
        assertThat(csv).contains("Your name?");
        final String[] lines = csv.split("\n");
        assertThat(lines).hasSize(1);
    }

    @Test
    void testExportToJson_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));

        final SurveyResponse response = SurveyResponse.createTextResponse(
                survey, textQuestion, "respondent-1", "Jane");
        response.setId(UUID.randomUUID());

        when(responseRepository.findBySurveyIdAndDeletedFalse(SURVEY_ID))
                .thenReturn(List.of(response));

        final Map<String, Object> result = exportService.exportToJson(SURVEY_ID_STRING);

        assertThat(result).isNotNull();
        assertThat(result.get("surveyId")).isEqualTo(SURVEY_ID_STRING);
        assertThat(result.get("title")).isEqualTo("Export Survey");
        assertThat(result.get("description")).isEqualTo("Survey description");
        assertThat(result.get("totalResponses")).isEqualTo(1);
        assertThat(result.get("exportedAt")).isNotNull();
        assertThat(result.get("questions")).isInstanceOf(List.class);
        assertThat(result.get("responses")).isInstanceOf(List.class);

        @SuppressWarnings("unchecked")
        final List<Map<String, Object>> responses =
                (List<Map<String, Object>>) result.get("responses");
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).get("respondentId")).isEqualTo("respondent-1");
    }

    @Test
    void testExportToCsv_SurveyNotFound_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exportService.exportToCsv(SURVEY_ID_STRING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Survey");
    }

    @Test
    void testExportToCsv_EscapesCommasInAnswers() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));

        final SurveyResponse response = SurveyResponse.createTextResponse(
                survey, textQuestion, "resp-1", "John, Jr.");
        response.setId(UUID.randomUUID());

        when(responseRepository.findBySurveyIdAndDeletedFalse(SURVEY_ID))
                .thenReturn(List.of(response));

        final byte[] result = exportService.exportToCsv(SURVEY_ID_STRING);
        final String csv = new String(result, StandardCharsets.UTF_8);

        assertThat(csv).contains("\"John, Jr.\"");
    }

    @Test
    void testExportToJson_EmptyResponses() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(responseRepository.findBySurveyIdAndDeletedFalse(SURVEY_ID))
                .thenReturn(Collections.emptyList());

        final Map<String, Object> result = exportService.exportToJson(SURVEY_ID_STRING);

        assertThat(result).isNotNull();
        assertThat(result.get("totalResponses")).isEqualTo(0);
        assertThat(result.get("responses")).isInstanceOf(List.class);
        assertThat(((List<?>) result.get("responses"))).isEmpty();
    }
}
