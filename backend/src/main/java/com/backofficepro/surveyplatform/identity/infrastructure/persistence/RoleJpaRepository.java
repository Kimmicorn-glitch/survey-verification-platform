package com.backofficepro.surveyplatform.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for RoleJpaEntity persistence operations.
 *
 * @author BackOffice Pro
 */
@Repository
public interface RoleJpaRepository extends JpaRepository<RoleJpaEntity, UUID> {

    /**
     * Finds a role by its name.
     *
     * @param name the role name
     * @return an Optional containing the role if found
     */
    Optional<RoleJpaEntity> findByName(String name);

    /**
     * Checks if a role exists with the given name.
     *
     * @param name the role name
     * @return true if a role with that name exists
     */
    boolean existsByName(String name);
}
