package com.backofficepro.surveyplatform.identity.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for UserJpaEntity persistence operations.
 *
 * @author BackOffice Pro
 */
@Repository
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {

    /**
     * Finds a user by email address.
     *
     * @param email the email address
     * @return an Optional containing the user if found
     */
    Optional<UserJpaEntity> findByEmail(String email);

    /**
     * Checks if a user exists with the given email.
     *
     * @param email the email address
     * @return true if a user with that email exists
     */
    boolean existsByEmail(String email);

    /**
     * Finds a user by email, fetching roles eagerly.
     *
     * @param email the email address
     * @return an Optional containing the user with roles if found
     */
    @Query("SELECT u FROM UserJpaEntity u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    Optional<UserJpaEntity> findByEmailWithRoles(@Param("email") String email);
}
