package com.backofficepro.surveyplatform.shared.domain.exception;

/**
 * Base exception for all domain-specific exceptions.
 *
 * <p>This exception represents a violation of business rules or invariants
 * within the domain model. All domain exceptions should provide meaningful
 * messages that explain the business constraint that was violated.</p>
 *
 * @author BackOffice Pro
 */
public class DomainException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String code;

    /**
     * Constructs a new DomainException with the specified detail message.
     *
     * @param message the detail message
     */
    public DomainException(final String message) {
        super(message);
        this.code = "DOMAIN_ERROR";
    }

    /**
     * Constructs a new DomainException with the specified detail message and error code.
     *
     * @param message the detail message
     * @param code    the error code identifying the type of error
     */
    public DomainException(final String message, final String code) {
        super(message);
        this.code = code;
    }

    /**
     * Constructs a new DomainException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause   the cause of this exception
     */
    public DomainException(final String message, final Throwable cause) {
        super(message, cause);
        this.code = "DOMAIN_ERROR";
    }

    /**
     * Returns the error code for this exception.
     *
     * @return the error code
     */
    public String getCode() {
        return code;
    }
}
