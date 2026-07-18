package com.backofficepro.surveyplatform.identity.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;

import java.util.HashSet;
import java.util.Set;

/**
 * Role entity representing an authorization role within the identity context.
 *
 * <p>Roles are assigned to users and map to sets of permissions that
 * determine access control throughout the platform.</p>
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "roles", schema = "identity")
public class Role extends BaseEntity {

    @Column(name = "name", unique = true, nullable = false, length = 50)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permissions",
            schema = "identity",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();

    protected Role() {
        super();
    }

    /**
     * Creates a new Role with the specified name and description.
     *
     * @param name        the role name (must be unique)
     * @param description the role description
     * @return the new Role entity
     */
    public static Role create(final String name, final String description) {
        final Role role = new Role();
        role.name = name.toUpperCase();
        role.description = description;
        return role;
    }

    /**
     * Adds a permission to this role.
     *
     * @param permission the permission to add
     */
    public void addPermission(final Permission permission) {
        this.permissions.add(permission);
    }

    /**
     * Removes a permission from this role.
     *
     * @param permission the permission to remove
     */
    public void removePermission(final Permission permission) {
        this.permissions.remove(permission);
    }

    /**
     * Checks if this role has the specified permission.
     *
     * @param permissionName the permission name to check
     * @return true if the role has the permission
     */
    public boolean hasPermission(final String permissionName) {
        return permissions.stream()
                .anyMatch(p -> p.getName().equals(permissionName));
    }
}
