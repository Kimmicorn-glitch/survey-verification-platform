package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.survey.domain.valueobject.QuestionType;
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
 * Question entity within the Survey aggregate.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "questions", schema = "survey")
public class Question extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

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
    private List<QuestionOption> options = new ArrayList<>();

    /**
     * Creates a new Question.
     *
     * @param text         the question text
     * @param questionType the type of question
     * @param required     whether the question is required
     * @return the new Question entity
     */
    public static Question create(final String text,
                                  final QuestionType questionType,
                                  final boolean required) {
        if (text == null || text.isBlank()) {
            throw new BusinessRuleValidationException(
                    "QuestionTextRequired", "Question text must not be blank");
        }
        final Question question = new Question();
        question.text = text.trim();
        question.questionType = questionType.name();
        question.required = required;
        return question;
    }

    /**
     * Adds an option to a choice-based question.
     *
     * @param option the option to add
     */
    public void addOption(final QuestionOption option) {
        if (!QuestionType.SINGLE_CHOICE.name().equals(questionType)
                && !QuestionType.MULTIPLE_CHOICE.name().equals(questionType)) {
            throw new BusinessRuleValidationException(
                    "OptionsNotAllowed",
                    "Options can only be added to choice-based questions");
        }
        option.setQuestion(this);
        option.setSortOrder(this.options.size() + 1);
        this.options.add(option);
    }

    /**
     * Updates the question text and description.
     *
     * @param text        the new text
     * @param description the new description
     */
    public void updateText(final String text, final String description) {
        this.text = text;
        this.description = description;
    }
}
