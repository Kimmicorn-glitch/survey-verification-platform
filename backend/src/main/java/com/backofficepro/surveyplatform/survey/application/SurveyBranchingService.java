package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.BranchRule;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.repository.BranchRuleRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SurveyBranchingService {

    private static final Logger log = LoggerFactory.getLogger(SurveyBranchingService.class);

    private final SurveyRepository surveyRepository;
    private final BranchRuleRepository branchRuleRepository;

    public SurveyBranchingService(final SurveyRepository surveyRepository,
                                   final BranchRuleRepository branchRuleRepository) {
        this.surveyRepository = surveyRepository;
        this.branchRuleRepository = branchRuleRepository;
    }

    public BranchRule addBranchRule(final String surveyId,
                                     final String sourceQuestionId,
                                     final String targetQuestionId,
                                     final String conditionType,
                                     final String conditionValue,
                                     final String operator) {
        final Survey survey = surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));

        final Question sourceQuestion = survey.getQuestions().stream()
                .filter(q -> q.getId().toString().equals(sourceQuestionId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Question", sourceQuestionId));

        final Question targetQuestion = survey.getQuestions().stream()
                .filter(q -> q.getId().toString().equals(targetQuestionId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Question", targetQuestionId));

        final BranchRule rule = BranchRule.create(sourceQuestion, targetQuestion, conditionType, conditionValue, operator);
        rule.setSurvey(survey);

        final List<BranchRule> existingRules = branchRuleRepository
                .findBySurveyIdAndSourceQuestionId(UUID.fromString(surveyId), sourceQuestion.getId());
        rule.setSortOrder(existingRules.size() + 1);

        final BranchRule saved = branchRuleRepository.save(rule);
        log.info("Branch rule added: survey={}, source={}, target={}", surveyId, sourceQuestionId, targetQuestionId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<BranchRule> getBranchRules(final String surveyId) {
        final UUID id = UUID.fromString(surveyId);
        if (!surveyRepository.findById(id).isPresent()) {
            throw new EntityNotFoundException("Survey", surveyId);
        }
        return branchRuleRepository.findBySurveyId(id);
    }

    public void deleteBranchRule(final String ruleId) {
        branchRuleRepository.deleteById(UUID.fromString(ruleId));
        log.info("Branch rule deleted: {}", ruleId);
    }

    public void deleteAllBranchRules(final String surveyId) {
        branchRuleRepository.deleteBySurveyId(UUID.fromString(surveyId));
        log.info("All branch rules deleted for survey: {}", surveyId);
    }

    @Transactional(readOnly = true)
    public List<Question> getNextQuestions(final String surveyId,
                                            final String currentQuestionId,
                                            final String answerValue) {
        final Survey survey = surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));

        final List<BranchRule> rules = branchRuleRepository.findBySurveyIdAndSourceQuestionId(
                UUID.fromString(surveyId), UUID.fromString(currentQuestionId));

        final List<Question> nextQuestions = new ArrayList<>();
        for (final BranchRule rule : rules) {
            if (rule.evaluate(answerValue)) {
                nextQuestions.add(rule.getTargetQuestion());
            }
        }

        if (nextQuestions.isEmpty()) {
            final Question currentQuestion = survey.getQuestions().stream()
                    .filter(q -> q.getId().toString().equals(currentQuestionId))
                    .findFirst()
                    .orElse(null);
            if (currentQuestion != null) {
                final int currentIndex = survey.getQuestions().indexOf(currentQuestion);
                if (currentIndex + 1 < survey.getQuestions().size()) {
                    nextQuestions.add(survey.getQuestions().get(currentIndex + 1));
                }
            }
        }

        return nextQuestions;
    }
}
