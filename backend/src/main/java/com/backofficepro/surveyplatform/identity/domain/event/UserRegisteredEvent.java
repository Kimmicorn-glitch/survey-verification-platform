package com.backofficepro.surveyplatform.identity.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when a new user is registered.
 *
 * @author BackOffice Pro
 */
public class UserRegisteredEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    public static final String EVENT_TYPE = "USER_REGISTERED";

    private final String email;
    private final String firstName;
    private final String lastName;

    /**
     * Constructs a UserRegisteredEvent.
     *
     * @param userId    the new user's identifier
     * @param email     the user's email address
     * @param firstName the user's first name
     * @param lastName  the user's last name
     */
    public UserRegisteredEvent(final String userId,
                               final String email,
                               final String firstName,
                               final String lastName) {
        super(EVENT_TYPE, userId);
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }
}
