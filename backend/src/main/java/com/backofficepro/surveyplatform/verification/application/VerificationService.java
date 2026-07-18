package com.backofficepro.surveyplatform.verification.application;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEventPublisher;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.verification.application.dto.request.CompleteVerificationRequest;
import com.backofficepro.surveyplatform.verification.application.dto.request.CreateVerificationRequest;
import com.backofficepro.surveyplatform.verification.application.dto.response.VerificationResponse;
import com.backofficepro.surveyplatform.verification.application.mapper.VerificationMapper;
import com.backofficepro.surveyplatform.verification.domain.VerificationRequest;
import com.backofficepro.surveyplatform.verification.domain.repository.VerificationRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Application service implementing verification use cases.
 *
 * @author BackOffice Pro
 */
@Service
@Transactional
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);

    private final VerificationRequestRepository verificationRepository;
    private final VerificationMapper verificationMapper;
    private final DomainEventPublisher eventPublisher;

    /**
     * Constructs a new VerificationService.
     *
     * @param verificationRepository the verification repository
     * @param verificationMapper     the verification mapper
     * @param eventPublisher         the domain event publisher
     */
    public VerificationService(final VerificationRequestRepository verificationRepository,
                               final VerificationMapper verificationMapper,
                               final DomainEventPublisher eventPublisher) {
        this.verificationRepository = verificationRepository;
        this.verificationMapper = verificationMapper;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates a new verification request.
     *
     * @param request the creation request
     * @return the created verification response
     */
    public VerificationResponse createVerification(final CreateVerificationRequest request) {
        log.info("Creating verification for survey {} respondent {}",
                request.getSurveyId(), request.getRespondentId());

        final LocalDateTime expiresAt = request.getExpiresAt() != null
                ? request.getExpiresAt()
                : LocalDateTime.now().plusDays(7);

        final VerificationRequest verification = VerificationRequest.create(
                request.getSurveyId(),
                request.getRespondentId(),
                request.getVerificationType(),
                expiresAt);

        final VerificationRequest saved = verificationRepository.save(verification);
        return verificationMapper.toResponse(saved);
    }

    /**
     * Starts the verification process.
     *
     * @param verificationId the verification identifier
     * @param verifierId     the verifier's user identifier
     * @return the updated verification response
     */
    public VerificationResponse startVerification(final String verificationId,
                                                  final String verifierId) {
        final VerificationRequest verification = getVerification(verificationId);
        verification.start(verifierId);
        final VerificationRequest saved = verificationRepository.save(verification);
        log.info("Verification {} started by {}", verificationId, verifierId);
        return verificationMapper.toResponse(saved);
    }

    /**
     * Completes a verification.
     *
     * @param verificationId the verification identifier
     * @param request        the completion request
     * @param verifierId     the verifier's user identifier
     * @return the completed verification response
     */
    public VerificationResponse completeVerification(final String verificationId,
                                                     final CompleteVerificationRequest request,
                                                     final String verifierId) {
        final VerificationRequest verification = getVerification(verificationId);
        verification.complete(request.getResult(), request.getConfidenceScore(), request.getNotes());
        final VerificationRequest saved = verificationRepository.save(verification);
        publishEvents(saved);
        log.info("Verification {} completed by {}", verificationId, verifierId);
        return verificationMapper.toResponse(saved);
    }

    /**
     * Fails a verification.
     *
     * @param verificationId the verification identifier
     * @param reason         the failure reason
     * @return the updated verification response
     */
    public VerificationResponse failVerification(final String verificationId, final String reason) {
        final VerificationRequest verification = getVerification(verificationId);
        verification.fail(reason);
        final VerificationRequest saved = verificationRepository.save(verification);
        return verificationMapper.toResponse(saved);
    }

    /**
     * Retrieves a verification by its identifier.
     *
     * @param verificationId the verification identifier
     * @return the verification response
     */
    @Transactional(readOnly = true)
    public VerificationResponse getVerificationById(final String verificationId) {
        return verificationMapper.toResponse(getVerification(verificationId));
    }

    /**
     * Lists verifications for a survey.
     *
     * @param surveyId the survey identifier
     * @param pageable the pagination parameters
     * @return a page of verification responses
     */
    @Transactional(readOnly = true)
    public Page<VerificationResponse> listBySurvey(final String surveyId, final Pageable pageable) {
        return verificationRepository.findBySurveyId(surveyId, pageable)
                .map(verificationMapper::toResponse);
    }

    private VerificationRequest getVerification(final String verificationId) {
        return verificationRepository.findById(UUID.fromString(verificationId))
                .orElseThrow(() -> new EntityNotFoundException("VerificationRequest", verificationId));
    }

    private void publishEvents(final VerificationRequest verification) {
        for (final var event : verification.getDomainEvents()) {
            eventPublisher.publish(event);
        }
        verification.clearDomainEvents();
    }
}
