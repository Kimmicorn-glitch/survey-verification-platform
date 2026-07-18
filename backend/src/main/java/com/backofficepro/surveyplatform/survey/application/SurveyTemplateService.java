package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.SurveyTemplate;
import com.backofficepro.surveyplatform.survey.infrastructure.persistence.SurveyTemplateJpaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class SurveyTemplateService {

    private static final Logger log = LoggerFactory.getLogger(SurveyTemplateService.class);

    private final SurveyTemplateJpaRepository templateRepository;

    public SurveyTemplateService(final SurveyTemplateJpaRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public SurveyTemplate createTemplate(final String name,
                                          final String description,
                                          final String category,
                                          final String creatorId,
                                          final String templateData) {
        final SurveyTemplate template = SurveyTemplate.create(name, description, category, creatorId, templateData);
        final SurveyTemplate saved = templateRepository.save(template);
        log.info("Template '{}' created by {}", name, creatorId);
        return saved;
    }

    @Transactional(readOnly = true)
    public SurveyTemplate getTemplate(final String templateId) {
        return templateRepository.findById(UUID.fromString(templateId))
                .orElseThrow(() -> new EntityNotFoundException("SurveyTemplate", templateId));
    }

    @Transactional(readOnly = true)
    public Page<SurveyTemplate> listPublicTemplates(final Pageable pageable) {
        return templateRepository.findByDeletedFalseAndPublicTemplateTrueOrderByUsageCountDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Page<SurveyTemplate> listUserTemplates(final String creatorId, final Pageable pageable) {
        return templateRepository.findByCreatorIdAndDeletedFalseOrderByCreatedAtDesc(creatorId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SurveyTemplate> listByCategory(final String category, final Pageable pageable) {
        return templateRepository.findByCategoryAndDeletedFalseAndPublicTemplateTrue(category, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SurveyTemplate> searchTemplates(final String search, final Pageable pageable) {
        return templateRepository.searchTemplates(search, pageable);
    }

    public SurveyTemplate updateTemplate(final String templateId,
                                          final String name,
                                          final String description,
                                          final String category,
                                          final String templateData,
                                          final String userId) {
        final SurveyTemplate template = templateRepository.findById(UUID.fromString(templateId))
                .orElseThrow(() -> new EntityNotFoundException("SurveyTemplate", templateId));
        if (!template.getCreatorId().equals(userId)) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException("Unauthorized", "You are not authorized to modify this template");
        }
        if (name != null) template.setName(name);
        if (description != null) template.setDescription(description);
        if (category != null) template.setCategory(category);
        if (templateData != null) template.setTemplateData(templateData);
        return templateRepository.save(template);
    }

    public void publishTemplate(final String templateId, final String userId) {
        final SurveyTemplate template = templateRepository.findById(UUID.fromString(templateId))
                .orElseThrow(() -> new EntityNotFoundException("SurveyTemplate", templateId));
        if (!template.getCreatorId().equals(userId)) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException("Unauthorized", "You are not authorized to publish this template");
        }
        template.makePublic();
        templateRepository.save(template);
        log.info("Template {} published by {}", templateId, userId);
    }

    public void deleteTemplate(final String templateId, final String userId) {
        final SurveyTemplate template = templateRepository.findById(UUID.fromString(templateId))
                .orElseThrow(() -> new EntityNotFoundException("SurveyTemplate", templateId));
        if (!template.getCreatorId().equals(userId)) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException("Unauthorized", "You are not authorized to delete this template");
        }
        template.softDelete(userId);
        templateRepository.save(template);
        log.info("Template {} deleted by {}", templateId, userId);
    }
}
