package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity for question persistence.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "questions", schema = "survey")
public class QuestionJpaEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private SurveyJpaEntity survey;

    @Column(name = "text", nullable = false, length = 1000)
    private String text;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "question_type", nullable = false, length = 30)
    private String questionType;

    @Column(name = "required", nullable = false)
    private boolean required;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "min_value")
    private Integer minValue;

    @Column(name = "max_value")
    private Integer maxValue;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QuestionOptionJpaEntity> options = new ArrayList<>();
}
