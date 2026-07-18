package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA entity for question option persistence.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "question_options", schema = "survey")
public class QuestionOptionJpaEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionJpaEntity question;

    @Column(name = "text", nullable = false, length = 500)
    private String text;

    @Column(name = "value", length = 100)
    private String value;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_other", nullable = false)
    private boolean isOther;
}
