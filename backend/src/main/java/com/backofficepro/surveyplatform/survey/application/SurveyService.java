package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEventPublisher;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.application.dto.request.AddQuestionRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.CreateSurveyRequest;
import com.backofficepro.surveyplatform.survey.application.dto.request.SubmitSurveyResponseRequest;
import com.backofficepro.surveyplatform.survey.application.dto.response.SurveyResponse;
import com.backofficepro.surveyplatform.survey.application.mapper.SurveyMapper;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.QuestionOption;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.event.SurveyResponseSubmittedEvent;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyResponseRepository;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Application service implementing survey use cases.
 *
 * @author BackOffice Pro
 */
@Service
@Transactional
public class SurveyService {

    private static final Logger log = LoggerFactory.getLogger(SurveyService.class);

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;
    private final SurveyMapper surveyMapper;
    private final DomainEventPublisher eventPublisher;

    /**
     * Constructs a new SurveyService.
     *
     * @param surveyRepository    the survey repository
     * @param responseRepository  the response repository
     * @param surveyMapper        the survey mapper
     * @param eventPublisher      the domain event publisher
     */
    public SurveyService(final SurveyRepository surveyRepository,
                         final SurveyResponseRepository responseRepository,
                         final SurveyMapper surveyMapper,
                         final DomainEventPublisher eventPublisher) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.surveyMapper = surveyMapper;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Creates a new survey.
     *
     * @param request   the creation request
     * @param creatorId the creator's user identifier
     * @return the created survey response
     */
    @Transactional
    public SurveyResponse createSurvey(final CreateSurveyRequest request, final String creatorId) {
        log.info("Creating survey '{}' by user {}", request.getTitle(), creatorId);

        final Survey survey = Survey.create(
                request.getTitle(),
                request.getDescription(),
                creatorId,
                request.isAnonymous());

        if (request.getMaxResponses() != null) {
            survey.setMaxResponses(request.getMaxResponses());
        }
        if (request.getEndsAt() != null) {
            survey.setEndsAt(request.getEndsAt());
        }

        final Survey savedSurvey = surveyRepository.save(survey);
        publishEvents(savedSurvey);

        return surveyMapper.toResponse(savedSurvey);
    }

    /**
     * Adds a question to a survey.
     *
     * @param surveyId  the survey identifier
     * @param request   the question request
     * @param creatorId the creator's user identifier (for authorization)
     * @return the updated survey response
     */
    @Transactional
    public SurveyResponse addQuestion(final String surveyId,
                                      final AddQuestionRequest request,
                                      final String creatorId) {
        final Survey survey = getAndAuthorizeSurvey(surveyId, creatorId);

        final QuestionType questionType = QuestionType.valueOf(request.getQuestionType());
        final Question question = Question.create(request.getText(), questionType, request.isRequired());
        question.setDescription(request.getDescription());
        question.setMinValue(request.getMinValue());
        question.setMaxValue(request.getMaxValue());

        if (request.getOptions() != null) {
            for (final AddQuestionRequest.OptionRequest optionReq : request.getOptions()) {
                final QuestionOption option = QuestionOption.create(optionReq.getText(), optionReq.getValue());
                question.addOption(option);
            }
        }

        survey.addQuestion(question);
        final Survey savedSurvey = surveyRepository.save(survey);

        return surveyMapper.toResponse(savedSurvey);
    }

    /**
     * Publishes a survey, making it active.
     *
     * @param surveyId  the survey identifier
     * @param creatorId the creator's user identifier
     * @return the updated survey response
     */
    @Transactional
    public SurveyResponse publishSurvey(final String surveyId, final String creatorId) {
        final Survey survey = getAndAuthorizeSurvey(surveyId, creatorId);
        survey.publish();
        final Survey savedSurvey = surveyRepository.save(survey);
        publishEvents(savedSurvey);
        log.info("Survey {} published by {}", surveyId, creatorId);
        return surveyMapper.toResponse(savedSurvey);
    }

    /**
     * Closes a survey.
     *
     * @param surveyId  the survey identifier
     * @param creatorId the creator's user identifier
     * @return the updated survey response
     */
    @Transactional
    public SurveyResponse closeSurvey(final String surveyId, final String creatorId) {
        final Survey survey = getAndAuthorizeSurvey(surveyId, creatorId);
        survey.close();
        final Survey savedSurvey = surveyRepository.save(survey);
        publishEvents(savedSurvey);
        log.info("Survey {} closed by {}", surveyId, creatorId);
        return surveyMapper.toResponse(savedSurvey);
    }

