package com.backofficepro.surveyplatform.verification.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

/**
 * Value object representing the status of a verification request.
 *
 * @author BackOffice Pro
 */
public final class VerificationStatus extends ValueObject {

    private static final long serialVersionUID = 1L;

    public static final VerificationStatus PENDING = new VerificationStatus("PENDING");
    public static final VerificationStatus IN_PROGRESS = new VerificationStatus("IN_PROGRESS");
    public static final VerificationStatus COMPLETED = new VerificationStatus("COMPLETED");
    public static final VerificationStatus FAILED = new VerificationStatus("FAILED");
    public static final VerificationStatus CANCELLED = new VerificationStatus("CANCELLED");

    private final String value;

    public VerificationStatus(final String value) {
        this.value = value;
    }

    public static VerificationStatus of(final String value) {
        return new VerificationStatus(value.toUpperCase());
    }

    public String getValue() {
        return value;
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
