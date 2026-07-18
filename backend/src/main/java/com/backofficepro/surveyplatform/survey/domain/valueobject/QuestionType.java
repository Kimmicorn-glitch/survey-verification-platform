package com.backofficepro.surveyplatform.survey.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

/**
 * Enum representing the type of survey question.
 *
 * @author BackOffice Pro
 */
public enum QuestionType extends ValueObject {

    SINGLE_CHOICE("Single Choice"),
    MULTIPLE_CHOICE("Multiple Choice"),
    TEXT("Free Text"),
    RATING("Rating Scale"),
    YES_NO("Yes/No"),
    SCALE("Linear Scale"),
    DATE("Date"),
    TIME("Time"),
    FILE_UPLOAD("File Upload");

    private final String displayName;

    QuestionType(final String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{name()};
    }
}
