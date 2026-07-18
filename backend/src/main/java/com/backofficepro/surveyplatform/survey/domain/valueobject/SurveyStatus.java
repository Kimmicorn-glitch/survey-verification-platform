package com.backofficepro.surveyplatform.survey.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

/**
 * Value object representing the status of a survey.
 *
 * @author BackOffice Pro
 */
public final class SurveyStatus extends ValueObject {

    private static final long serialVersionUID = 1L;

    public static final SurveyStatus DRAFT = new SurveyStatus("DRAFT");
    public static final SurveyStatus ACTIVE = new SurveyStatus("ACTIVE");
    public static final SurveyStatus PAUSED = new SurveyStatus("PAUSED");
    public static final SurveyStatus CLOSED = new SurveyStatus("CLOSED");
    public static final SurveyStatus ARCHIVED = new SurveyStatus("ARCHIVED");

    private final String value;

    /**
     * Constructs a SurveyStatus.
     *
     * @param value the status string
     */
    public SurveyStatus(final String value) {
        this.value = value;
    }

    /**
     * Creates a SurveyStatus from a string.
     *
     * @param value the status string
     * @return a new SurveyStatus
     */
    public static SurveyStatus of(final String value) {
        return new SurveyStatus(value.toUpperCase());
    }

    /**
     * Checks if this status allows editing.
     *
     * @return true if the survey can be edited
     */
    public boolean canEdit() {
        return "DRAFT".equals(value);
    }

    /**
     * Checks if this status allows collecting responses.
     *
     * @return true if the survey is accepting responses
     */
    public boolean canCollectResponses() {
        return "ACTIVE".equals(value);
    }

    /**
     * Transitions to the specified target status.
     *
     * @param target the target status
     * @return the new status
     * @throws com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException
     *         if the transition is not allowed
     */
    public SurveyStatus transitionTo(final SurveyStatus target) {
        final boolean validTransition = switch (this.value) {
            case "DRAFT" -> "ACTIVE".equals(target.value);
            case "ACTIVE" -> "PAUSED".equals(target.value) || "CLOSED".equals(target.value);
            case "PAUSED" -> "ACTIVE".equals(target.value) || "CLOSED".equals(target.value);
            case "CLOSED" -> "ARCHIVED".equals(target.value);
            default -> false;
        };
        if (!validTransition) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "InvalidStatusTransition",
                    "Cannot transition from " + this.value + " to " + target.value);
        }
        return target;
    }

    public String getValue() {
        return value;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{value};
    }

    @Override
    public String toString() {
        return value;
    }
}