    /**
     * Retrieves a survey by its identifier.
     *
     * @param surveyId the survey identifier
     * @return the survey response
     */
    @Transactional(readOnly = true)
    public SurveyResponse getSurvey(final String surveyId) {
        final Survey survey = surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));
        return surveyMapper.toResponse(survey);
    }

    /**
     * Lists surveys created by a specific user.
     *
     * @param creatorId the creator's user identifier
     * @param pageable  the pagination parameters
     * @return a page of survey responses
     */
    @Transactional(readOnly = true)
    public Page<SurveyResponse> listUserSurveys(final String creatorId, final Pageable pageable) {
        return surveyRepository.findByCreatorId(creatorId, pageable)
                .map(surveyMapper::toResponse);
    }

    /**
     * Lists all active surveys.
     *
     * @param pageable the pagination parameters
     * @return a page of active survey responses
     */
    @Transactional(readOnly = true)
    public Page<SurveyResponse> listActiveSurveys(final Pageable pageable) {
        return surveyRepository.findAllActive(pageable)
                .map(surveyMapper::toResponse);
    }

    /**
     * Submits responses to a survey.
     *
     * @param request the response submission request
     * @return the submission confirmation
     */
    @Transactional
    public String submitResponse(final SubmitSurveyResponseRequest request) {
        final UUID surveyId = UUID.fromString(request.getSurveyId());
        final Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new EntityNotFoundException("Survey", request.getSurveyId()));

        if (!survey.isAcceptingResponses()) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "SurveyNotAcceptingResponses",
                    "This survey is not currently accepting responses");
        }

        if (request.getRespondentId() != null
                && responseRepository.existsBySurveyIdAndRespondentId(surveyId, request.getRespondentId())) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "DuplicateResponse",
                    "You have already responded to this survey");
        }

        for (final SubmitSurveyResponseRequest.AnswerRequest answer : request.getResponses()) {
            final com.backofficepro.surveyplatform.survey.domain.SurveyResponse response;
            if (answer.getTextAnswer() != null) {
                response = com.backofficepro.surveyplatform.survey.domain.SurveyResponse
                        .createTextResponse(survey, null, request.getRespondentId(), answer.getTextAnswer());
            } else if (answer.getNumericAnswer() != null) {
                response = com.backofficepro.surveyplatform.survey.domain.SurveyResponse
                        .createNumericResponse(survey, null, request.getRespondentId(), answer.getNumericAnswer());
            } else if (answer.getSelectedOptionId() != null) {
                response = com.backofficepro.surveyplatform.survey.domain.SurveyResponse
                        .createChoiceResponse(survey, null, request.getRespondentId(), answer.getSelectedOptionId());
            } else {
                continue;
            }
            response.setSessionId(request.getSessionId());
            responseRepository.save(response);
        }

        survey.incrementResponseCount();
        surveyRepository.save(survey);

        eventPublisher.publish(new SurveyResponseSubmittedEvent(
                surveyId.toString(),
                request.getRespondentId(),
                survey.getResponseCount()));

        log.info("Response submitted to survey {} by respondent {}", surveyId, request.getRespondentId());
        return "Response submitted successfully";
    }

    /**
     * Deletes a survey by its identifier.
     *
     * @param surveyId the survey identifier
     */
    @Transactional
    public void deleteSurvey(final String surveyId) {
        final UUID id = UUID.fromString(surveyId);
        if (!surveyRepository.findById(id).isPresent()) {
            throw new EntityNotFoundException("Survey", surveyId);
        }
        surveyRepository.deleteById(id);
        log.info("Survey {} deleted", surveyId);
    }

    private Survey getAndAuthorizeSurvey(final String surveyId, final String creatorId) {
        final Survey survey = surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));
        if (!survey.getCreatorId().equals(creatorId)) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "Unauthorized",
                    "You are not authorized to modify this survey");
        }
        return survey;
    }

    private void publishEvents(final Survey survey) {
        for (final var event : survey.getDomainEvents()) {
            eventPublisher.publish(event);
        }
        survey.clearDomainEvents();
    }
}
