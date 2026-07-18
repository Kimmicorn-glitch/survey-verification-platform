# Developer Guide

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Architecture Overview](#architecture-overview)
- [Code Conventions](#code-conventions)
- [Testing Guide](#testing-guide)
- [API Development Guide](#api-development-guide)
- [Database Development Guide](#database-development-guide)
- [Frontend Development Guide](#frontend-development-guide)

---

## Development Environment Setup

### Prerequisites

```bash
# Required tools
- JDK 17 (OpenJDK or Oracle)
- Node.js 18+
- Rust 1.70+
- Docker 24.0+
- Docker Compose 2.20+
- IntelliJ IDEA (recommended) or VS Code
- Git
```

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform

# Start infrastructure services
docker-compose -f docker-compose.infra.yml up -d

# Verify infrastructure
docker-compose ps
# Expect: postgres, redis, kafka, mongodb, elasticsearch
```

### Java Backend Setup

```bash
cd backend/java

# Build all modules
mvn clean install -DskipTests

# Run a specific service (e.g., Survey Service)
mvn spring-boot:run -pl survey-verify-survey

# Or run all services via Docker
cd ../..
docker-compose up -d survey-service verification-service user-service
```

### AI Engine (Rust) Setup

```bash
cd engine/rust

# Build
cargo build

# Run with hot-reload
cargo watch -x run

# Run tests
cargo test
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm ci

# Start development server
npm run dev
# Runs on http://localhost:3000
```

### Environment Variables (Local)

```bash
# .env.local (copy from .env.example)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=survey_verify
DATABASE_USERNAME=survey_app
DATABASE_PASSWORD=dev_password
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=dev-jwt-secret-key-not-for-production
```

### Verify Setup

```bash
# Backend health
curl http://localhost:8080/actuator/health

# AI Engine health
curl http://localhost:9090/health

# Frontend
open http://localhost:3000
```

---

## Architecture Overview

### System Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture documentation.

**Key patterns:**
- **Domain-Driven Design (DDD)** - 7 bounded contexts
- **CQRS** - Separate command and query models
- **Event-Driven** - Async communication via Kafka
- **Microservices** - Independently deployable services
- **API Gateway** - Single entry point with routing

### Service Matrix

| Service | Port | Language | Database | Responsibilities |
|---------|------|----------|----------|------------------|
| API Gateway | 8080 | Java | - | Routing, auth, rate limiting |
| Survey Service | 8082 | Java | PostgreSQL | Survey CRUD, lifecycle |
| Verification Service | 8083 | Java | PostgreSQL | Workflow orchestration |
| User Service | 8084 | Java | PostgreSQL | Auth, roles, consent |
| Trust Service | 8085 | Java | PostgreSQL + Redis | Score calculation |
| Blockchain Service | 8086 | Java | PostgreSQL | On-chain operations |
| Analytics Service | 8087 | Java | PostgreSQL + ES | Dashboards, reports |
| AI Engine | 9090 | Rust | Redis | Fraud detection, GPS |

### Communication Patterns

- **Synchronous**: REST between client and API Gateway
- **Asynchronous**: Kafka events between services
- **Event types**: Domain events, CQRS events, saga events
- **Schema**: Avro with Schema Registry

---

## Code Conventions

### Java Conventions

- **Style**: Google Java Style Guide
- **Formatting**: Use `mvn spotless:apply` before committing
- **Maximum method length**: 50 lines
- **Maximum class length**: 500 lines
- **Null handling**: Use `Optional`, never return `null`
- **Validation**: Bean Validation annotations in DTOs, domain validation in entities
- **Logging**: Use SLF4J with structured logging
- **Comments**: Javadoc for public APIs only; no inline comments for self-documenting code

### Rust Conventions

- **Style**: Rust API Guidelines + Clippy pedantic
- **Formatting**: `cargo fmt` before committing
- **Linting**: `cargo clippy -- -D warnings`
- **Maximum function length**: 50 lines
- **Error handling**: Use `Result` and `anyhow`/`thiserror`
- **Naming**: `snake_case` for functions/variables, `PascalCase` for types

### TypeScript/JavaScript Conventions

- **Style**: Airbnb Style Guide with TypeScript strict mode
- **Formatting**: Prettier with `--single-quote --trailing-comma all`
- **Prefer**: `const` over `let`, `async/await` over promises
- **Maximum line length**: 100 characters
- **Component naming**: PascalCase files, default exports

### SQL Conventions

- **Keywords**: UPPERCASE
- **Identifiers**: `snake_case`
- **Always specify** table aliases
- **Comments** for complex queries only

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <description>

feat(survey): add conditional question logic
fix(auth): resolve token refresh race condition
docs(api): update verification endpoint docs
```

---

## Testing Guide

### Test Pyramid

```
    ╱╲
   ╱  ╲
  ╱ E2E╲        Playwright - Critical paths
 ╱──────╲
╱  Integration ╲  Testcontainers - Service interactions
╱────────────────╲
╱     Unit Tests   ╱  JUnit 5 (Java) / cargo test (Rust) - 85%+ coverage
```

### Java Testing

```bash
# Run unit tests
mvn test

# Run integration tests (requires Docker for Testcontainers)
mvn verify

# Run with coverage
mvn jacoco:report
# Report at: target/site/jacoco/index.html
```

**Testing patterns:**
- Unit: JUnit 5 + Mockito for isolated service tests
- Integration: @SpringBootTest + Testcontainers for DB tests
- Contract: Spring Cloud Contract for service boundaries
- Performance: k6 for load testing

### Rust Testing

```bash
# Run tests
cargo test

# With coverage
cargo tarpaulin --out Html

# Specific test
cargo test test_fraud_detection_low_risk
```

### Frontend Testing

```bash
# Unit tests (Vitest)
npm run test

# Component tests (Testing Library)
npm run test:components

# E2E tests (Playwright)
npm run test:e2e

# Visual regression
npm run test:visual
```

### Test Data

- **Synthetic data generators** in `test/resources/data`
- **Mock factories** for domain objects (e.g., `SurveyFactory`)
- **Testcontainers** for database-dependent tests
- **WireMock** for external service stubs

---

## API Development Guide

### Creating a New Endpoint

1. **Define the contract** - Update OpenAPI spec in `api/openapi.yaml`
2. **Create DTOs** - Request/Response classes with validation
3. **Write the controller** - REST controller class
4. **Implement service** - Business logic in service layer
5. **Handle persistence** - Repository or event handler
6. **Add tests** - Unit, integration, and E2E tests

### Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/surveys")
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SurveyResponse createSurvey(@Valid @RequestBody CreateSurveyRequest request) {
        return surveyService.createSurvey(request);
    }

    @GetMapping("/{surveyId}")
    public SurveyResponse getSurvey(@PathVariable UUID surveyId) {
        return surveyService.getSurvey(surveyId);
    }

    @PutMapping("/{surveyId}")
    public SurveyResponse updateSurvey(@PathVariable UUID surveyId,
                                       @Valid @RequestBody UpdateSurveyRequest request) {
        return surveyService.updateSurvey(surveyId, request);
    }

    @DeleteMapping("/{surveyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSurvey(@PathVariable UUID surveyId) {
        surveyService.deleteSurvey(surveyId);
    }
}
```

### Validation Rules

- **Input validation**: Bean Validation annotations on DTOs
- **Business validation**: Domain entity methods with exceptions
- **Cross-field validation**: Custom validators for field interactions
- **Error format**: Standardized error response with error codes

### OpenAPI Documentation

Annotations automatically generate OpenAPI spec:
```java
@Operation(summary = "Create a new survey", description = "...")
@ApiResponse(responseCode = "201", description = "Survey created")
```

---

## Database Development Guide

### Adding a Migration

1. Create migration file: `V{next_version}__{description}.sql`
2. Write SQL for the change
3. Test locally with `mvn flyway:migrate`
4. Create an undo migration if needed: `U{version}__{description}.sql`

### Migration Template

```sql
-- V11__add_survey_tags.sql

CREATE TABLE survey_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_survey_tag UNIQUE (survey_id, tag)
);

CREATE INDEX idx_survey_tags_survey ON survey_tags(survey_id);
CREATE INDEX idx_survey_tags_tag ON survey_tags(tag);
```

### Entity Design

- **Aggregate roots** own their entities via cascade
- **Value objects** are `@Embeddable` or stored as JSONB
- **Soft delete** for audit-critical entities
- **Optimistic locking** with `@Version` for conflict detection
- **Created/updated timestamps** on all entities

### Query Optimization

- Use **indexes** for all foreign keys and filter columns
- Prefer **LIMIT** queries over full table scans
- Use **materialized views** for complex aggregations
- Cache **read models** in Redis for hot data

---

## Frontend Development Guide

### Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Button, Input, Modal, Table
│   │   ├── survey/       # Survey builder components
│   │   ├── verification/ # Verification workflow components
│   │   └── admin/        # Admin dashboard components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client functions
│   ├── store/            # State management (Zustand)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
├── tests/                # Test files
└── playwright.config.ts  # E2E test config
```

### Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Query | Server state management |
| Zustand | Client state management |
| React Hook Form | Form management |
| Socket.IO | Real-time updates |
| Playwright | E2E testing |
| Vitest | Unit testing |

### State Management

```typescript
// API data - React Query
const { data, isLoading } = useQuery(['surveys', orgId], () => surveyApi.list(orgId));

// UI state - Zustand
const useSurveyStore = create((set) => ({
  selectedSurveyId: null,
  setSelectedSurveyId: (id) => set({ selectedSurveyId: id }),
}));

// Form state - React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm<SurveyForm>();
```

### API Client

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format
```

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
