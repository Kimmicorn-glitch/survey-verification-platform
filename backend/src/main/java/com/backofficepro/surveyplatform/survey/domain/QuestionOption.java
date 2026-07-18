package com.backofficepro.surveyplatform.survey.domain;

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
 * Option entity for choice-based questions.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "question_options", schema = "survey")
public class QuestionOption extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "text", nullable = false, length = 500)
    private String text;

    @Column(name = "value", length = 100)
    private String value;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_other", nullable = false)
    private boolean isOther;

    /**
     * Creates a new QuestionOption.
     *
     * @param text the display text
     * @param value the option value
     * @return the new QuestionOption entity
     */
    public static QuestionOption create(final String text, final String value) {
        final QuestionOption option = new QuestionOption();
        option.text = text;
        option.value = value != null ? value : text;
        option.isOther = false;
        return option;
    }

    /**
     * Creates an "Other" option that allows free-text input.
     *
     * @param text the display text
     * @return the new QuestionOption entity
     */
    public static QuestionOption createOther(final String text) {
        final QuestionOption option = create(text, "OTHER");
        option.isOther = true;
        return option;
    }
}
