package com.backofficepro.surveyplatform.shared.domain.exception;

import java.util.UUID;

/**
 * Exception thrown when a requested entity cannot be found in the repository.
 *
 * @author BackOffice Pro
 */
public class EntityNotFoundException extends DomainException {

    private static final long serialVersionUID = 1L;

    /**
     * Constructs an EntityNotFoundException for the specified entity type and identifier.
     *
     * @param entityType the simple name of the entity class
     * @param entityId   the identifier of the entity that was not found
     */
    public EntityNotFoundException(final String entityType, final UUID entityId) {
        super(entityType + " not found with id: " + entityId, "ENTITY_NOT_FOUND");
    }

    /**
     * Constructs an EntityNotFoundException for the specified entity type and search criteria.
     *
     * @param entityType the simple name of the entity class
     * @param criteria   the criteria used to search for the entity
     */
    public EntityNotFoundException(final String entityType, final String criteria) {
        super(entityType + " not found with criteria: " + criteria, "ENTITY_NOT_FOUND");
    }
}
