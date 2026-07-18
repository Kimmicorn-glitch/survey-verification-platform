package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for SurveyJpaEntity.
 *
 * @author BackOffice Pro
 */
@Repository
public interface SurveyJpaRepository extends JpaRepository<SurveyJpaEntity, UUID> {

    Page<SurveyJpaEntity> findByCreatorId(String creatorId, Pageable pageable);

    Page<SurveyJpaEntity> findByStatus(String status, Pageable pageable);

    @Query("SELECT s FROM SurveyJpaEntity s WHERE s.status = 'ACTIVE' AND s.deleted = false")
    Page<SurveyJpaEntity> findAllActive(Pageable pageable);

    @Query("SELECT s FROM SurveyJpaEntity s WHERE LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<SurveyJpaEntity> searchByTitle(@Param("title") String title, Pageable pageable);

    @Query("SELECT s.responseCount FROM SurveyJpaEntity s WHERE s.id = :surveyId")
    Optional<Integer> findResponseCountBySurveyId(@Param("surveyId") UUID surveyId);
}
