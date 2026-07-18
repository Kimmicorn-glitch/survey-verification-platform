package com.backofficepro.surveyplatform.shared.domain.exception;

/**
 * Exception thrown when a business rule or invariant is violated.
 *
 * @author BackOffice Pro
 */
public class BusinessRuleValidationException extends DomainException {

    private static final long serialVersionUID = 1L;

    private final String ruleName;

    /**
     * Constructs a BusinessRuleValidationException with the specified rule and message.
     *
     * @param ruleName the name of the business rule that was violated
     * @param message  the detail message describing the violation
     */
    public BusinessRuleValidationException(final String ruleName, final String message) {
        super(message, "BUSINESS_RULE_VIOLATION");
        this.ruleName = ruleName;
    }

    /**
     * Returns the name of the business rule that was violated.
     *
     * @return the rule name
     */
    public String getRuleName() {
        return ruleName;
    }
}
