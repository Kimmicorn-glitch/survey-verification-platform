package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.survey.domain.SurveyTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SurveyTemplateJpaRepository extends JpaRepository<SurveyTemplate, UUID> {

    Page<SurveyTemplate> findByDeletedFalseAndPublicTemplateTrueOrderByUsageCountDesc(Pageable pageable);

    Page<SurveyTemplate> findByCreatorIdAndDeletedFalseOrderByCreatedAtDesc(String creatorId, Pageable pageable);

    Page<SurveyTemplate> findByCategoryAndDeletedFalseAndPublicTemplateTrue(String category, Pageable pageable);

    @Query("SELECT t FROM SurveyTemplate t WHERE t.deleted = false AND t.publicTemplate = true AND (LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) ORDER BY t.usageCount DESC")
    Page<SurveyTemplate> searchTemplates(@Param("search") String search, Pageable pageable);
}
