package com.backofficepro.surveyplatform.verification.infrastructure.persistence;

import com.backofficepro.surveyplatform.verification.domain.VerificationRequest;
import com.backofficepro.surveyplatform.verification.domain.repository.VerificationRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA adapter implementing the VerificationRequest repository port.
 *
 * @author BackOffice Pro
 */
@Repository
public class VerificationRequestRepositoryAdapter implements VerificationRequestRepository {

    private final VerificationRequestJpaRepository jpaRepository;

    public VerificationRequestRepositoryAdapter(final VerificationRequestJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<VerificationRequest> findById(final UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Page<VerificationRequest> findBySurveyId(final String surveyId, final Pageable pageable) {
        return jpaRepository.findBySurveyId(surveyId, pageable).map(this::toDomain);
    }

    @Override
    public Page<VerificationRequest> findByRespondentId(final String respondentId, final Pageable pageable) {
        return jpaRepository.findByRespondentId(respondentId, pageable).map(this::toDomain);
    }

    @Override
    public Page<VerificationRequest> findByStatus(final String status, final Pageable pageable) {
        return jpaRepository.findByStatus(status, pageable).map(this::toDomain);
    }

    @Override
    public VerificationRequest save(final VerificationRequest request) {
        final VerificationRequestJpaEntity entity = toJpa(request);
        final VerificationRequestJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(final UUID id) {
        jpaRepository.deleteById(id);
    }

    private VerificationRequest toDomain(final VerificationRequestJpaEntity entity) {
        final VerificationRequest request = VerificationRequest.create(
                entity.getSurveyId(),
                entity.getRespondentId(),
                entity.getVerificationType(),
                entity.getExpiresAt());
        copyId(request, entity);
        request.setStatus(entity.getStatus());
        request.setVerifierId(entity.getVerifierId());
        request.setResult(entity.getResult());
        request.setConfidenceScore(entity.getConfidenceScore());
        request.setNotes(entity.getNotes());
        request.setStartedAt(entity.getStartedAt());
        request.setCompletedAt(entity.getCompletedAt());
        return request;
    }

    private VerificationRequestJpaEntity toJpa(final VerificationRequest domain) {
        final VerificationRequestJpaEntity entity = new VerificationRequestJpaEntity();
        entity.setId(domain.getId());
        entity.setSurveyId(domain.getSurveyId());
        entity.setRespondentId(domain.getRespondentId());
        entity.setVerifierId(domain.getVerifierId());
        entity.setStatus(domain.getStatus());
        entity.setVerificationType(domain.getVerificationType());
        entity.setResult(domain.getResult());
        entity.setConfidenceScore(domain.getConfidenceScore());
        entity.setNotes(domain.getNotes());
        entity.setStartedAt(domain.getStartedAt());
        entity.setCompletedAt(domain.getCompletedAt());
        entity.setExpiresAt(domain.getExpiresAt());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setDeleted(domain.isDeleted());
        return entity;
    }

    private void copyId(final com.backofficepro.surveyplatform.shared.domain.BaseEntity target,
                        final com.backofficepro.surveyplatform.shared.domain.BaseEntity source) {
        if (source.getId() != null) {
            try {
                final var idField = target.getClass().getSuperclass().getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(target, source.getId());
            } catch (Exception ignored) {
            }
        }
    }
}
