# Deployment Guide

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring Setup](#monitoring-setup)
- [Backup Procedures](#backup-procedures)
- [Disaster Recovery](#disaster-recovery)

---

## Prerequisites

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 8 cores | 16+ cores |
| RAM | 32 GB | 64+ GB |
| Storage | 200 GB SSD | 500+ GB SSD |
| Network | 100 Mbps | 1 Gbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### Software Requirements

- Docker 24.0+
- Docker Compose 2.20+
- Kubernetes 1.28+
- Helm 3.12+
- kubectl configured for target cluster
- Terraform 1.5+ (for infrastructure provisioning)
- AWS CLI v2 (for AWS deployments)

---

## Docker Deployment

### Quick Start (Development)

```bash
# Clone repository
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Default development configuration |
| `docker-compose.infra.yml` | Infrastructure services only |
| `docker-compose.prod.yml` | Production configuration |
| `docker-compose.test.yml` | Testing environment |

### Production Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Docker Security

- All images run as non-root users
- Read-only filesystem where possible
- No secrets in environment variables (use Docker secrets)
- Regular image scanning with Trivy
- Signed images with Docker Content Trust

---

## Kubernetes Deployment

### Cluster Setup

```bash
# Create EKS cluster (if using AWS)
eksctl create cluster \
  --name survey-verification-prod \
  --region af-south-1 \
  --version 1.28 \
  --nodegroup-name standard-workers \
  --node-type m5.2xlarge \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5

# Configure kubectl
aws eks update-kubeconfig --name survey-verification-prod --region af-south-1
```

### Helm Chart Installation

```bash
# Add Helm repository
helm repo add survey-verify https://charts.backofficepro.co.za
helm repo update

# Install platform
helm install survey-verify ./helm/survey-verify \
  --namespace survey-verification \
  --create-namespace \
  --values helm/survey-verify/values-production.yaml

# Upgrade deployment
helm upgrade survey-verify ./helm/survey-verify \
  --namespace survey-verification \
  --values helm/survey-verify/values-production.yaml
```

### Namespace Structure

```
survey-verification/
├── ingress-system        (NGINX Ingress, Cert Manager)
├── platform-services     (Java microservices)
├── ai-engine             (Rust AI engine)
├── data-layer            (PostgreSQL, Redis, Kafka, MongoDB, Elasticsearch)
├── monitoring            (Prometheus, Grafana, Jaeger, ELK)
└── secrets               (External Secrets Operator)
```

### Resource Limits

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| API Gateway | 500m | 1000m | 512Mi | 1Gi |
| Survey Service | 500m | 2000m | 1Gi | 2Gi |
| Verification Service | 500m | 2000m | 1Gi | 2Gi |
| User Service | 500m | 1000m | 512Mi | 1Gi |
| Trust Service | 500m | 2000m | 1Gi | 2Gi |
| Blockchain Service | 500m | 1000m | 512Mi | 1Gi |
| Analytics Service | 500m | 2000m | 1Gi | 2Gi |
| AI Engine (CPU) | 1000m | 4000m | 2Gi | 4Gi |
| AI Engine (GPU) | 1000m | 4000m | 4Gi | 8Gi |

---

## Environment Configuration

### Environment Variables

```bash
# Database
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=survey_verify
DATABASE_USERNAME=app_user
DATABASE_PASSWORD=<encrypted>
DATABASE_SSL_MODE=require

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<encrypted>
REDIS_SSL=true

# Kafka
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL
KAFKA_SASL_MECHANISM=AWS_MSK_IAM

# Authentication
JWT_SECRET=<encrypted>
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=86400
MFA_ISSUER=SurveyVerify

# AI Engine
AI_ENGINE_URL=http://ai-engine-svc:9090
AI_ENGINE_TIMEOUT=30000

# Blockchain
BLOCKCHAIN_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/<key>
BLOCKCHAIN_NETWORK=polygon
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
CONTRACT_PRIVATE_KEY=<encrypted>

# Storage
S3_BUCKET=survey-verification-docs
S3_REGION=af-south-1
S3_ACCESS_KEY=<encrypted>
S3_SECRET_KEY=<encrypted>

# Monitoring
PROMETHEUS_ENABLED=true
JAEGER_ENDPOINT=http://jaeger-collector:14268
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### ConfigMaps and Secrets (Kubernetes)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: survey-verify-config
  namespace: survey-verification
data:
  DATABASE_HOST: "your-db-host"
  DATABASE_PORT: "5432"
  REDIS_HOST: "your-redis-host"
  LOG_LEVEL: "INFO"
---
apiVersion: v1
kind: Secret
metadata:
  name: survey-verify-secrets
  namespace: survey-verification
type: Opaque
data:
  DATABASE_PASSWORD: <base64-encoded>
  JWT_SECRET: <base64-encoded>
  S3_SECRET_KEY: <base64-encoded>
```

---

## Database Setup

### PostgreSQL Configuration

```sql
-- Create databases for each bounded context
CREATE DATABASE survey_db;
CREATE DATABASE verification_db;
CREATE DATABASE user_db;
CREATE DATABASE trust_db;
CREATE DATABASE blockchain_db;
CREATE DATABASE analytics_db;

-- Create application user
CREATE USER survey_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE survey_db TO survey_app;
GRANT ALL PRIVILEGES ON DATABASE verification_db TO survey_app;
GRANT ALL PRIVILEGES ON DATABASE user_db TO survey_app;
GRANT ALL PRIVILEGES ON DATABASE trust_db TO survey_app;
GRANT ALL PRIVILEGES ON DATABASE blockchain_db TO survey_app;
GRANT ALL PRIVILEGES ON DATABASE analytics_db TO survey_app;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Run Migrations

```bash
# Java backend migrations (Flyway)
cd backend/java
mvn flyway:migrate

# Or via Docker
docker run --rm \
  -v $(pwd)/backend/java/src/main/resources/db/migration:/flyway/sql \
  flyway/flyway \
  -url=jdbc:postgresql://localhost:5432/survey_verify \
  -user=survey_app \
  -password=<password> \
  migrate
```

### Connection Pool Configuration

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1200000
      connection-timeout: 30000
      leak-detection-threshold: 60000
```

---

## SSL/TLS Setup

### Certificate Manager (Kubernetes)

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: security@backofficepro.co.za
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: survey-verify-tls
  namespace: survey-verification
spec:
  secretName: survey-verify-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - surveyverify.backofficepro.co.za
    - api.surveyverify.backofficepro.co.za
    - "*.surveyverify.backofficepro.co.za"
```

### TLS Configuration (NGINX Ingress)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: survey-verify-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
spec:
  tls:
  - hosts:
    - surveyverify.backofficepro.co.za
    - api.surveyverify.backofficepro.co.za
    secretName: survey-verify-tls-secret
```

---

## Monitoring Setup

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'survey-verify-services'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - survey-verification
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### Grafana Dashboards

Import pre-built dashboards:
- **Platform Overview**: Dashboard ID 1860
- **Kubernetes Cluster**: Dashboard ID 315
- **PostgreSQL**: Dashboard ID 9628
- **Redis**: Dashboard ID 763
- **Kafka**: Dashboard ID 7589

### Alert Rules

```yaml
groups:
- name: survey-verify-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }}% for {{ $labels.service }}"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
      description: "P95 latency is {{ $value }}s for {{ $labels.service }}"

  - alert: DatabaseConnectionPoolExhausted
    expr: hikaricp_connections_active / hikaricp_connections_max > 0.9
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Connection pool nearly exhausted"
```

---

## Backup Procedures

### Database Backups

```bash
# Daily automated backup (cron)
0 2 * * * /usr/local/bin/pg_dump -h localhost -U survey_app -d survey_verify -F c -f /backups/survey_verify_$(date +\%Y\%m\%d).dump

# Weekly full backup with compression
0 3 * * 0 /usr/local/bin/pg_dump -h localhost -U survey_app -d survey_verify -F c -Z 9 -f /backups/survey_verify_full_$(date +\%Y\%m\%d).dump

# Backup to S3
aws s3 sync /backups/ s3://survey-verification-backups/$(date +\%Y\%m\%d)/ --storage-class GLACIER
```

### Backup Schedule

| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| PostgreSQL | Daily | 30 days | S3 + Glacier |
| PostgreSQL Full | Weekly | 90 days | S3 + Glacier |
| Redis | Every 6 hours | 7 days | S3 |
| Kafka Topics | Daily | 30 days | S3 |
| MongoDB | Daily | 30 days | S3 + Glacier |
| Config Files | On change | Unlimited | Git |

### Restore Procedures

```bash
# Restore PostgreSQL from backup
pg_restore -h localhost -U survey_app -d survey_verify -c /backups/survey_verify_20260716.dump

# Restore to specific point in time (requires WAL archiving)
pg_basebackup -h localhost -U replicator -D /restore/data -Fp -Xs -P -R
```

---

## Disaster Recovery

### Recovery Objectives

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | 1 hour |
| RTO (Recovery Time Objective) | 4 hours |
| MTTR (Mean Time To Recovery) | 2 hours |
| Availability Target | 99.95% |

### Disaster Recovery Procedure

1. **Detection** - Monitoring alerts trigger notification
2. **Assessment** - Evaluate scope and impact of failure
3. **Communication** - Notify stakeholders and affected users
4. **Recovery** - Execute recovery procedures:
   - Failover to secondary region
   - Restore database from latest backup
   - Rebuild affected services
   - Verify data integrity
5. **Validation** - Run health checks and smoke tests
6. **Post-Incident** - Conduct root cause analysis and update procedures

### Multi-Region Strategy

```
Primary Region: af-south-1 (Cape Town)
Secondary Region: eu-west-1 (Ireland)

┌─────────────────┐         ┌─────────────────┐
│   af-south-1    │  ──▶    │   eu-west-1     │
│   (Primary)     │  Async  │   (Secondary)   │
│                 │  Repl.  │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ PostgreSQL │──┼─────────┼─▶│ PostgreSQL │  │
│  │ (Primary)  │  │         │  │ (Standby)  │  │
│  └───────────┘  │         │  └───────────┘  │
└─────────────────┘         └─────────────────┘
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
