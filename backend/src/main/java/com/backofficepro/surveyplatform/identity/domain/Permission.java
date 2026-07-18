package com.backofficepro.surveyplatform.identity.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

/**
 * Permission entity representing a specific access permission.
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "permissions", schema = "identity")
public class Permission extends BaseEntity {

    @Column(name = "name", unique = true, nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "resource", nullable = false, length = 100)
    private String resource;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    protected Permission() {
        super();
    }

    /**
     * Creates a new Permission.
     *
     * @param name        the permission name (format: RESOURCE_ACTION)
     * @param description the permission description
     * @param resource    the target resource
     * @param action      the allowed action
     * @return the new Permission entity
     */
    public static Permission create(final String name,
                                    final String description,
                                    final String resource,
                                    final String action) {
        final Permission permission = new Permission();
        permission.name = name;
        permission.description = description;
        permission.resource = resource;
        permission.action = action;
        return permission;
    }
}
