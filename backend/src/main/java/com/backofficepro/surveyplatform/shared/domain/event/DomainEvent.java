package com.backofficepro.surveyplatform.shared.domain.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base class for all domain events in the system.
 *
 * <p>Domain events represent something meaningful that happened in the domain.
 * They are immutable and carry all the information needed to describe the
 * occurrence. Events are used for cross-context communication via the
 * publish-subscribe pattern.</p>
 *
 * @author BackOffice Pro
 */
public abstract class DomainEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private final UUID eventId;
    private final LocalDateTime occurredAt;
    private final String eventType;
    private final String aggregateId;

    /**
     * Constructs a new domain event.
     *
     * @param eventType   the type identifier of the event
     * @param aggregateId the identifier of the aggregate root that produced this event
     */
    protected DomainEvent(final String eventType, final String aggregateId) {
        this.eventId = UUID.randomUUID();
        this.occurredAt = LocalDateTime.now();
        this.eventType = eventType;
        this.aggregateId = aggregateId;
    }

    /**
     * Returns the unique identifier of this event instance.
     *
     * @return event identifier
     */
    public UUID getEventId() {
        return eventId;
    }

    /**
     * Returns the timestamp when this event occurred.
     *
     * @return occurrence timestamp
     */
    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    /**
     * Returns the type identifier for this event.
     *
     * @return event type string
     */
    public String getEventType() {
        return eventType;
    }

    /**
     * Returns the identifier of the aggregate that produced this event.
     *
     * @return aggregate identifier
     */
    public String getAggregateId() {
        return aggregateId;
    }

    @Override
    public String toString() {
        return "DomainEvent{" +
                "eventId=" + eventId +
                ", eventType='" + eventType + '\'' +
                ", aggregateId='" + aggregateId + '\'' +
                ", occurredAt=" + occurredAt +
                '}';
    }
}
