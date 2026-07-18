package com.backofficepro.surveyplatform.identity.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a user's role is assigned or removed.
 *
 * @author BackOffice Pro
 */
public class UserRoleChangedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    public static final String EVENT_TYPE = "USER_ROLE_CHANGED";

    private final String email;
    private final String roleName;
    private final String action;

    /**
     * Constructs a UserRoleChangedEvent.
     *
     * @param userId   the user's identifier
     * @param email    the user's email
     * @param roleName the affected role name
     * @param action   either "ASSIGNED" or "REMOVED"
     */
    public UserRoleChangedEvent(final String userId,
                                final String email,
                                final String roleName,
                                final String action) {
        super(EVENT_TYPE, userId);
        this.email = email;
        this.roleName = roleName;
        this.action = action;
    }

    public String getEmail() {
        return email;
    }

    public String getRoleName() {
        return roleName;
    }

    public String getAction() {
        return action;
    }
}
