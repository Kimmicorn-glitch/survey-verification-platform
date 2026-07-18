package com.backofficepro.surveyplatform.identity.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;

import java.util.regex.Pattern;

/**
 * Immutable value object representing a validated password.
 *
 * <p>Enforces password strength requirements: minimum 8 characters, at least
 * one uppercase letter, one lowercase letter, one digit, and one special character.</p>
 *
 * @author BackOffice Pro
 */
public final class Password extends ValueObject {

    private static final long serialVersionUID = 1L;
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`]");

    private final String value;

    /**
     * Constructs a validated Password value object.
     *
     * @param value the raw password string
     * @throws BusinessRuleValidationException if the password does not meet strength requirements
     */
    public Password(final String value) {
        if (value == null) {
            throw new BusinessRuleValidationException(
                    "PasswordRequired", "Password must not be null");
        }
        if (value.length() < MIN_LENGTH) {
            throw new BusinessRuleValidationException(
                    "PasswordTooShort",
                    "Password must be at least " + MIN_LENGTH + " characters long");
        }
        if (value.length() > MAX_LENGTH) {
            throw new BusinessRuleValidationException(
                    "PasswordTooLong",
                    "Password must not exceed " + MAX_LENGTH + " characters");
        }
        if (!UPPERCASE.matcher(value).find()) {
            throw new BusinessRuleValidationException(
                    "PasswordNoUppercase",
                    "Password must contain at least one uppercase letter");
        }
        if (!LOWERCASE.matcher(value).find()) {
            throw new BusinessRuleValidationException(
                    "PasswordNoLowercase",
                    "Password must contain at least one lowercase letter");
        }
        if (!DIGIT.matcher(value).find()) {
            throw new BusinessRuleValidationException(
                    "PasswordNoDigit",
                    "Password must contain at least one digit");
        }
        if (!SPECIAL.matcher(value).find()) {
            throw new BusinessRuleValidationException(
                    "PasswordNoSpecial",
                    "Password must contain at least one special character");
        }
        this.value = value;
    }

    /**
     * Creates a Password from the given string.
     *
     * @param password the password string
     * @return a new Password value object
     */
    public static Password of(final String password) {
        return new Password(password);
    }

    /**
     * Returns the raw password value. This should only be used
     * for hashing purposes.
     *
     * @return the password string
     */
    public String getValue() {
        return value;
    }

    /**
     * Returns the length of the password.
     *
     * @return the character count
     */
    public int length() {
        return value.length();
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{value};
    }

    /**
     * Password intentionally does not override toString to prevent
     * accidental logging of plaintext passwords.
     */
    @Override
    public String toString() {
        return "Password{****}";
    }
}
