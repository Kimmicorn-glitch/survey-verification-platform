package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "survey_branch_rules", schema = "survey")
public class BranchRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_question_id", nullable = false)
    private Question sourceQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_question_id", nullable = false)
    private Question targetQuestion;

    @Column(name = "condition_type", nullable = false, length = 30)
    private String conditionType;

    @Column(name = "condition_value", nullable = false, length = 500)
    private String conditionValue;

    @Column(name = "operator", nullable = false, length = 10)
    private String operator;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public static BranchRule create(final Question sourceQuestion,
                                     final Question targetQuestion,
                                     final String conditionType,
                                     final String conditionValue,
                                     final String operator) {
        if (conditionType == null || conditionType.isBlank()) {
            throw new BusinessRuleValidationException(
                    "ConditionTypeRequired", "Condition type must not be blank");
        }
        final BranchRule rule = new BranchRule();
        rule.sourceQuestion = sourceQuestion;
        rule.targetQuestion = targetQuestion;
        rule.conditionType = conditionType.toUpperCase();
        rule.conditionValue = conditionValue;
        rule.operator = operator != null ? operator.toUpperCase() : "AND";
        return rule;
    }

    public boolean evaluate(final String answerValue) {
        return switch (conditionType) {
            case "EQUALS" -> conditionValue.equals(answerValue);
            case "NOT_EQUALS" -> !conditionValue.equals(answerValue);
            case "CONTAINS" -> answerValue != null && answerValue.contains(conditionValue);
            case "GREATER_THAN" -> {
                try {
                    yield Double.parseDouble(answerValue) > Double.parseDouble(conditionValue);
                } catch (final NumberFormatException e) {
                    yield false;
                }
            }
            case "LESS_THAN" -> {
                try {
                    yield Double.parseDouble(answerValue) < Double.parseDouble(conditionValue);
                } catch (final NumberFormatException e) {
                    yield false;
                }
            }
            case "IS_EMPTY" -> answerValue == null || answerValue.isBlank();
            case "IS_NOT_EMPTY" -> answerValue != null && !answerValue.isBlank();
            default -> false;
        };
    }
}
