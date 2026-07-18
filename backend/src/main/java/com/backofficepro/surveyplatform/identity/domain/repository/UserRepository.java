package com.backofficepro.surveyplatform.identity.domain.repository;

import com.backofficepro.surveyplatform.identity.domain.User;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for the User aggregate root.
 *
 * <p>This is a port interface that defines the data access contract for Users.
 * The actual implementation is in the infrastructure layer using JPA.</p>
 *
 * @author BackOffice Pro
 */
public interface UserRepository {

    /**
     * Finds a user by their unique identifier.
     *
     * @param id the user identifier
     * @return an Optional containing the user if found
     */
    Optional<User> findById(UUID id);

    /**
     * Finds a user by their email address.
     *
     * @param email the email address
     * @return an Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user with the given email exists.
     *
     * @param email the email address
     * @return true if a user with that email exists
     */
    boolean existsByEmail(String email);

    /**
     * Saves a user entity.
     *
     * @param user the user to save
     * @return the saved user
     */
    User save(User user);

    /**
     * Deletes a user by their identifier.
     *
     * @param id the user identifier
     */
    void deleteById(UUID id);
}
