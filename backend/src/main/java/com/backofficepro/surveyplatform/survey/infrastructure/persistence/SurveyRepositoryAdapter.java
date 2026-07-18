package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.QuestionOption;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
import com.backofficepro.surveyplatform.survey.domain.valueobject.SurveyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA adapter implementing the Survey repository port.
 *
 * @author BackOffice Pro
 */
@Repository
public class SurveyRepositoryAdapter implements SurveyRepository {

    private final SurveyJpaRepository surveyJpaRepository;

    /**
     * Constructs a new SurveyRepositoryAdapter.
     *
     * @param surveyJpaRepository the Spring Data JPA survey repository
     */
    public SurveyRepositoryAdapter(final SurveyJpaRepository surveyJpaRepository) {
        this.surveyJpaRepository = surveyJpaRepository;
    }

    @Override
    public Optional<Survey> findById(final UUID id) {
        return surveyJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Page<Survey> findByCreatorId(final String creatorId, final Pageable pageable) {
        return surveyJpaRepository.findByCreatorId(creatorId, pageable).map(this::toDomain);
    }

    @Override
    public Page<Survey> findByStatus(final String status, final Pageable pageable) {
        return surveyJpaRepository.findByStatus(status, pageable).map(this::toDomain);
    }

    @Override
    public Page<Survey> findAllActive(final Pageable pageable) {
        return surveyJpaRepository.findAllActive(pageable).map(this::toDomain);
    }

    @Override
    public Page<Survey> searchByTitle(final String title, final Pageable pageable) {
        return surveyJpaRepository.searchByTitle(title, pageable).map(this::toDomain);
    }

    @Override
    public Survey save(final Survey survey) {
        final SurveyJpaEntity entity = toJpa(survey);
        final SurveyJpaEntity saved = surveyJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(final UUID id) {
        surveyJpaRepository.deleteById(id);
    }

    @Override
    public long countResponses(final UUID surveyId) {
        return surveyJpaRepository.findResponseCountBySurveyId(surveyId).orElse(0);
    }

    private Survey toDomain(final SurveyJpaEntity entity) {
        final Survey survey = Survey.create(
                entity.getTitle(),
                entity.getDescription(),
                entity.getCreatorId(),
                entity.isAnonymous());

        copyId(survey, entity);
        survey.setStatus(entity.getStatus());
        survey.setResponseCount(entity.getResponseCount());
        survey.setMaxResponses(entity.getMaxResponses());
        survey.setStartsAt(entity.getStartsAt());
        survey.setEndsAt(entity.getEndsAt());
        survey.setPublishedAt(entity.getPublishedAt());
        survey.setClosedAt(entity.getClosedAt());

        if (entity.getQuestions() != null) {
            for (final QuestionJpaEntity qEntity : entity.getQuestions()) {
                final Question question = Question.create(
                        qEntity.getText(),
                        QuestionType.valueOf(qEntity.getQuestionType()),
                        qEntity.isRequired());
                question.setDescription(qEntity.getDescription());
                question.setMinValue(qEntity.getMinValue());
                question.setMaxValue(qEntity.getMaxValue());
                copyId(question, qEntity);

                if (qEntity.getOptions() != null) {
                    for (final QuestionOptionJpaEntity oEntity : qEntity.getOptions()) {
                        final QuestionOption option = QuestionOption.create(
                                oEntity.getText(), oEntity.getValue());
                        option.setSortOrder(oEntity.getSortOrder());
                        copyId(option, oEntity);
                        question.addOption(option);
                    }
                }
                question.setSortOrder(qEntity.getSortOrder());
                survey.addQuestion(question);
            }
        }
        return survey;
    }

    private SurveyJpaEntity toJpa(final Survey survey) {
        final SurveyJpaEntity entity = new SurveyJpaEntity();
        entity.setId(survey.getId());
        entity.setTitle(survey.getTitle());
        entity.setDescription(survey.getDescription());
        entity.setCreatorId(survey.getCreatorId());
        entity.setStatus(survey.getStatus());
        entity.setAnonymous(survey.isAnonymous());
        entity.setMaxResponses(survey.getMaxResponses());
        entity.setResponseCount(survey.getResponseCount());
        entity.setStartsAt(survey.getStartsAt());
        entity.setEndsAt(survey.getEndsAt());
        entity.setPublishedAt(survey.getPublishedAt());
        entity.setClosedAt(survey.getClosedAt());
        entity.setCreatedAt(survey.getCreatedAt());
        entity.setUpdatedAt(survey.getUpdatedAt());
        entity.setVersion(survey.getVersion());
        entity.setDeleted(survey.isDeleted());

        final List<QuestionJpaEntity> questionEntities = new ArrayList<>();
        if (survey.getQuestions() != null) {
            for (final Question question : survey.getQuestions()) {
                final QuestionJpaEntity qEntity = new QuestionJpaEntity();
                qEntity.setId(question.getId());
                qEntity.setSurvey(entity);
                qEntity.setText(question.getText());
                qEntity.setDescription(question.getDescription());
                qEntity.setQuestionType(question.getQuestionType());
                qEntity.setRequired(question.isRequired());
                qEntity.setSortOrder(question.getSortOrder());
                qEntity.setMinValue(question.getMinValue());
                qEntity.setMaxValue(question.getMaxValue());

                final List<QuestionOptionJpaEntity> optionEntities = new ArrayList<>();
                if (question.getOptions() != null) {
                    for (final QuestionOption option : question.getOptions()) {
                        final QuestionOptionJpaEntity oEntity = new QuestionOptionJpaEntity();
                        oEntity.setId(option.getId());
                        oEntity.setQuestion(qEntity);
                        oEntity.setText(option.getText());
                        oEntity.setValue(option.getValue());
                        oEntity.setSortOrder(option.getSortOrder());
                        oEntity.setOther(option.isOther());
                        optionEntities.add(oEntity);
                    }
                }
                qEntity.setOptions(optionEntities);
                questionEntities.add(qEntity);
            }
        }
        entity.setQuestions(questionEntities);
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
                // Reflection fallback
            }
        }
    }
}
