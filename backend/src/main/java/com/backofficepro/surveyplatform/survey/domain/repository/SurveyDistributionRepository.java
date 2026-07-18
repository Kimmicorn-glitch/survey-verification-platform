package com.backofficepro.surveyplatform.survey.domain.repository;

import com.backofficepro.surveyplatform.survey.domain.SurveyDistribution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SurveyDistributionRepository extends JpaRepository<SurveyDistribution, UUID> {

    List<SurveyDistribution> findBySurveyIdAndDeletedFalse(UUID surveyId);

    Page<SurveyDistribution> findBySurveyIdAndDeletedFalse(UUID surveyId, Pageable pageable);

    @Query("SELECT d.channel, COUNT(d) FROM SurveyDistribution d WHERE d.survey.id = :surveyId AND d.deleted = false GROUP BY d.channel")
    List<Object[]> countByChannelForSurvey(@Param("surveyId") UUID surveyId);

    @Query("SELECT d.status, COUNT(d) FROM SurveyDistribution d WHERE d.survey.id = :surveyId AND d.deleted = false GROUP BY d.status")
    List<Object[]> countByStatusForSurvey(@Param("surveyId") UUID surveyId);

    long countBySurveyIdAndStatusAndDeletedFalse(UUID surveyId, String status);

    long countBySurveyIdAndDeletedFalse(UUID surveyId);
}
