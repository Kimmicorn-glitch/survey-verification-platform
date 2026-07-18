package com.backofficepro.surveyplatform.shared.domain;

import java.util.Objects;

/**
 * Base class for immutable value objects in the domain model.
 *
 * <p>Value objects are defined by their attributes rather than identity.
 * Two value objects with the same attributes are considered equal.
 * All value objects must be immutable after construction.</p>
 *
 * @author BackOffice Pro
 */
public abstract class ValueObject {

    /**
     * Subclasses must implement this method to define the attributes that
     * determine equality for this value object.
     *
     * @return array of objects used for equality comparison
     */
    protected abstract Object[] getEqualityComponents();

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final ValueObject that = (ValueObject) o;
        return Objects.deepEquals(getEqualityComponents(), that.getEqualityComponents());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getEqualityComponents());
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder(getClass().getSimpleName()).append("{");
        final Object[] components = getEqualityComponents();
        for (int i = 0; i < components.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(components[i]);
        }
        return sb.append("}").toString();
    }
}
