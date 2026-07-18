package com.backofficepro.surveyplatform.identity.domain.repository;

import com.backofficepro.surveyplatform.identity.domain.Role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for the Role entity.
 *
 * @author BackOffice Pro
 */
public interface RoleRepository {

    /**
     * Finds a role by its unique identifier.
     *
     * @param id the role identifier
     * @return an Optional containing the role if found
     */
    Optional<Role> findById(UUID id);

    /**
     * Finds a role by its name.
     *
     * @param name the role name
     * @return an Optional containing the role if found
     */
    Optional<Role> findByName(String name);

    /**
     * Returns all roles.
     *
     * @return list of all roles
     */
    List<Role> findAll();

    /**
     * Saves a role entity.
     *
     * @param role the role to save
     * @return the saved role
     */
    Role save(Role role);

    /**
     * Checks if a role with the given name exists.
     *
     * @param name the role name
     * @return true if a role with that name exists
     */
    boolean existsByName(String name);
}
