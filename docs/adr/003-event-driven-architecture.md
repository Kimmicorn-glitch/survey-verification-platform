# ADR 003: Event-Driven Architecture with Domain Events

**Status**: Accepted
**Date**: 2026-01-20
**Authors**: BackOffice Pro Architecture Team
**Deciders**: Chief Architect, Engineering Leads

---

## Context

The Survey Verification Platform consists of multiple bounded contexts that need to react to changes in other contexts. For example:

- When a survey response is submitted (Survey Context), the Verification Context must begin verification
- When verification completes (Verification Context), the Trust Context must update scores
- When trust scores change (Trust Context), the Blockchain Context may record the new score
- When any significant event occurs, the Analytics Context must update dashboards

Using synchronous REST calls for these interactions would create tight coupling between services. If a downstream service is unavailable, the upstream service would fail or need complex retry logic. Additionally, synchronous calls would increase latency for the end user and create cascading failures.

## Decision

We will implement an **event-driven architecture using Apache Kafka as the event backbone**. Each bounded context publishes domain events when its state changes, and other contexts subscribe to the events they need.

### Event Topology

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│    Survey      │     │  Verification   │     │     Trust      │
│    Context     │     │   Context       │     │    Context     │
│                │     │                 │     │                │
│  ┌──────────┐  │     │  ┌──────────┐   │     │  ┌──────────┐  │
│  │Publisher  │──┼──┐ │  │Publisher │───┼──┐  │  │Publisher │──┼──┐
│  └──────────┘  │  │ │  └──────────┘   │  │  │  └──────────┘  │  │
└────────────────┘  │ │  └───────────────┘  │  │  └────────────────┘  │
                    │ │                      │  │                     │
                    ▼ │                      ▼  │                     ▼
              ┌──────────┐              ┌──────────┐           ┌──────────┐
              │  Kafka   │              │  Kafka   │           │  Kafka   │
              │  Topic:  │              │  Topic:  │           │  Topic:  │
              │  survey  │              │  verify  │           │  trust   │
              │ .events  │              │ .events  │           │ .events  │
              └────┬─────┘              └────┬─────┘           └────┬─────┘
                   │                         │                     │
                   ▼                         ▼                     ▼
              ┌──────────┐              ┌──────────┐           ┌──────────┐
              │Subscriber│              │Subscriber│           │Subscriber│
              └──────────┘              └──────────┘           └──────────┘
```

### Event Schema

All events use **Avro** schema format with Schema Registry for schema evolution:

```avro
{
  "type": "record",
  "name": "SurveyResponseSubmitted",
  "namespace": "za.co.backofficepro.surveyverify.event",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "aggregateId", "type": "string"},
    {"name": "version", "type": "int"},
    {"name": "timestamp", "type": {"type": "long", "logicalType": "timestamp-millis"}},
    {"name": "data", "type": {
      "type": "record",
      "name": "SurveyResponseSubmittedData",
      "fields": [
        {"name": "responseId", "type": "string"},
        {"name": "surveyId", "type": "string"},
        {"name": "respondentId", "type": "string"},
        {"name": "qualityScore", "type": "double"}
      ]
    }}
  ]
}
```

### Topic Structure

| Topic | Partitions | Retention | Cleanup Policy |
|-------|-----------|-----------|----------------|
| `survey.events` | 6 | 7 days | delete |
| `verification.events` | 6 | 7 days | delete |
| `trust.events` | 3 | 7 days | delete |
| `blockchain.events` | 3 | 14 days | compact |
| `analytics.events` | 6 | 3 days | delete |
| `dead-letter-topic` | 3 | 30 days | delete |

### Event Types

#### Survey Context Events
- `SurveyCreated`
- `SurveyPublished`
- `SurveyClosed`
- `SurveyResponseSubmitted`
- `SurveyResponseVerified`

#### Verification Context Events
- `VerificationRequested`
- `VerificationStarted`
- `VerificationStepCompleted`
- `VerificationCompleted`
- `VerificationRejected`

#### Trust Context Events
- `TrustScoreCalculated`
- `TrustScoreChanged`
- `ScoreThresholdBreached`

#### Blockchain Context Events
- `VerificationRecorded`
- `VerificationConfirmed`
- `NFTMinted`

### Error Handling

- **Dead letter queue**: Events that fail processing are moved to `dead-letter-topic` after 3 retries
- **Retry with backoff**: Exponential backoff: 1s, 5s, 30s
- **Idempotent handlers**: Event handlers are idempotent to handle duplicate deliveries
- **Monitoring**: Consumer lag tracked in Prometheus; alerts trigger if lag > 10,000

## Consequences

### Positive

- **Loose coupling**: Services only depend on event schemas, not on each other's availability
- **Scalability**: Event consumers can scale independently; multiple consumers can process events in parallel
- **Resilience**: Downstream service failures don't affect upstream services
- **Audit trail**: Event log provides a complete record of all state changes
- **Replay capability**: Services can rebuild state by replaying events from the beginning
- **Extensibility**: New consumers can subscribe to existing events without modifying publishers

### Negative

- **Eventual consistency**: Systems are eventually consistent; there is no guarantee that all subscribers have processed an event at any given moment
- **Debugging complexity**: Understanding the full flow requires tracing events across multiple services and topics
- **Schema evolution management**: All consumers must handle backward-compatible schema changes
- **Infrastructure overhead**: Kafka cluster adds operational complexity and resource requirements
- **Testing complexity**: Integration tests must include Kafka infrastructure
- **Duplicate events**: At-least-once delivery semantics means handlers must handle duplicates

### Mitigations

- **Tracing**: Jaeger distributed tracing across all event producers and consumers
- **Schema registry**: Enforces schema compatibility at compile time
- **Consumer groups**: Each service uses a consumer group for horizontal scaling
- **Dead letter queue**: Failed events are captured for analysis and replay
- **Test containers**: Use Testcontainers for Kafka in integration tests

---

## Monitoring and Alerting

| Metric | Warning | Critical |
|--------|---------|----------|
| Consumer Lag | > 1,000 | > 10,000 |
| Failed Messages Rate | > 1% | > 5% |
| Processing Time (p99) | > 500ms | > 2s |
| DLQ Message Count | > 100 | > 1,000 |

---

*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
