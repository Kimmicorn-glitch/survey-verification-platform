package com.backofficepro.surveyplatform.shared.domain.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Spring-based implementation of {@link DomainEventPublisher} that uses
 * the Spring ApplicationEventPublisher for synchronous event dispatch.
 *
 * <p>This implementation handles both domain events published through the
 * custom DomainEventPublisher interface and Spring's native application events.</p>
 *
 * @author BackOffice Pro
 */
@Component
public class SpringDomainEventPublisher implements DomainEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SpringDomainEventPublisher.class);

    private final org.springframework.context.ApplicationEventPublisher applicationEventPublisher;

    /**
     * Constructs a new SpringDomainEventPublisher.
     *
     * @param applicationEventPublisher the Spring application event publisher
     */
    public SpringDomainEventPublisher(
            final org.springframework.context.ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void publish(final DomainEvent event) {
        log.debug("Publishing domain event: {} for aggregate: {}",
                event.getEventType(), event.getAggregateId());
        applicationEventPublisher.publishEvent(event);
    }
}
