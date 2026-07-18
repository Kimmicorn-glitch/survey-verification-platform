package com.backofficepro.surveyplatform.identity.domain.exception;

import com.backofficepro.surveyplatform.shared.domain.exception.DomainException;

import java.util.UUID;

/**
 * Exception thrown when a locked account attempts to authenticate.
 *
 * @author BackOffice Pro
 */
public class UserAccountLockedException extends DomainException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructs a UserAccountLockedException.
     *
     * @param userId the locked user's identifier
     */
    public UserAccountLockedException(final UUID userId) {
        super("Account is locked for user: " + userId, "ACCOUNT_LOCKED");
    }
}
