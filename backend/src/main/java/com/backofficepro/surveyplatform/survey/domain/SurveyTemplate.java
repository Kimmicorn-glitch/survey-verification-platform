package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "survey_templates", schema = "survey")
public class SurveyTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "creator_id", nullable = false)
    private String creatorId;

    @Column(name = "is_public", nullable = false)
    private boolean publicTemplate;

    @Column(name = "usage_count", nullable = false)
    private int usageCount;

    @Column(name = "template_data", nullable = false, columnDefinition = "jsonb")
    private String templateData;

    @Column(name = "tags", columnDefinition = "text[]")
    private List<String> tags = new ArrayList<>();

    public static SurveyTemplate create(final String name,
                                         final String description,
                                         final String category,
                                         final String creatorId,
                                         final String templateData) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleValidationException(
                    "TemplateNameRequired", "Template name must not be blank");
        }
        if (category == null || category.isBlank()) {
            throw new BusinessRuleValidationException(
                    "TemplateCategoryRequired", "Template category must not be blank");
        }
        final SurveyTemplate template = new SurveyTemplate();
        template.name = name.trim();
        template.description = description;
        template.category = category;
        template.creatorId = creatorId;
        template.templateData = templateData;
        template.usageCount = 0;
        template.publicTemplate = false;
        return template;
    }

    public void incrementUsage() {
        this.usageCount++;
    }

    public void makePublic() {
        this.publicTemplate = true;
    }

    public void makePrivate() {
        this.publicTemplate = false;
    }
}
