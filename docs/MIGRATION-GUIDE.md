# Migration Guide

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [Database Migration Process](#database-migration-process)
- [Environment Variable Changes](#environment-variable-changes)
- [API Versioning Policy](#api-versioning-policy)
- [Breaking Change Policy](#breaking-change-policy)

---

## Database Migration Process

### Flyway Migrations

All database schema changes are managed through Flyway. Each bounded context maintains its own set of migrations.

### Migration Structure

```
backend/java/
├── survey-verify-user/src/main/resources/db/migration/
│   ├── V1__create_user_tables.sql
│   ├── V2__add_consent_tables.sql
│   └── V3__add_mfa_fields.sql
├── survey-verify-survey/src/main/resources/db/migration/
│   ├── V1__create_survey_tables.sql
│   ├── V2__add_question_types.sql
│   └── V3__add_conditional_logic.sql
├── survey-verify-verification/src/main/resources/db/migration/
│   ├── V1__create_verification_tables.sql
│   ├── V2__add_verification_steps.sql
│   └── V3__add_fraud_indicators.sql
├── survey-verify-trust/src/main/resources/db/migration/
│   ├── V1__create_trust_tables.sql
│   └── V2__add_score_rules.sql
└── survey-verify-blockchain/src/main/resources/db/migration/
    ├── V1__create_blockchain_tables.sql
    └── V2__add_nft_tables.sql
```

### Naming Convention

```
V{version}__{description}.sql

Examples:
V1__create_user_tables.sql
V2__add_consent_tables.sql
V3__add_mfa_fields.sql
R__create_audit_view.sql  (Repeatable - re-run on checksum change)
U1__undo_v1.sql           (Undo migration)
```

### Running Migrations

#### Automatic (Recommended)
Migrations run on application startup. Configured in `application.yml`:
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true
    out-of-order: false
```

#### Manual via Maven
```bash
cd backend/java

# Run all pending migrations
mvn flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5432/survey_verify

# Check status
mvn flyway:info

# Validate against expected checksums
mvn flyway:validate

# Repair migration history (after manual fixes)
mvn flyway:repair
```

#### Manual via Docker
```bash
# Migrate survey database
docker run --rm \
  -v $(pwd)/survey-verify-survey/src/main/resources/db/migration:/flyway/sql \
  flyway/flyway:9 \
  -url=jdbc:postgresql://host.docker.internal:5432/survey_db \
  -user=survey_app \
  -password=<password> \
  migrate

# Check migration status
docker run --rm \
  -v $(pwd)/survey-verify-survey/src/main/resources/db/migration:/flyway/sql \
  flyway/flyway:9 \
  -url=jdbc:postgresql://host.docker.internal:5432/survey_db \
  -user=survey_app \
  -password=<password> \
  info
```

### Migration Best Practices

1. **Never modify an existing migration** - Create a new version instead
2. **Test migrations against a copy of production** before deploying
3. **Keep migrations small and focused** on a single change
4. **Always include both forward and rollback** considerations
5. **Use repeatable migrations (R__) for views and functions** that change frequently
6. **Include appropriate indexes** in the same migration that adds the table/column
7. **Use `IF NOT EXISTS` and `IF EXISTS`** for idempotent operations

### Rollback Strategy

```bash
# Create undo migration for V2
# U2__undo_v2.sql
DROP TABLE IF EXISTS user_consents;

# Apply undo
mvn flyway:undo
```

### Migration History Table

```sql
SELECT version, description, installed_on, success, checksum
FROM flyway_schema_history
ORDER BY installed_rank;
```

---

## Environment Variable Changes

### New Variables in v1.0.0-rc.1

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERVER_PORT` | No | `8080` | HTTP server port |
| `DATABASE_HOST` | Yes | - | PostgreSQL host |
| `DATABASE_PORT` | No | `5432` | PostgreSQL port |
| `DATABASE_NAME` | Yes | - | Database name |
| `DATABASE_USERNAME` | Yes | - | Database user |
| `DATABASE_PASSWORD` | Yes | - | Database password |
| `DATABASE_SSL_MODE` | No | `require` | SSL mode for database |
| `REDIS_HOST` | Yes | - | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | Conditional | - | Redis password (if auth enabled) |
| `KAFKA_BROKERS` | Yes | - | Comma-separated Kafka brokers |
| `KAFKA_SECURITY_PROTOCOL` | No | `PLAINTEXT` | Kafka security protocol |
| `JWT_SECRET` | Yes | - | JWT signing key (base64) |
| `JWT_EXPIRATION` | No | `3600` | Access token TTL (seconds) |
| `JWT_REFRESH_EXPIRATION` | No | `86400` | Refresh token TTL (seconds) |
| `AI_ENGINE_URL` | Yes | - | AI Engine gRPC endpoint |
| `BLOCKCHAIN_RPC_URL` | Yes | - | Polygon RPC endpoint |
| `BLOCKCHAIN_NETWORK` | No | `polygon` | Target blockchain network |
| `CONTRACT_ADDRESS` | Conditional | - | Smart contract address |
| `CONTRACT_PRIVATE_KEY` | Conditional | - | Signing key for contract calls |
| `STRIPE_API_KEY` | Conditional | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Conditional | - | Stripe webhook signing secret |
| `S3_BUCKET` | Conditional | - | S3 bucket for document storage |
| `S3_REGION` | No | `af-south-1` | AWS region |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `LOG_FORMAT` | No | `json` | Log output format |
| `PROMETHEUS_ENABLED` | No | `true` | Enable metrics endpoint |
| `JAEGER_ENDPOINT` | No | - | Jaeger collector endpoint |
| `OTEL_SERVICE_NAME` | No | - | OpenTelemetry service name |
| `SMTP_HOST` | Conditional | - | Email server host |
| `SMTP_PORT` | No | `587` | Email server port |
| `SMTP_USERNAME` | Conditional | - | Email server username |
| `SMTP_PASSWORD` | Conditional | - | Email server password |
| `CORS_ALLOWED_ORIGINS` | No | `*` | Allowed CORS origins |

### Renamed Variables

None for initial release.

### Removed Variables

None for initial release.

### Variable Migration Procedure

1. Export all current environment variables
2. Compare against the new variable list
3. Add any new required variables
4. Update variable values if defaults changed
5. Validate configuration with `GET /actuator/env`
6. Test all services before deploying to production

---

## API Versioning Policy

### Versioning Scheme

The API uses a **header-based versioning** strategy via the `X-API-Version` header.

```
Current Version: v1
Accept Header:   Accept: application/vnd.surveyverify.v1+json
```

### Version Lifecycle

| Phase | Description | Duration |
|-------|-------------|----------|
| **Active** | Fully supported, all features available | Indefinite |
| **Deprecated** | Still functional but no new features | 12 months minimum |
| **Sunset** | No longer accepting traffic | 6 months after deprecation notice |
| **Removed** | Endpoint returns 410 Gone | After sunset period |

### Version Policy

1. **New versions are additive** - A new API version adds capabilities without removing existing ones
2. **Deprecation notice** - Published in changelog and release notes at least 12 months before removal
3. **Sunset header** - Deprecated versions will receive `Sunset` header with removal date
4. **Migration window** - At least 12 months between deprecation and removal
5. **Beta versions** - May be available under `X-API-Version: beta` without stability guarantees

### How to Specify Version

```http
# Request using header
GET /api/v1/surveys
X-API-Version: v1

# Or use path-based (legacy)
GET /api/v1/surveys
```

### Version Migration

```bash
# Check current version
curl -I https://api.surveyverify.backofficepro.co.za/api/v1/surveys

# Response includes version info
X-API-Version: v1
API-Deprecated: false
Sunset: 
```

---

## Breaking Change Policy

### Definition

A breaking change is any modification that requires existing consumers to update their code to maintain functionality.

### Examples of Breaking Changes

- Removal or renaming of an API endpoint
- Removal or renaming of a request/response field
- Changing a field from optional to required
- Changing data types of existing fields
- Adding authentication to a previously public endpoint
- Changing error response format
- Modifying pagination behaviour
- Changing rate limit thresholds significantly

### Non-Breaking Changes

- Adding new endpoints
- Adding optional fields to request/response
- Adding new HTTP methods to existing endpoints
- Extending error codes with new values
- Reducing rate limits with adequate notice
- Adding new query parameters

### Change Management Process

```
1. Proposal ──▶ 2. Review ──▶ 3. Deprecation ──▶ 4. Migration ──▶ 5. Removal
   (RFC)       (Team)        (12mo notice)      (6mo window)     (Completion)
```

### Timeline

| Change Type | Notice Period | Communication |
|-------------|---------------|---------------|
| Non-breaking | Immediate | Release notes |
| Breaking (minor) | 6 months | Deprecation notice, changelog |
| Breaking (major) | 12 months | RFC, changelog, email notification |
| Security fix | As soon as possible | Security advisory |

### Communication Channels

- **Changelog** - Updated with every release
- **Release notes** - Detailed per-version documentation
- **API changelog** - `GET /api/v1/changelog`
- **Migration guide** - Step-by-step upgrade instructions
- **SDK updates** - Updated client libraries
- **Email notification** - Registered API consumers

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
