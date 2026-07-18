package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.BranchRule;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.repository.BranchRuleRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyBranchingServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private BranchRuleRepository branchRuleRepository;

    @InjectMocks
    private SurveyBranchingService surveyBranchingService;

    private static final String SURVEY_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID SURVEY_ID = UUID.fromString(SURVEY_ID_STRING);

    private Survey survey;
    private Question sourceQuestion;
    private Question targetQuestion;

    @BeforeEach
    void setUp() {
        survey = Survey.create("Test Survey", "Description", "user-1", false);
        survey.setId(SURVEY_ID);

        sourceQuestion = Question.create("Source Q", QuestionType.SINGLE_CHOICE, true);
        sourceQuestion.setId(UUID.randomUUID());
        survey.addQuestion(sourceQuestion);

        targetQuestion = Question.create("Target Q", QuestionType.TEXT, false);
        targetQuestion.setId(UUID.randomUUID());
        survey.addQuestion(targetQuestion);
    }

    @Test
    void testAddBranchRule_Success() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(branchRuleRepository.findBySurveyIdAndSourceQuestionId(
                eq(SURVEY_ID), eq(sourceQuestion.getId())))
                .thenReturn(Collections.emptyList());
        when(branchRuleRepository.save(any(BranchRule.class)))
                .thenAnswer(inv -> {
                    final BranchRule rule = inv.getArgument(0);
                    rule.setId(UUID.randomUUID());
                    return rule;
                });

        final BranchRule result = surveyBranchingService.addBranchRule(
                SURVEY_ID_STRING,
                sourceQuestion.getId().toString(),
                targetQuestion.getId().toString(),
                "EQUALS",
                "option1",
                "AND");

        assertThat(result).isNotNull();
        assertThat(result.getConditionType()).isEqualTo("EQUALS");
        assertThat(result.getConditionValue()).isEqualTo("option1");
        verify(branchRuleRepository).save(any(BranchRule.class));
    }

    @Test
    void testAddBranchRule_SurveyNotFound_ThrowsException() {
        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> surveyBranchingService.addBranchRule(
                SURVEY_ID_STRING,
                UUID.randomUUID().toString(),
                UUID.randomUUID().toString(),
                "EQUALS",
                "value",
                "AND"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Survey");
    }

    @Test
    void testGetBranchRules_ReturnsList() {
        final BranchRule rule = BranchRule.create(sourceQuestion, targetQuestion, "EQUALS", "A", "AND");
        rule.setId(UUID.randomUUID());

        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(branchRuleRepository.findBySurveyId(SURVEY_ID))
                .thenReturn(List.of(rule));

        final List<BranchRule> result = surveyBranchingService.getBranchRules(SURVEY_ID_STRING);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getConditionType()).isEqualTo("EQUALS");
        verify(surveyRepository).findById(SURVEY_ID);
    }

    @Test
    void testDeleteBranchRule_Success() {
        final UUID ruleId = UUID.randomUUID();
        surveyBranchingService.deleteBranchRule(ruleId.toString());

        verify(branchRuleRepository).deleteById(ruleId);
    }

    @Test
    void testGetNextQuestions_EqualsCondition_ReturnsTarget() {
        final BranchRule rule = BranchRule.create(sourceQuestion, targetQuestion, "EQUALS", "yes", "AND");
        rule.setId(UUID.randomUUID());
        rule.setSurvey(survey);

        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(branchRuleRepository.findBySurveyIdAndSourceQuestionId(
                eq(SURVEY_ID), eq(sourceQuestion.getId())))
                .thenReturn(List.of(rule));

        final List<Question> result = surveyBranchingService.getNextQuestions(
                SURVEY_ID_STRING,
                sourceQuestion.getId().toString(),
                "yes");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(targetQuestion.getId());
    }

    @Test
    void testGetNextQuestions_NoMatchingRule_ReturnsNextInOrder() {
        final BranchRule rule = BranchRule.create(sourceQuestion, targetQuestion, "EQUALS", "no", "AND");
        rule.setId(UUID.randomUUID());
        rule.setSurvey(survey);

        when(surveyRepository.findById(SURVEY_ID)).thenReturn(Optional.of(survey));
        when(branchRuleRepository.findBySurveyIdAndSourceQuestionId(
                eq(SURVEY_ID), eq(sourceQuestion.getId())))
                .thenReturn(List.of(rule));

        final List<Question> result = surveyBranchingService.getNextQuestions(
                SURVEY_ID_STRING,
                sourceQuestion.getId().toString(),
                "yes");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(targetQuestion.getId());
    }
}
