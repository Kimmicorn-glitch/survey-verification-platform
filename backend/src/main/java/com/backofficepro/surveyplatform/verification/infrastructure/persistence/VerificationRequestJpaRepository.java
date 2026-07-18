package com.backofficepro.surveyplatform.verification.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA repository for VerificationRequestJpaEntity.
 *
 * @author BackOffice Pro
 */
@Repository
public interface VerificationRequestJpaRepository
        extends JpaRepository<VerificationRequestJpaEntity, UUID> {

    Page<VerificationRequestJpaEntity> findBySurveyId(String surveyId, Pageable pageable);

    Page<VerificationRequestJpaEntity> findByRespondentId(String respondentId, Pageable pageable);

    Page<VerificationRequestJpaEntity> findByStatus(String status, Pageable pageable);
}
