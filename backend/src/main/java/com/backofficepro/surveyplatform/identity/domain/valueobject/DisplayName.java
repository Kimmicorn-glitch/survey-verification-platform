package com.backofficepro.surveyplatform.identity.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

import java.util.Objects;

/**
 * Immutable value object representing a user's display name.
 *
 * @author BackOffice Pro
 */
public final class DisplayName extends ValueObject {

    private static final long serialVersionUID = 1L;
    private static final int MIN_LENGTH = 2;
    private static final int MAX_LENGTH = 100;

    private final String firstName;
    private final String lastName;

    /**
     * Constructs a DisplayName value object.
     *
     * @param firstName the first name
     * @param lastName  the last name
     */
    public DisplayName(final String firstName, final String lastName) {
        Objects.requireNonNull(firstName, "First name must not be null");
        Objects.requireNonNull(lastName, "Last name must not be null");
        final String trimmedFirst = firstName.trim();
        final String trimmedLast = lastName.trim();
        if (trimmedFirst.length() < MIN_LENGTH || trimmedFirst.length() > MAX_LENGTH) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "InvalidFirstName",
                    "First name must be between " + MIN_LENGTH + " and " + MAX_LENGTH + " characters");
        }
        if (trimmedLast.length() < MIN_LENGTH || trimmedLast.length() > MAX_LENGTH) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException(
                    "InvalidLastName",
                    "Last name must be between " + MIN_LENGTH + " and " + MAX_LENGTH + " characters");
        }
        this.firstName = trimmedFirst;
        this.lastName = trimmedLast;
    }

    /**
     * Creates a DisplayName from first and last name strings.
     *
     * @param firstName the first name
     * @param lastName  the last name
     * @return a new DisplayName value object
     */
    public static DisplayName of(final String firstName, final String lastName) {
        return new DisplayName(firstName, lastName);
    }

    /**
     * Returns the full display name.
     *
     * @return the full name as "FirstName LastName"
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{firstName, lastName};
    }
}
