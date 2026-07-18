# ADR 002: CQRS Pattern for Survey Domain

**Status**: Accepted
**Date**: 2026-01-15
**Authors**: BackOffice Pro Architecture Team
**Deciders**: Chief Architect, Survey Team Lead

---

## Context

The Survey domain experiences a significantly higher read volume compared to writes. A single published survey can receive thousands of responses, each of which is read multiple times during verification. Additionally, the read model for survey data differs substantially from the write model:

- **Write operations**: Create survey, submit response, update status
- **Read operations**: View dashboard, generate reports, list surveys with filters, search survey responses

The write model must enforce strict business rules and maintain data integrity, while the read model needs to optimize for complex queries across multiple aggregates. Using the same model for both concerns leads to suboptimal performance for reads and complex code to handle write validation.

## Decision

We will implement **CQRS (Command Query Responsibility Segregation)** for the Survey domain, with plans to extend the pattern to Verification and Analytics domains.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        COMMAND SIDE                          │
│                                                              │
│  HTTP Command ──▶ Command Handler ──▶ Aggregate Root ──▶ Event Store
│                                                              │
│  Commands: CreateSurvey, PublishSurvey, SubmitResponse       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Domain Events (Kafka)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                        QUERY SIDE                            │
│                                                              │
│  Event Handler ──▶ Projection ──▶ Read Model (PostgreSQL)   │
│                                                              │
│  Queries: GetSurveyList, SearchResponses, GetDashboard      │
└─────────────────────────────────────────────────────────────┘
```

### Command Side

- **Command model**: JPA entities with domain logic (DDD aggregates)
- **Command handler**: Validates command, loads aggregate, applies changes, publishes events
- **Event store**: Domain events stored in `survey_events` table
- **Consistency**: Strong consistency within a single aggregate

### Query Side

- **Read model**: Lightweight DTOs and denormalized tables optimized for queries
- **Projections**: Event handlers that update read models asynchronously
- **Multiple projections**: Different read models for different query patterns (list view, detail view, analytics)
- **Consistency**: Eventual consistency between command and query sides

### Event Schema

```json
{
  "eventType": "SurveyCreated",
  "aggregateId": "survey-uuid-456",
  "version": 1,
  "timestamp": "2026-01-15T10:00:00Z",
  "data": {
    "title": "Customer Satisfaction Survey",
    "organizationId": "org-uuid-123"
  }
}
```

## Consequences

### Positive

- **Optimized read performance**: Read models are denormalized for specific query patterns
- **Independent scaling**: Command and query services scale independently
- **Simplified domain model**: Write model focuses on business rules without query optimization concerns
- **Audit trail**: Event store provides immutable history of all changes
- **Flexible reporting**: New read models can be created without modifying the write model
- **Team specialization**: Different teams can own command and query sides

### Negative

- **Eventual consistency**: Read models lag behind writes (typically sub-second)
- **Additional infrastructure**: Requires event streaming (Kafka) and projection infrastructure
- **Increased code complexity**: Maintaining both command and query models doubles code surface
- **Learning curve**: Team must understand CQRS patterns and event sourcing concepts
- **Debugging difficulty**: Tracing a write through to the read model requires understanding the event flow

### Mitigations

- **Eventual consistency SLA**: 99.9% of read models updated within 1 second
- **Strong consistency for critical reads**: Verification status reads bypass cache and hit command side
- **Monitoring**: Track projection lag in Grafana dashboards
- **Testing**: Contract tests for event schema compatibility
- **Documentation**: Clear documentation of event-driven flows

---

## When to Use (and Not Use) CQRS

### Use CQRS When
- High read-to-write ratio (read-heavy workloads)
- Different read and write data shapes
- Need for multiple read models for different consumers
- Audit trail requirements

### Do NOT Use CQRS When
- Simple CRUD operations with identical read/write shapes
- Very low latency requirements for reads (< 10ms)
- Simple domains with minimal query complexity

---

## Implementation Plan

| Phase | Context | Timeline |
|-------|---------|----------|
| Phase 1 | Survey domain (command + read model) | v1.0.0 |
| Phase 2 | Verification domain (command + read model) | v1.0.0 |
| Phase 3 | Analytics domain (read model only) | v1.0.0 |
| Phase 4 | Trust domain (extend existing) | v1.1.0 |

---

*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
