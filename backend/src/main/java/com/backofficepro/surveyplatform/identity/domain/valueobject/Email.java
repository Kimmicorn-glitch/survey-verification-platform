package com.backofficepro.surveyplatform.identity.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Immutable value object representing a validated email address.
 *
 * <p>Enforces RFC-compliant email formatting and normalizes to lowercase.</p>
 *
 * @author BackOffice Pro
 */
public final class Email extends ValueObject {

    private static final long serialVersionUID = 1L;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private final String value;

    /**
     * Constructs a validated Email value object.
     *
     * @param value the raw email string
     * @throws BusinessRuleValidationException if the email format is invalid
     */
    public Email(final String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessRuleValidationException(
                    "EmailRequired", "Email address must not be blank");
        }
        final String normalized = value.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new BusinessRuleValidationException(
                    "EmailInvalid", "Invalid email address format: " + value);
        }
        this.value = normalized;
    }

    /**
     * Creates an Email from the given string.
     *
     * @param email the email string
     * @return a new Email value object
     */
    public static Email of(final String email) {
        return new Email(email);
    }

    /**
     * Returns the normalized email address.
     *
     * @return the email string in lowercase
     */
    public String getValue() {
        return value;
    }

    /**
     * Returns the domain part of the email address.
     *
     * @return the domain portion after the @ symbol
     */
    public String getDomain() {
        return value.substring(value.indexOf('@') + 1);
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
