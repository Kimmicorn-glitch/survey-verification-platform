package com.backofficepro.surveyplatform.identity.domain.exception;

import com.backofficepro.surveyplatform.shared.domain.exception.DomainException;

/**
 * Exception thrown when authentication fails due to invalid credentials.
 *
 * @author BackOffice Pro
 */
public class InvalidCredentialsException extends DomainException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructs an InvalidCredentialsException.
     *
     * @param message the error message
     */
    public InvalidCredentialsException(final String message) {
        super(message, "INVALID_CREDENTIALS");
    }
}
