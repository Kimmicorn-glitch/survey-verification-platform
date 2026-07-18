package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;
import com.backofficepro.surveyplatform.shared.domain.event.DomainEventPublisher;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.application.dto.request.AddQuestionRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.CreateSurveyRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.SubmitSurveyResponseRequest;
import com.backofficepro.surveyplatform.survey.application.dto.response.SurveyResponse;
import com.backofficepro.surveyplatform.survey.application.mapper.SurveyMapper;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private SurveyResponseRepository responseRepository;

    @Mock
    private SurveyMapper surveyMapper;

    @Mock
    private DomainEventPublisher eventPublisher;

    @InjectMocks
    private SurveyService surveyService;

    private static final String CREATOR_ID = "user-123";
    private static final String SURVEY_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID SURVEY_ID = UUID.fromString(SURVEY_ID_STRING);

    private Survey draftSurvey;
    private Survey activeSurvey;

    @BeforeEach
    void setUp() {
        draftSurvey = Survey.create("Test Survey", "Description", CREATOR_ID, false);
        draftSurvey.setId(SURVEY_ID);

        activeSurvey = Survey.create("Active Survey", "Description", CREATOR_ID, false);
        activeSurvey.setId(SURVEY_ID);

        final Question question = Question.create("Q1", QuestionType.TEXT, true);
        question.setId(UUID.randomUUID());
        activeSurvey.addQuestion(question);
        activeSurvey.publish();
    }

    @Test
    void testCreateSurvey_Success() {
        final CreateSurveyRequest request = new CreateSurveyRequest();
        request.setTitle("New Survey");
        request.setDescription("A new survey");
        request.setAnonymous(false);

        final Survey savedSurvey = Survey.create("New Survey", "A new survey", CREATOR_ID, false);
        savedSurvey.setId(UUID.randomUUID());

        final SurveyResponse expectedResponse = SurveyResponse.builder()
                .id(savedSurvey.getId())
                .title("New Survey")
                .build();

        when(surveyRepository.save(any(Survey.class))).thenReturn(savedSurvey);
        when(surveyMapper.toResponse(any(Survey.class))).thenReturn(expectedResponse);

        final SurveyResponse result = surveyService.createSurvey(request, CREATOR_ID);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("New Survey");
        verify(surveyRepository).save(any(Survey.class));
        verify(eventPublisher).publish(any(DomainEvent.class));
        verify(surveyMapper).toResponse(savedSurvey);
    }

    @Test
    void testCreateSurvey_EmptyTitle_ThrowsException() {
        final CreateSurveyRequest request = new CreateSurveyRequest();
        request.setTitle("");
        request.setDescription("Desc");

        assertThatThrownBy(() -> surveyService.createSurvey(request, CREATOR_ID))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("SurveyTitleRequired"));

        verify(surveyRepository, never()).save(any());
    }

    @Test
    void testAddQuestion_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(draftSurvey));
        when(surveyRepository.save(any(Survey.class))).thenReturn(draftSurvey);

        final SurveyResponse expectedResponse = SurveyResponse.builder()
                .id(SURVEY_ID)
                .title("Test Survey")
                .questions(List.of(
                        SurveyResponse.QuestionResponse.builder()
                                .text("What is your name?")
                                .questionType("TEXT")
                                .build()))
                .build();
        when(surveyMapper.toResponse(any(Survey.class))).thenReturn(expectedResponse);

        final AddQuestionRequest request = new AddQuestionRequest();
        request.setText("What is your name?");
        request.setQuestionType("TEXT");
        request.setRequired(true);

        final SurveyResponse result = surveyService.addQuestion(SURVEY_ID_STRING, request, CREATOR_ID);

        assertThat(result).isNotNull();
        assertThat(result.getQuestions()).hasSize(1);
        verify(surveyRepository).save(any(Survey.class));
    }

    @Test
    void testAddQuestion_NonDraftSurvey_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(activeSurvey));

        final AddQuestionRequest request = new AddQuestionRequest();
        request.setText("Question");
        request.setQuestionType("TEXT");
        request.setRequired(false);

        assertThatThrownBy(() -> surveyService.addQuestion(SURVEY_ID_STRING, request, CREATOR_ID))
                .isInstanceOf(BusinessRuleValidationException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void testPublishSurvey_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(draftSurvey));
        when(surveyRepository.save(any(Survey.class))).thenReturn(draftSurvey);
        when(surveyMapper.toResponse(any(Survey.class)))
                .thenReturn(SurveyResponse.builder().id(SURVEY_ID).status("ACTIVE").build());

        final Question q = Question.create("Q1", QuestionType.TEXT, true);
        q.setId(UUID.randomUUID());
        draftSurvey.addQuestion(q);

        final SurveyResponse result = surveyService.publishSurvey(SURVEY_ID_STRING, CREATOR_ID);

        assertThat(result).isNotNull();
        verify(surveyRepository).save(any(Survey.class));
        verify(eventPublisher, atLeastOnce()).publish(any(DomainEvent.class));
    }

    @Test
    void testPublishSurvey_NoQuestions_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(draftSurvey));

        assertThatThrownBy(() -> surveyService.publishSurvey(SURVEY_ID_STRING, CREATOR_ID))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("SurveyNoQuestions"));
    }

    @Test
    void testCloseSurvey_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(activeSurvey));
        when(surveyRepository.save(any(Survey.class))).thenReturn(activeSurvey);
        when(surveyMapper.toResponse(any(Survey.class)))
                .thenReturn(SurveyResponse.builder().id(SURVEY_ID).status("CLOSED").build());

        final SurveyResponse result = surveyService.closeSurvey(SURVEY_ID_STRING, CREATOR_ID);

        assertThat(result).isNotNull();
        verify(surveyRepository).save(any(Survey.class));
        verify(eventPublisher, atLeastOnce()).publish(any(DomainEvent.class));
    }

    @Test
    void testSubmitResponse_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(activeSurvey));
        when(responseRepository.existsBySurveyIdAndRespondentId(SURVEY_ID, "respondent-1"))
                .thenReturn(false);
        when(responseRepository.save(any(SurveyResponse.class)))
                .thenReturn(SurveyResponse.createTextResponse(activeSurvey, null, "respondent-1", "Answer"));

        final SubmitSurveyResponseRequest request = new SubmitSurveyResponseRequest();
        request.setSurveyId(SURVEY_ID_STRING);
        request.setRespondentId("respondent-1");
        request.setSessionId("session-1");

        final SubmitSurveyResponseRequest.AnswerRequest answer = new SubmitSurveyResponseRequest.AnswerRequest();
        answer.setTextAnswer("Answer");
        request.setResponses(List.of(answer));

        final String result = surveyService.submitResponse(request);

        assertThat(result).isEqualTo("Response submitted successfully");
        verify(responseRepository, atLeastOnce()).save(any(SurveyResponse.class));
        verify(surveyRepository).save(any(Survey.class));
        verify(eventPublisher).publish(any(DomainEvent.class));
    }

    @Test
    void testSubmitResponse_SurveyNotAccepting_ThrowsException() {
        final Survey draftSurveyCopy = Survey.create("Draft", "Desc", CREATOR_ID, false);
        draftSurveyCopy.setId(SURVEY_ID);

        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(draftSurveyCopy));

        final SubmitSurveyResponseRequest request = new SubmitSurveyResponseRequest();
        request.setSurveyId(SURVEY_ID_STRING);
        request.setRespondentId("respondent-1");
        request.setResponses(List.of());

        assertThatThrownBy(() -> surveyService.submitResponse(request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("SurveyNotAcceptingResponses"));
    }

    @Test
    void testSubmitResponse_DuplicateRespondent_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(activeSurvey));
        when(responseRepository.existsBySurveyIdAndRespondentId(SURVEY_ID, "respondent-1"))
                .thenReturn(true);

        final SubmitSurveyResponseRequest request = new SubmitSurveyResponseRequest();
        request.setSurveyId(SURVEY_ID_STRING);
        request.setRespondentId("respondent-1");
        request.setResponses(List.of());

        assertThatThrownBy(() -> surveyService.submitResponse(request))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("DuplicateResponse"));
    }

    @Test
    void testDeleteSurvey_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(draftSurvey));

        surveyService.deleteSurvey(SURVEY_ID_STRING);

        verify(surveyRepository).deleteById(SURVEY_ID);
    }

    @Test
    void testGetSurvey_NotFound_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> surveyService.getSurvey(SURVEY_ID_STRING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Survey");
    }

    @Test
    void testListUserSurveys_ReturnsPage() {
        final SurveyResponse dto = SurveyResponse.builder()
                .id(SURVEY_ID)
                .title("Survey 1")
                .creatorId(CREATOR_ID)
                .build();

        final Page<SurveyResponse> expectedPage = new PageImpl<>(
                List.of(dto), PageRequest.of(0, 10), 1);

        when(surveyRepository.findByCreatorId(eq(CREATOR_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(draftSurvey), PageRequest.of(0, 10), 1));
        when(surveyMapper.toResponse(any(Survey.class))).thenReturn(dto);

        final Page<SurveyResponse> result = surveyService.listUserSurveys(
                CREATOR_ID, PageRequest.of(0, 10));

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Survey 1");
        verify(surveyRepository).findByCreatorId(eq(CREATOR_ID), any(Pageable.class));
    }
}
