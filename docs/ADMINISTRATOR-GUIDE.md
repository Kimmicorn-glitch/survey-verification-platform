# Administrator Guide

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Configuration Reference](#configuration-reference)
- [User Management](#user-management)
- [Subscription Management](#subscription-management)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Recovery](#backup-and-recovery)
- [Security Hardening Checklist](#security-hardening-checklist)

---

## System Requirements

### Minimum Hardware

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| CPU | 4 cores | 8 cores | 16+ cores |
| RAM | 16 GB | 32 GB | 64+ GB |
| Storage | 100 GB SSD | 200 GB SSD | 500+ GB SSD |
| Network | 100 Mbps | 500 Mbps | 1 Gbps |

### Software Dependencies

| Software | Version | Purpose |
|----------|---------|---------|
| Ubuntu Server | 22.04 LTS or 24.04 LTS | Host OS |
| Docker | 24.0+ | Container runtime |
| Docker Compose | 2.20+ | Local orchestration |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching and pub/sub |
| Apache Kafka | 3.5+ | Event streaming |
| MongoDB | 7+ | Document storage |
| Elasticsearch | 8+ | Search and analytics |
| Java Runtime | 17 (LTS) | Backend services |
| Rust (for AI Engine) | 1.70+ | ML inference engine |
| Node.js | 18+ | Frontend build |
| Kubernetes | 1.28+ | Container orchestration (prod) |
| Helm | 3.12+ | Package management |
| Terraform | 1.5+ | Infrastructure as Code |

### Network Requirements

| Port | Service | Protocol |
|------|---------|----------|
| 443 | API Gateway / Frontend | HTTPS |
| 5432 | PostgreSQL | TCP |
| 6379 | Redis | TCP |
| 9092 | Kafka | TCP |
| 27017 | MongoDB | TCP |
| 9200 | Elasticsearch | HTTP |
| 9090 | AI Engine | HTTP/gRPC |
| 8080-8087 | Microservices | HTTP |
| 9093 | Alertmanager | HTTP |
| 9090 | Prometheus | HTTP |
| 3000 | Grafana | HTTP |
| 16686 | Jaeger | HTTP |

---

## Installation Steps

### 1. Provision Infrastructure

```bash
# Using Terraform
cd terraform/environments/production
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Configure Kubernetes

```bash
# Configure kubectl
aws eks update-kubeconfig --name survey-verify-prod --region af-south-1

# Verify connection
kubectl get nodes
```

### 3. Install Platform

```bash
# Create namespace
kubectl create namespace survey-verification

# Install using Helm
helm install survey-verify ./helm/survey-verify \
  --namespace survey-verification \
  --values helm/survey-verify/values-production.yaml

# Verify deployment
kubectl get pods -n survey-verification --watch
```

### 4. Run Database Migrations

```bash
# Migrations run automatically on service startup
# To run manually:
kubectl exec -n survey-verification deployment/survey-service -- \
  mvn flyway:migrate
```

### 5. Configure DNS and TLS

```bash
# Create DNS records
# A record: surveyverify.backofficepro.co.za -> ALB DNS
# A record: api.surveyverify.backofficepro.co.za -> ALB DNS

# Verify TLS
curl -v https://api.surveyverify.backofficepro.co.za/actuator/health
```

### 6. Create Initial Admin User

```http
POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@organization.com",
  "password": "SecureP@ss123!",
  "firstName": "Admin",
  "lastName": "User",
  "organizationId": "org-uuid"
}
```

### 7. Verify Installation

```bash
# Health check
curl https://api.surveyverify.backofficepro.co.za/actuator/health

# Check all services
kubectl get pods -n survey-verification

# Test authentication
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@organization.com","password":"SecureP@ss123!"}'
```

---

## Configuration Reference

### Core Configuration

| Setting | Key | Values | Default |
|---------|-----|--------|---------|
| Environment | `ENVIRONMENT` | `dev`, `staging`, `production` | `dev` |
| Log Level | `LOG_LEVEL` | `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` | `INFO` |
| Log Format | `LOG_FORMAT` | `json`, `text` | `json` |
| Request Timeout | `REQUEST_TIMEOUT_MS` | Integer | `30000` |
| Max Payload Size | `MAX_PAYLOAD_SIZE_MB` | Integer | `10` |

### Authentication Configuration

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| JWT Expiration | `JWT_EXPIRATION` | `3600` | Access token TTL (seconds) |
| JWT Refresh Expiration | `JWT_REFRESH_EXPIRATION` | `86400` | Refresh token TTL (seconds) |
| JWT Issuer | `JWT_ISSUER` | `survey-verify-auth` | Token issuer claim |
| MFA Methods | `MFA_ALLOWED_METHODS` | `TOTP,SMS,EMAIL` | Comma-separated enable methods |
| Password Min Length | `PASSWORD_MIN_LENGTH` | `12` | Minimum password characters |
| Account Lockout Attempts | `ACCOUNT_LOCKOUT_THRESHOLD` | `5` | Failed attempts before lockout |
| Account Lockout Duration | `ACCOUNT_LOCKOUT_MINUTES` | `30` | Lockout duration in minutes |

### Database Configuration

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| Connection Pool Size | `DB_POOL_MAX_SIZE` | `20` | Maximum connections |
| Connection Pool Min Idle | `DB_POOL_MIN_IDLE` | `5` | Minimum idle connections |
| Connection Timeout | `DB_CONNECTION_TIMEOUT_MS` | `30000` | Connection timeout (ms) |
| Idle Timeout | `DB_IDLE_TIMEOUT_MS` | `300000` | Idle connection timeout (ms) |
| Max Lifetime | `DB_MAX_LIFETIME_MS` | `1200000` | Maximum connection lifetime |

### Rate Limiting Configuration

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| Rate Limit Enabled | `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting |
| Default Rate | `RATE_LIMIT_DEFAULT` | `60/min` | Default requests per minute |
| Burst Limit | `RATE_LIMIT_BURST` | `10` | Burst requests allowed |

### Caching Configuration

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| Cache Enabled | `CACHE_ENABLED` | `true` | Enable Redis caching |
| Default TTL | `CACHE_DEFAULT_TTL` | `300` | Cache TTL (seconds) |
| Max Entries | `CACHE_MAX_ENTRIES` | `10000` | Maximum cache entries |

### Monitoring Configuration

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| Metrics Enabled | `METRICS_ENABLED` | `true` | Enable Prometheus metrics |
| Tracing Enabled | `TRACING_ENABLED` | `true` | Enable distributed tracing |
| Tracing Sample Rate | `TRACING_SAMPLE_RATE` | `0.1` | Trace sampling probability |

---

## User Management

### User Roles

| Role | Description | Typical Assignment |
|------|-------------|-------------------|
| `super_admin` | Full system access, all organizations | BackOffice Pro staff |
| `org_admin` | Organization-wide administration | Client administrators |
| `survey_creator` | Create and manage surveys | Survey designers |
| `verifier` | Verify survey responses | Verification team |
| `reviewer` | Review flagged responses | Senior verifiers |
| `respondent` | Answer surveys | End users |
| `viewer` | Read-only access to dashboards | Stakeholders |
| `api_user` | Programmatic API access | Integration developers |

### Managing Users

#### Add User
```bash
POST /api/v1/admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "survey_creator",
  "organizationId": "org-uuid"
}
```

#### Assign Role
```bash
PUT /api/v1/admin/users/{userId}/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "roles": ["survey_creator", "verifier"]
}
```

#### Deactivate User
```bash
POST /api/v1/admin/users/{userId}/deactivate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Employee departed"
}
```

### Audit Logging

All user management actions are logged. View audit trail:

```bash
GET /api/v1/admin/audit-log?action=USER_ROLE_CHANGE&from=2026-01-01
Authorization: Bearer {admin_token}
```

---

## Subscription Management

### Subscription Tiers

| Tier | Surveys/mo | Verifications/mo | API Rate Limit | Support |
|------|------------|------------------|----------------|---------|
| **Free** | 10 | 100 | 60/min | Community |
| **Basic** | 100 | 1,000 | 300/min | Email |
| **Professional** | 1,000 | 10,000 | 1,000/min | Priority email |
| **Enterprise** | Unlimited | Unlimited | 10,000/min | 24/7 dedicated |

### Manage Subscriptions

#### View Current Plan
```bash
GET /api/v1/admin/subscription
Authorization: Bearer {admin_token}
```

#### Change Plan
```bash
PUT /api/v1/admin/subscription/change
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "plan": "Professional",
  "billingPeriod": "MONTHLY"
}
```

#### View Usage
```bash
GET /api/v1/admin/subscription/usage?period=current
Authorization: Bearer {admin_token}
```

#### Generate Invoice
```bash
POST /api/v1/admin/subscription/invoice
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "period": "2026-07"
}
```

### Billing Configuration

Configure billing via Stripe dashboard:
1. Log in to Stripe account
2. Configure webhook endpoint: `https://api.surveyverify.backofficepro.co.za/api/v1/webhooks/stripe`
3. Set webhook signing secret in environment variables
4. Test webhook with Stripe CLI: `stripe trigger invoice.payment_succeeded`

---

## Monitoring and Alerting

### Key Metrics

| Category | Metric | Warning | Critical |
|----------|--------|---------|----------|
| **System** | CPU Usage | > 70% | > 90% |
| | Memory Usage | > 75% | > 90% |
| | Disk Usage | > 80% | > 90% |
| | Pod Restarts | > 3/hr | > 10/hr |
| **API** | Error Rate | > 1% | > 5% |
| | P95 Latency | > 500ms | > 2s |
| | Request Rate | - | - |
| **Database** | Connection Pool Usage | > 70% | > 90% |
| | Replication Lag | > 10s | > 60s |
| | Slow Queries | > 5/min | > 20/min |
| **Kafka** | Consumer Lag | > 1000 | > 10000 |
| | Under Replicated Partitions | > 0 | > 5 |
| **Blockchain** | Failed Transactions | > 1% | > 5% |
| | Gas Price Spikes | > 200 gwei | > 500 gwei |

### Grafana Dashboards

Pre-configured dashboards are available:

| Dashboard | Description | Grafana ID |
|-----------|-------------|------------|
| Platform Overview | High-level system health | 1860 |
| Kubernetes Cluster | Cluster resource utilization | 315 |
| PostgreSQL | Database performance | 9628 |
| Redis | Cache hit rates and memory | 763 |
| Kafka | Message throughput and lag | 7589 |
| JVM Metrics | Service-level JVM metrics | 4701 |
| Business KPIs | Survey/verification/NFT metrics | Custom |

### Alert Channels

Configured in Alertmanager:

| Channel | Type | Use Case |
|---------|------|----------|
| PagerDuty | Incident management | P1/P2 critical alerts |
| Email | Notification | P3/P4 alerts |
| Slack | Team notification | All alerts, status updates |
| SMS | Emergency | P1 alerts only |

### Alert Routing

```yaml
# alertmanager.yml
route:
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: pagerduty-critical
      repeat_interval: 5m
    - match:
        severity: warning
      receiver: slack-warning
      repeat_interval: 30m
```

---

## Backup and Recovery

### Backup Schedule

| Data | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| PostgreSQL | Daily (02:00) | 30 days | `pg_dump` + S3 |
| PostgreSQL Full | Weekly (Sun 02:00) | 90 days | `pg_dump` + Glacier |
| Redis | Every 6 hours | 7 days | `redis-cli SAVE` + S3 |
| Kafka Topics | Daily | 30 days | `kafka-dump-log` + S3 |
| MongoDB | Daily | 30 days | `mongodump` + S3 |
| Application Config | On change | Unlimited | Git |

### Performing Backups

#### Database Backup
```bash
# Full backup
pg_dump -h localhost -U survey_app -d survey_verify -F c -Z 9 \
  -f /backups/survey_verify_$(date +%Y%m%d).dump

# Upload to S3
aws s3 cp /backups/survey_verify_$(date +%Y%m%d).dump \
  s3://survey-verification-backups/daily/
```

#### Kubernetes Backup
```bash
# Backup etcd (Kubernetes state)
ETCDCTL_API=3 etcdctl snapshot save /backups/etcd-snapshot.db

# Backup persistent volumes
velero backup create survey-verify-backup --include-namespaces survey-verification
```

### Recovery Procedures

#### Database Restore
```bash
# Restore from dump
pg_restore -h localhost -U survey_app -d survey_verify -c \
  /backups/survey_verify_20260716.dump

# Point-in-time recovery (requires WAL archiving)
pg_basebackup -h localhost -U replicator -D /restore/data -Fp -Xs -P -R
```

#### Full Platform Recovery
1. Restore infrastructure via Terraform
2. Restore database from latest backup
3. Deploy services via Helm
4. Restore Redis from snapshot
5. Verify data integrity
6. Run health checks

### Disaster Recovery Objectives

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | 1 hour |
| RTO (Recovery Time Objective) | 4 hours |
| MTTR (Mean Time To Recovery) | 2 hours |
| Availability Target | 99.95% |

---

## Security Hardening Checklist

### Network Security
- [ ] Web Application Firewall (WAF) enabled
- [ ] DDoS protection configured (AWS Shield)
- [ ] VPC with private/public subnet isolation
- [ ] Network policies enforced in Kubernetes
- [ ] All external ports limited to necessary services
- [ ] API Gateway rate limiting enabled
- [ ] IP allow-listing for admin endpoints

### Authentication & Authorization
- [ ] MFA enforced for all admin accounts
- [ ] Password policy configured (min 12 chars, complexity)
- [ ] Session timeout configured (max 8 hours)
- [ ] API keys rotated every 90 days
- [ ] OAuth 2.0 / SAML SSO configured for enterprise
- [ ] JWT signing key rotated every 90 days
- [ ] Failed login lockout configured (5 attempts, 30 min)

### Data Security
- [ ] AES-256 encryption at rest enabled
- [ ] TLS 1.3 enforced for all communications
- [ ] mTLS configured for service-to-service
- [ ] Field-level encryption for PII
- [ ] Database backups encrypted
- [ ] Key rotation schedule configured
- [ ] Data retention policies applied

### Application Security
- [ ] Input validation on all endpoints
- [ ] Parameterized queries for all database access
- [ ] Output encoding to prevent XSS
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting applied per API key

### Infrastructure Security
- [ ] Container images scanned (Trivy) in CI/CD
- [ ] Runtime security monitoring (Falco)
- [ ] Secrets managed via AWS Secrets Manager
- [ ] No secrets in code or environment variables
- [ ] Regular security patching schedule
- [ ] Immutable infrastructure (no manual changes)
- [ ] Pod security policies enforced

### Monitoring & Incident Response
- [ ] Audit logging enabled (7-year retention)
- [ ] Security event alerting configured
- [ ] Incident response plan documented
- [ ] On-call rotation established
- [ ] Post-mortem process defined
- [ ] Penetration testing scheduled (quarterly)

### Compliance
- [ ] POPIA compliance measures implemented
- [ ] GDPR compliance measures implemented
- [ ] Consent management configured
- [ ] Data subject access request (DSAR) process defined
- [ ] Data Processing Agreement (DPA) signed
- [ ] Privacy policy published
- [ ] Cookie consent implemented

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
