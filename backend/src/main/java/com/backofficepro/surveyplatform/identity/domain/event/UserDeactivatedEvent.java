package com.backofficepro.surveyplatform.identity.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a user account is deactivated.
 *
 * @author BackOffice Pro
 */
public class UserDeactivatedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    public static final String EVENT_TYPE = "USER_DEACTIVATED";

    private final String email;
    private final String deactivatedBy;

    /**
     * Constructs a UserDeactivatedEvent.
     *
     * @param userId       the deactivated user's identifier
     * @param email        the user's email address
     * @param deactivatedBy the admin who performed the deactivation
     */
    public UserDeactivatedEvent(final String userId,
                                final String email,
                                final String deactivatedBy) {
        super(EVENT_TYPE, userId);
        this.email = email;
        this.deactivatedBy = deactivatedBy;
    }

    public String getEmail() {
        return email;
    }

    public String getDeactivatedBy() {
        return deactivatedBy;
    }
}
