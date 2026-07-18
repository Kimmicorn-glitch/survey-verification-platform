package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.SurveyTemplate;
import com.backofficepro.surveyplatform.survey.infrastructure.persistence.SurveyTemplateJpaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyTemplateServiceTest {

    @Mock
    private SurveyTemplateJpaRepository templateRepository;

    @InjectMocks
    private SurveyTemplateService templateService;

    private static final String CREATOR_ID = "user-123";
    private static final String TEMPLATE_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID TEMPLATE_ID = UUID.fromString(TEMPLATE_ID_STRING);

    @Test
    void testCreateTemplate_Success() {
        final SurveyTemplate template = SurveyTemplate.create(
                "Feedback Template", "Customer feedback", "feedback", CREATOR_ID, "{}");
        template.setId(UUID.randomUUID());

        when(templateRepository.save(any(SurveyTemplate.class))).thenReturn(template);

        final SurveyTemplate result = templateService.createTemplate(
                "Feedback Template", "Customer feedback", "feedback", CREATOR_ID, "{}");

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Feedback Template");
        assertThat(result.getCategory()).isEqualTo("feedback");
        verify(templateRepository).save(any(SurveyTemplate.class));
    }

    @Test
    void testGetTemplate_NotFound_ThrowsException() {
        when(templateRepository.findById(TEMPLATE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> templateService.getTemplate(TEMPLATE_ID_STRING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SurveyTemplate");
    }

    @Test
    void testListPublicTemplates_ReturnsPage() {
        final SurveyTemplate template = SurveyTemplate.create(
                "Public Template", "Desc", "general", CREATOR_ID, "{}");
        template.setId(UUID.randomUUID());
        template.makePublic();

        final Page<SurveyTemplate> page = new PageImpl<>(
                List.of(template), PageRequest.of(0, 10), 1);

        when(templateRepository.findByDeletedFalseAndPublicTemplateTrueOrderByUsageCountDesc(
                any(Pageable.class)))
                .thenReturn(page);

        final Page<SurveyTemplate> result = templateService.listPublicTemplates(PageRequest.of(0, 10));

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Public Template");
    }

    @Test
    void testUpdateTemplate_Unauthorized_ThrowsException() {
        final SurveyTemplate template = SurveyTemplate.create(
                "Template", "Desc", "cat", "other-user", "{}");
        template.setId(TEMPLATE_ID);

        when(templateRepository.findById(TEMPLATE_ID)).thenReturn(Optional.of(template));

        assertThatThrownBy(() -> templateService.updateTemplate(
                TEMPLATE_ID_STRING, "New Name", null, null, null, CREATOR_ID))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("Unauthorized"));
    }

    @Test
    void testPublishTemplate_Success() {
        final SurveyTemplate template = SurveyTemplate.create(
                "Template", "Desc", "cat", CREATOR_ID, "{}");
        template.setId(TEMPLATE_ID);

        when(templateRepository.findById(TEMPLATE_ID)).thenReturn(Optional.of(template));
        when(templateRepository.save(any(SurveyTemplate.class))).thenReturn(template);

        templateService.publishTemplate(TEMPLATE_ID_STRING, CREATOR_ID);

        verify(templateRepository).save(template);
        assertThat(template.isPublicTemplate()).isTrue();
    }

    @Test
    void testDeleteTemplate_Success() {
        final SurveyTemplate template = SurveyTemplate.create(
                "Template", "Desc", "cat", CREATOR_ID, "{}");
        template.setId(TEMPLATE_ID);

        when(templateRepository.findById(TEMPLATE_ID)).thenReturn(Optional.of(template));
        when(templateRepository.save(any(SurveyTemplate.class))).thenReturn(template);

        templateService.deleteTemplate(TEMPLATE_ID_STRING, CREATOR_ID);

        verify(templateRepository).save(template);
        assertThat(template.isDeleted()).isTrue();
    }
}
