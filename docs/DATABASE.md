# Database Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Schema Overview](#schema-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Table Descriptions](#table-descriptions)
- [Indexes](#indexes)
- [Migrations](#migrations)
- [Backup Strategy](#backup-strategy)

---

## Schema Overview

### Database Instances

| Database | Purpose | Engine |
|----------|---------|--------|
| `survey_verify` | Main relational data | PostgreSQL 15 |
| `survey_db` | Survey context data | PostgreSQL 15 |
| `verification_db` | Verification context data | PostgreSQL 15 |
| `user_db` | User context data | PostgreSQL 15 |
| `trust_db` | Trust score context data | PostgreSQL 15 |
| `blockchain_db` | Blockchain context data | PostgreSQL 15 |
| `analytics_db` | Analytics read models | PostgreSQL 15 |
| `survey_verify_cache` | Redis cache store | Redis 7 |
| `survey_verify_docs` | Document storage | MongoDB 7 |

### Schema Strategy

Each bounded context uses its own database schema to ensure loose coupling and independent deployment. Cross-context queries are handled through:
- Domain events via Kafka
- Materialized views for analytics
- API composition patterns

---

## Entity Relationship Diagram

### User Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SCHEMA                               │
│                                                                  │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐ │
│  │   users      │       │  memberships │       │ organizations│ │
│  │──────────────│       │──────────────│       │──────────────│ │
│  │ id (PK)      │──┐    │ id (PK)      │    ┌──│ id (PK)      │ │
│  │ email        │  │    │ user_id (FK) │────┘   │ name         │ │
│  │ first_name   │  │    │ org_id (FK)  │────▶   │ reg_number   │ │
│  │ last_name    │  │    │ role_id (FK) │───┐    │ type         │ │
│  │ phone_number │  │    │ joined_at    │   │    │ status       │ │
│  │ status       │  │    └──────────────┘   │    │ industry     │ │
│  │ mfa_enabled  │  │                       │    │ created_at   │ │
│  │ password_hash│  │    ┌──────────────┐   │    └──────────────┘ │
│  │ created_at   │  │    │   roles      │   │                    │
│  │ updated_at   │  │    │──────────────│   │                    │
│  └──────────────┘  │    │ id (PK)      │◀──┘                    │
│                     │    │ name         │                        │
│                     │    │ description  │                        │
│                     │    └──────┬───────┘                        │
│                     │           │                                │
│                     │    ┌──────▼───────┐                        │
│                     │    │role_permissions│                      │
│                     │    │──────────────│                        │
│                     │    │ role_id (FK) │                        │
│                     │    │ permission_id│                        │
│                     │    └──────────────┘                        │
│                     │                                            │
│                     │    ┌──────────────┐                        │
│                     │    │  consents    │                        │
│                     │    │──────────────│                        │
│                     └───▶│ id (PK)      │                        │
│                          │ user_id (FK) │                        │
│                          │ consent_type │                        │
│                          │ purpose      │                        │
│                          │ granted      │                        │
│                          │ granted_at   │                        │
│                          │ expires_at   │                        │
│                          └──────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Survey Context

```
┌─────────────────────────────────────────────────────────────────┐
│                       SURVEY SCHEMA                              │
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │     surveys      │       │    questions      │                │
│  │──────────────────│       │──────────────────│                │
│  │ id (PK)          │──┐    │ id (PK)          │                │
│  │ title            │  │    │ survey_id (FK)   │────▶           │
│  │ description      │  │    │ text             │                │
│  │ version          │  │    │ type             │                │
│  │ status           │  │    │ required         │                │
│  │ created_by (FK)  │  │    │ order_index      │                │
│  │ organization_id  │  │    │ validation_rules │                │
│  │ settings (JSONB) │  │    └────────┬─────────┘                │
│  │ distribution     │  │             │                          │
│  │ created_at       │  │    ┌────────▼─────────┐                │
│  │ updated_at       │  │    │    options        │                │
│  │ published_at     │  │    │──────────────────│                │
│  │ closed_at        │  │    │ id (PK)          │                │
│  └──────────────────┘  │    │ question_id (FK) │                │
│                         │    │ text             │                │
│  ┌──────────────────┐  │    │ value            │                │
│  │ survey_responses │  │    │ order_index      │                │
│  │──────────────────│  │    └──────────────────┘                │
│  │ id (PK)          │  │                                        │
│  │ survey_id (FK)   │◀─┘    ┌──────────────────┐                │
│  │ respondent_id    │       │     answers       │                │
│  │ status           │       │──────────────────│                │
│  │ submitted_at     │       │ id (PK)          │                │
│  │ verified_at      │       │ response_id (FK) │────▶           │
│  │ verification_id  │       │ question_id (FK) │                │
│  │ quality_score    │       │ value (JSONB)    │                │
│  │ metadata (JSONB) │       │ answered_at      │                │
│  │ gps_data (JSONB) │       │ time_spent       │                │
│  └──────────────────┘       └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Context

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFICATION SCHEMA                           │
│                                                                  │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │ verification_requests│       │  verification_steps   │        │
│  │──────────────────────│       │──────────────────────│        │
│  │ id (PK)              │──┐    │ id (PK)              │        │
│  │ survey_response_id   │  │    │ request_id (FK)      │────▶   │
│  │ requested_by (FK)    │  │    │ type                 │        │
│  │ priority             │  │    │ status               │        │
│  │ status               │  │    │ assigned_to (FK)     │        │
│  │ current_step_index   │  │    │ config (JSONB)       │        │
│  │ created_at           │  │    │ result (JSONB)       │        │
│  │ completed_at         │  │    │ started_at           │        │
│  │ deadline             │  │    │ completed_at         │        │
│  └──────────────────────┘  │    └──────────────────────┘        │
│                             │                                    │
│  ┌──────────────────────┐  │    ┌──────────────────────┐        │
│  │ verification_results │  │    │  fraud_indicators     │        │
│  │──────────────────────│  │    │──────────────────────│        │
│  │ id (PK)              │◀─┘    │ id (PK)              │        │
│  │ request_id (FK)      │       │ result_id (FK)       │────▶   │
│  │ decision             │       │ type                 │        │
│  │ confidence_score     │       │ severity             │        │
│  │ ai_analysis (JSONB)  │       │ description          │        │
│  │ human_review (JSONB) │       │ evidence (JSONB)     │        │
│  │ certificate_id       │       │ confidence           │        │
│  │ completed_at         │       │ source               │        │
│  └──────────────────────┘       └──────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Trust & Blockchain Context

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRUST SCHEMA                                │
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │   trust_scores   │       │  trust_factors    │                │
│  │──────────────────│       │──────────────────│                │
│  │ id (PK)          │──┐    │ id (PK)          │                │
│  │ entity_id        │  │    │ score_id (FK)    │────▶           │
│  │ entity_type      │  │    │ name             │                │
│  │ score            │  │    │ category         │                │
│  │ previous_score   │  │    │ weight           │                │
│  │ calculated_at    │  │    │ value            │                │
│  │ valid_until      │  │    │ confidence       │                │
│  │ version          │  │    └──────────────────┘                │
│  └──────────────────┘  │                                        │
│                         │    ┌──────────────────┐                │
│                         │    │  score_history    │                │
│                         │    │──────────────────│                │
│                         │    │ id (PK)          │                │
│                         └───▶│ entity_id        │                │
│                              │ score            │                │
│                              │ calculated_at    │                │
│                              │ factors (JSONB)  │                │
│                              └──────────────────┘                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   BLOCKCHAIN SCHEMA                       │   │
│  │                                                           │   │
│  │  ┌──────────────────┐       ┌──────────────────┐         │   │
│  │  │on_chain_verify   │       │ nft_certificates │         │   │
│  │  │──────────────────│       │──────────────────│         │   │
│  │  │ id (PK)          │       │ id (PK)          │         │   │
│  │  │ verification_id  │       │ verification_id  │         │   │
│  │  │ tx_hash          │       │ token_id         │         │   │
│  │  │ block_number     │       │ contract_address │         │   │
│  │  │ contract_address │       │ owner_address    │         │   │
│  │  │ network_id       │       │ metadata_uri     │         │   │
│  │  │ status           │       │ status           │         │   │
│  │  │ gas_used         │       │ minted_at        │         │   │
│  │  │ gas_price        │       └──────────────────┘         │   │
│  │  │ created_at       │                                    │   │
│  │  │ confirmed_at     │       ┌──────────────────┐         │   │
│  │  └──────────────────┘       │ smart_contracts   │         │   │
│  │                              │──────────────────│         │   │
│  │                              │ id (PK)          │         │   │
│  │                              │ name             │         │   │
│  │                              │ address          │         │   │
│  │                              │ network_id       │         │   │
│  │                              │ abi (TEXT)       │         │   │
│  │                              │ version          │         │   │
│  │                              │ deployed_at      │         │   │
│  │                              └──────────────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table Descriptions

### Core Tables

| Table | Description | Rows (Est. Year 1) |
|-------|-------------|---------------------|
| `users` | User accounts and profiles | 50,000 |
| `organizations` | Tenant organizations | 500 |
| `memberships` | User-org relationships | 75,000 |
| `roles` | System and custom roles | 50 |
| `consents` | GDPR/POPIA consent records | 200,000 |
| `surveys` | Survey instruments | 5,000 |
| `questions` | Survey questions | 100,000 |
| `survey_responses` | Collected responses | 5,000,000 |
| `answers` | Individual answers | 50,000,000 |
| `verification_requests` | Verification workflows | 5,000,000 |
| `verification_steps` | Step-level tracking | 25,000,000 |
| `verification_results` | Verification outcomes | 5,000,000 |
| `trust_scores` | Current trust scores | 50,000 |
| `trust_factors` | Score components | 250,000 |
| `score_history` | Historical scores | 600,000 |
| `on_chain_verifications` | Blockchain records | 5,000,000 |
| `nft_certificates` | NFT minted certificates | 5,000,000 |

---

## Indexes

### Performance Indexes

```sql
-- User context
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_consents_user_type ON user_consents(user_id, consent_type);

-- Survey context
CREATE INDEX idx_surveys_org_status ON surveys(organization_id, status);
CREATE INDEX idx_surveys_created_by ON surveys(created_by);
CREATE INDEX idx_responses_survey ON survey_responses(survey_id, status);
CREATE INDEX idx_responses_respondent ON survey_responses(respondent_id);
CREATE INDEX idx_answers_response ON answers(response_id);

-- Verification context
CREATE INDEX idx_verification_status ON verification_requests(status, priority);
CREATE INDEX idx_verification_survey_response ON verification_requests(survey_response_id);
CREATE INDEX idx_verification_steps_request ON verification_steps(request_id, status);
CREATE INDEX idx_fraud_indicators_result ON fraud_indicators(result_id);

-- Trust context
CREATE INDEX idx_trust_entity ON trust_scores(entity_id, entity_type);
CREATE INDEX idx_trust_score_value ON trust_scores(score DESC);
CREATE INDEX idx_score_history_entity ON score_history(entity_id, calculated_at DESC);

-- Blockchain context
CREATE INDEX idx_onchain_verification ON on_chain_verifications(verification_id);
CREATE INDEX idx_onchain_status ON on_chain_verifications(status, network_id);
CREATE INDEX idx_nft_owner ON nft_certificates(owner_address);
CREATE INDEX idx_nft_verification ON nft_certificates(verification_id);
```

---

## Migrations

### Migration Strategy

- **Tool**: Flyway
- **Naming**: `V{version}__{description}.sql`
- **Ordering**: Sequential, no out-of-order
- **Validation**: Enabled on startup
- **Baseline**: Enabled for existing databases

### Migration History

| Version | Description | Date |
|---------|-------------|------|
| V1 | Create user tables | 2026-01-15 |
| V2 | Create survey tables | 2026-01-15 |
| V3 | Create verification tables | 2026-01-20 |
| V4 | Create trust score tables | 2026-02-01 |
| V5 | Create blockchain tables | 2026-02-15 |
| V6 | Add GPS data fields | 2026-03-01 |
| V7 | Create analytics read models | 2026-03-15 |
| V8 | Add audit trail columns | 2026-04-01 |
| V9 | Create notification tables | 2026-04-15 |
| V10 | Performance index optimization | 2026-05-01 |

---

## Backup Strategy

### Backup Schedule

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Full | Weekly (Sunday 02:00) | 90 days | pg_dump |
| Incremental | Daily (02:00) | 30 days | WAL archiving |
| Transaction Log | Continuous | 7 days | pg_receivewal |
| Snapshot | On schema change | Permanent | Logical replication |

### Storage Tiers

| Tier | Storage | Access Time | Cost |
|------|---------|-------------|------|
| Hot | EBS gp3 | Instant | High |
| Warm | S3 Standard | Minutes | Medium |
| Cold | S3 Glacier | Hours | Low |
| Archive | S3 Glacier Deep Archive | 12 hours | Lowest |

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
