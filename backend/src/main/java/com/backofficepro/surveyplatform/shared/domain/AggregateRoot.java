package com.backofficepro.surveyplatform.shared.domain;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;
import jakarta.persistence.Transient;
import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Base class for aggregate roots in the Domain-Driven Design pattern.
 *
 * <p>Extends {@link BaseEntity} and adds domain event publishing capabilities.
 * Aggregate roots are the consistency boundaries of the domain and are the
 * only entry points for modifying the state within an aggregate.</p>
 *
 * @author BackOffice Pro
 */
@Getter
public abstract class AggregateRoot extends BaseEntity {

    @Transient
    private final List<DomainEvent> domainEvents = new ArrayList<>();

    /**
     * Registers a domain event to be published after the current transaction commits.
     *
     * @param event the domain event to register
     */
    protected void registerEvent(final DomainEvent event) {
        this.domainEvents.add(event);
    }

    /**
     * Returns an unmodifiable view of all registered domain events.
     *
     * @return unmodifiable list of domain events
     */
    public List<DomainEvent> getDomainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }

    /**
     * Clears all registered domain events after they have been published.
     */
    public void clearDomainEvents() {
        this.domainEvents.clear();
    }
}
