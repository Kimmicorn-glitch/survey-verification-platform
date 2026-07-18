package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyResponseRepository;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyAnalyticsServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private SurveyResponseRepository responseRepository;

    @InjectMocks
    private SurveyAnalyticsService analyticsService;

    private static final String SURVEY_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID SURVEY_ID = UUID.fromString(SURVEY_ID_STRING);
    private static final UUID QUESTION_ID = UUID.randomUUID();

    private Survey survey;
    private Question textQuestion;

    @BeforeEach
    void setUp() {
        survey = Survey.create("Analytics Survey", "Desc", "user-1", false);
        survey.setId(SURVEY_ID);

        textQuestion = Question.create("Favorite color?", QuestionType.TEXT, true);
        textQuestion.setId(QUESTION_ID);
        survey.addQuestion(textQuestion);
    }

    @Test
    void testGetSurveyAnalytics_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(responseRepository.countDistinctRespondentsBySurveyId(SURVEY_ID)).thenReturn(10L);
        when(responseRepository.findBySurveyIdAndQuestionIdAndDeletedFalse(
                eq(SURVEY_ID), eq(QUESTION_ID)))
                .thenReturn(Collections.emptyList());
        when(responseRepository.countTextAnswersByQuestion(eq(SURVEY_ID), eq(QUESTION_ID)))
                .thenReturn(List.of(new Object[]{"Blue", 5L}));
        when(responseRepository.findBySurveyIdAndDateRange(
                eq(SURVEY_ID), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        final Map<String, Object> result = analyticsService.getSurveyAnalytics(SURVEY_ID_STRING);

        assertThat(result).isNotNull();
        assertThat(result.get("surveyId")).isEqualTo(SURVEY_ID_STRING);
        assertThat(result.get("title")).isEqualTo("Analytics Survey");
        assertThat(result.get("uniqueRespondents")).isEqualTo(10L);
        assertThat(result.get("questionCount")).isEqualTo(1);
        assertThat(result.get("questions")).isInstanceOf(List.class);
        assertThat(((List<?>) result.get("questions"))).hasSize(1);
        assertThat(result.get("responseTimeline")).isInstanceOf(Map.class);
    }

    @Test
    void testGetSurveyAnalytics_NotFound_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analyticsService.getSurveyAnalytics(SURVEY_ID_STRING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Survey");
    }

    @Test
    void testGetQuestionAnalytics_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(responseRepository.findBySurveyIdAndQuestionIdAndDeletedFalse(
                eq(SURVEY_ID), eq(QUESTION_ID)))
                .thenReturn(Collections.emptyList());
        when(responseRepository.countTextAnswersByQuestion(eq(SURVEY_ID), eq(QUESTION_ID)))
                .thenReturn(List.of(
                        new Object[]{"Red", 3L},
                        new Object[]{"Blue", 7L}));

        final Map<String, Object> result = analyticsService.getQuestionAnalytics(
                SURVEY_ID_STRING, QUESTION_ID.toString());

        assertThat(result).isNotNull();
        assertThat(result.get("questionId")).isEqualTo(QUESTION_ID.toString());
        assertThat(result.get("text")).isEqualTo("Favorite color?");
        assertThat(result.get("type")).isEqualTo("TEXT");
        assertThat(result.get("totalAnswers")).isEqualTo(0);
        assertThat(result.get("distribution")).isInstanceOf(List.class);
    }

    @Test
    void testGetOverviewAnalytics_Success() {
        when(surveyRepository.count()).thenReturn(42L);

        final Map<String, Object> result = analyticsService.getOverviewAnalytics();

        assertThat(result).isNotNull();
        assertThat(result.get("totalSurveys")).isEqualTo(42L);
        assertThat(result.get("activeSurveys")).isEqualTo(0L);
        assertThat(result.get("totalResponses")).isEqualTo(0L);
        assertThat(result.get("recentActivity")).isInstanceOf(List.class);
    }
}
