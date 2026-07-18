package com.backofficepro.surveyplatform.shared.domain.event;

/**
 * Interface for publishing domain events across bounded contexts.
 *
 * <p>This interface defines the contract for event publishing infrastructure.
 * Implementations may publish events synchronously within the same transaction
 * or asynchronously via message brokers.</p>
 *
 * @author BackOffice Pro
 */
public interface DomainEventPublisher {

    /**
     * Publishes a domain event to all registered subscribers.
     *
     * @param event the domain event to publish
     */
    void publish(DomainEvent event);
}
