package com.backofficepro.surveyplatform.verification.domain.repository;

import com.backofficepro.surveyplatform.verification.domain.VerificationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for the VerificationRequest aggregate.
 *
 * @author BackOffice Pro
 */
public interface VerificationRequestRepository {

    Optional<VerificationRequest> findById(UUID id);

    Page<VerificationRequest> findBySurveyId(String surveyId, Pageable pageable);

    Page<VerificationRequest> findByRespondentId(String respondentId, Pageable pageable);

    Page<VerificationRequest> findByStatus(String status, Pageable pageable);

    VerificationRequest save(VerificationRequest request);

    void deleteById(UUID id);
}
