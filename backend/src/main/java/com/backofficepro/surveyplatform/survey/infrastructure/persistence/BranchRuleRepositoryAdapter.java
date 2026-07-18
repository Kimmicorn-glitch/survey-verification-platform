package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.survey.domain.BranchRule;
import com.backofficepro.surveyplatform.survey.domain.repository.BranchRuleRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class BranchRuleRepositoryAdapter {

    private final BranchRuleRepository branchRuleRepository;

    public BranchRuleRepositoryAdapter(final BranchRuleRepository branchRuleRepository) {
        this.branchRuleRepository = branchRuleRepository;
    }

    public BranchRule save(final BranchRule branchRule) {
        return branchRuleRepository.save(branchRule);
    }

    public List<BranchRule> findBySurveyId(final UUID surveyId) {
        return branchRuleRepository.findBySurveyIdAndDeletedFalseOrderBySortOrderAsc(surveyId);
    }

    public List<BranchRule> findBySurveyIdAndSourceQuestionId(final UUID surveyId, final UUID questionId) {
        return branchRuleRepository.findBySurveyIdAndSourceQuestionId(surveyId, questionId);
    }

    public Optional<BranchRule> findById(final UUID id) {
        return branchRuleRepository.findById(id);
    }

    public void deleteBySurveyId(final UUID surveyId) {
        branchRuleRepository.deleteBySurveyIdAndDeletedFalse(surveyId);
    }

    public void deleteById(final UUID id) {
        branchRuleRepository.deleteById(id);
    }
}
