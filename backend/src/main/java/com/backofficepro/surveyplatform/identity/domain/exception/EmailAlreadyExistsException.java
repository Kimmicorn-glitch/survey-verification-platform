package com.backofficepro.surveyplatform.identity.domain.exception;

import com.backofficepro.surveyplatform.shared.domain.exception.DomainException;

/**
 * Exception thrown when a user attempts to register with an email that already exists.
 *
 * @author BackOffice Pro
 */
public class EmailAlreadyExistsException extends DomainException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructs an EmailAlreadyExistsException.
     *
     * @param email the duplicate email address
     */
    public EmailAlreadyExistsException(final String email) {
        super("An account with email " + email + " already exists", "EMAIL_ALREADY_EXISTS");
    }
}
