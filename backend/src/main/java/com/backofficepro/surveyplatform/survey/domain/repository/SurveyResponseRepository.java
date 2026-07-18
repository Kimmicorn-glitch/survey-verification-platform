package com.backofficepro.surveyplatform.survey.domain.repository;

import com.backofficepro.surveyplatform.survey.domain.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, UUID> {

    boolean existsBySurveyIdAndRespondentId(UUID surveyId, String respondentId);

    List<SurveyResponse> findBySurveyIdAndDeletedFalse(UUID surveyId);

    List<SurveyResponse> findBySurveyIdAndQuestionIdAndDeletedFalse(UUID surveyId, UUID questionId);

    @Query("SELECT COUNT(DISTINCT r.respondentId) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.respondentId IS NOT NULL")
    long countDistinctRespondentsBySurveyId(@Param("surveyId") UUID surveyId);

    @Query("SELECT r.textAnswer, COUNT(r) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.question.id = :questionId AND r.textAnswer IS NOT NULL GROUP BY r.textAnswer ORDER BY COUNT(r) DESC")
    List<Object[]> countTextAnswersByQuestion(@Param("surveyId") UUID surveyId, @Param("questionId") UUID questionId);

    @Query("SELECT r.numericAnswer, COUNT(r) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.question.id = :questionId AND r.numericAnswer IS NOT NULL GROUP BY r.numericAnswer ORDER BY r.numericAnswer")
    List<Object[]> countNumericAnswersByQuestion(@Param("surveyId") UUID surveyId, @Param("questionId") UUID questionId);

    @Query("SELECT r.selectedOptionId, COUNT(r) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.question.id = :questionId AND r.selectedOptionId IS NOT NULL GROUP BY r.selectedOptionId")
    List<Object[]> countChoiceAnswersByQuestion(@Param("surveyId") UUID surveyId, @Param("questionId") UUID questionId);

    @Query("SELECT AVG(r.numericAnswer) FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.question.id = :questionId AND r.numericAnswer IS NOT NULL")
    Double averageNumericAnswerByQuestion(@Param("surveyId") UUID surveyId, @Param("questionId") UUID questionId);

    @Query("SELECT r FROM SurveyResponse r WHERE r.survey.id = :surveyId AND r.respondedAt BETWEEN :start AND :end ORDER BY r.respondedAt ASC")
    List<SurveyResponse> findBySurveyIdAndDateRange(@Param("surveyId") UUID surveyId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);
}
