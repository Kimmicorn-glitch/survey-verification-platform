package com.backofficepro.surveyplatform.identity.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

/**
 * Immutable value object representing a user role.
 *
 * @author BackOffice Pro
 */
public final class UserRole extends ValueObject {

    private static final long serialVersionUID = 1L;

    private final String name;
    private final String description;

    /**
     * Constructs a UserRole value object.
     *
     * @param name        the role name
     * @param description the role description
     */
    public UserRole(final String name, final String description) {
        this.name = name;
        this.description = description;
    }

    public static UserRole of(final String name, final String description) {
        return new UserRole(name, description);
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{name};
    }
}
