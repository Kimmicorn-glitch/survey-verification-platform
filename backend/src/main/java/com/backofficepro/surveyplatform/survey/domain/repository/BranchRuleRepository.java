package com.backofficepro.surveyplatform.survey.domain.repository;

import com.backofficepro.surveyplatform.survey.domain.BranchRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BranchRuleRepository extends JpaRepository<BranchRule, UUID> {

    List<BranchRule> findBySurveyIdAndDeletedFalseOrderBySortOrderAsc(UUID surveyId);

    @Query("SELECT br FROM BranchRule br WHERE br.survey.id = :surveyId AND br.sourceQuestion.id = :questionId AND br.deleted = false ORDER BY br.sortOrder ASC")
    List<BranchRule> findBySurveyIdAndSourceQuestionId(@Param("surveyId") UUID surveyId, @Param("questionId") UUID questionId);

    void deleteBySurveyIdAndDeletedFalse(UUID surveyId);
}
