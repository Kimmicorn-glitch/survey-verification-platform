# Operator Guide

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [Docker Compose Deployment](#docker-compose-deployment)
- [Kubernetes Deployment (Helm)](#kubernetes-deployment-helm)
- [Terraform Infrastructure](#terraform-infrastructure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Log Aggregation](#log-aggregation)
- [Metrics Collection](#metrics-collection)
- [Incident Response](#incident-response)

---

## Docker Compose Deployment

### Quick Start (Development)

```bash
# Clone and start
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform
docker-compose up -d

# Verify all services
docker-compose ps

# View logs
docker-compose logs -f --tail=100
```

### Compose File Structure

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Default development configuration |
| `docker-compose.infra.yml` | Infrastructure services only |
| `docker-compose.prod.yml` | Production-optimized configuration |
| `docker-compose.test.yml` | Testing environment |

### Service Dependencies

```
Frontend (port 3000)
  └── API Gateway (port 8080)
       ├── Survey Service (port 8082) ─── PostgreSQL (port 5432)
       ├── Verification Service (port 8083) ─── PostgreSQL
       ├── User Service (port 8084) ─── PostgreSQL
       ├── Trust Service (port 8085) ─── PostgreSQL + Redis (port 6379)
       ├── Blockchain Service (port 8086) ─── PostgreSQL
       ├── Analytics Service (port 8087) ─── PostgreSQL + Elasticsearch (port 9200)
       └── AI Engine (port 9090)
            └── Redis (port 6379)

Infrastructure:
  - PostgreSQL, Redis, Kafka (port 9092), MongoDB (port 27017), Elasticsearch
```

### Production Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale survey-service=3
docker-compose -f docker-compose.prod.yml up -d --scale ai-engine=2
```

### Health Checks

```bash
# All services
docker-compose ps

# Specific service health
curl http://localhost:8080/actuator/health
curl http://localhost:9090/health
```

---

## Kubernetes Deployment (Helm)

### Helm Chart Structure

```
helm/survey-verify/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
├── charts/
├── templates/
│   ├── _helpers.tpl
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── serviceaccount.yaml
│   ├── services/
│   │   ├── gateway.yaml
│   │   ├── survey-service.yaml
│   │   ├── verification-service.yaml
│   │   ├── user-service.yaml
│   │   ├── trust-service.yaml
│   │   ├── blockchain-service.yaml
│   │   ├── analytics-service.yaml
│   │   └── ai-engine.yaml
│   ├── ingress.yaml
│   └── network-policy.yaml
```

### Installation

```bash
# Add Helm repository
helm repo add survey-verify https://charts.backofficepro.co.za
helm repo update

# Install with production values
helm install survey-verify ./helm/survey-verify \
  --namespace survey-verification \
  --create-namespace \
  --values helm/survey-verify/values-production.yaml \
  --set global.environment=production

# Verify installation
helm list -n survey-verification
kubectl get all -n survey-verification
```

### Upgrade

```bash
# Standard upgrade
helm upgrade survey-verify ./helm/survey-verify \
  --namespace survey-verification \
  --values helm/survey-verify/values-production.yaml

# Rollback if issues
helm rollback survey-verify 1 -n survey-verification
```

### Scaling

```bash
# Manual scale
kubectl scale deployment survey-service --replicas=5 -n survey-verification

# Configure HPA
kubectl apply -f helm/survey-verify/templates/hpa.yaml

# Verify HPA
kubectl get hpa -n survey-verification
```

### Namespace Layout

```
survey-verification/
├── ingress-system/      (NGINX Ingress, Cert Manager)
├── platform-services/   (Java microservices)
├── ai-engine/           (Rust AI engine)
├── data-layer/          (PostgreSQL, Redis, Kafka, MongoDB, Elasticsearch)
├── monitoring/          (Prometheus, Grafana, Jaeger, ELK)
└── secrets/             (External Secrets Operator)
```

### Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: survey-service-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: survey-service
```

---

## Terraform Infrastructure

### Directory Structure

```
terraform/
├── environments/
│   ├── development/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── ...
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/
│   ├── networking/
│   │   ├── vpc.tf
│   │   ├── subnets.tf
│   │   ├── nat.tf
│   │   └── security-groups.tf
│   ├── eks/
│   │   ├── cluster.tf
│   │   ├── node-groups.tf
│   │   └── iam.tf
│   ├── database/
│   │   ├── rds.tf
│   │   ├── elasticache.tf
│   │   └── msk.tf
│   └── monitoring/
│       ├── prometheus.tf
│       └── grafana.tf
└── global/
    ├── iam.tf
    └── s3.tf
```

### Provision Infrastructure

```bash
# Navigate to environment
cd terraform/environments/production

# Initialize
terraform init -backend-config=backend.hcl

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Destroy (if needed)
terraform destroy
```

### Infrastructure Components

| Module | Resources | Purpose |
|--------|-----------|---------|
| `networking` | VPC, subnets, NAT, security groups | Network isolation |
| `eks` | EKS cluster, node groups, IAM | Container orchestration |
| `database` | RDS, ElastiCache, MSK | Data layer |
| `monitoring` | Prometheus, Grafana | Observability |
| `global` | IAM roles, S3 buckets | Account-wide resources |

### Remote State

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "survey-verify-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "af-south-1"
    dynamodb_table = "survey-verify-terraform-locks"
    encrypt        = true
  }
}
```

---

## CI/CD Pipeline

### Pipeline Overview

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   Code   │──▶│  Build   │──▶│   Test   │──▶│ Security │──▶│  Deploy  │
│   Push   │   │  & Lint  │   │          │   │   Scan   │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └────┬─────┘
                                                                  │
                                                    ┌─────────────┴──────┐
                                                    │  Environment       │
                                                    │  Promotion         │
                                                    │  Dev → Staging →   │
                                                    │  Prod              │
                                                    └────────────────────┘
```

### GitHub Actions Workflows

```yaml
# .github/workflows/ci.yml
name: Build and Deploy
on:
  push:
    branches: [main, develop, 'release/*']
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Java Services
        run: |
          cd backend/java
          mvn clean package -DskipTests
      - name: Build AI Engine
        run: |
          cd engine/rust
          cargo build --release
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      - name: Build Docker Images
        run: |
          docker build -t survey-service:latest -f Dockerfile.survey .
          docker build -t ai-engine:latest -f Dockerfile.ai .

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: |
          cd backend/java
          mvn test
          cd ../../engine/rust
          cargo test
      - name: Run Integration Tests
        run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
      - name: Upload Coverage
        run: bash <(curl -s https://codecov.io/bash)

  security:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: SAST Scan
        run: |
          cd backend/java
          mvn sonar:sonar
      - name: Container Scan
        run: trivy image survey-service:latest --severity CRITICAL,HIGH
      - name: Dependency Scan
        run: snyk test --all-projects

  deploy:
    needs: security
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          helm upgrade survey-verify ./helm/survey-verify \
            --namespace survey-verification \
            --values helm/survey-verify/values-production.yaml \
            --set image.tag=${{ github.sha }}
```

### Quality Gates

| Gate | Requirement | Blocking |
|------|-------------|----------|
| Code Coverage | >= 80% | Yes |
| SAST Findings | No critical/high | Yes |
| SCA Vulnerabilities | No critical | Yes |
| Test Pass Rate | 100% | Yes |
| Lint Score | >= 9.0 | Yes |
| Container Scan | Zero critical | Yes |

### Deployment Strategies

| Environment | Strategy | Description |
|-------------|----------|-------------|
| Development | Rolling update | Immediate deployment |
| Staging | Blue-green | Traffic switch on success |
| Production | Blue-green + canary | Gradual traffic shift |

---

## Log Aggregation

### ELK Stack Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Application  │────▶│  Filebeat /  │────▶│ Elasticsearch│
│ (JSON logs)  │     │  Logstash    │     │ (Storage)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                             ┌────▼──────┐
                                             │  Kibana   │
                                             │ (Visualize)│
                                             └───────────┘
```

### Log Format (JSON)

```json
{
  "timestamp": "2026-07-17T12:00:00.000Z",
  "level": "INFO",
  "service": "survey-service",
  "pod": "survey-service-7d8f9c-xyz",
  "traceId": "abc-123-def-456",
  "spanId": "789-xyz",
  "message": "Survey created successfully",
  "metadata": {
    "surveyId": "survey-uuid-456",
    "createdBy": "user-uuid-123",
    "organizationId": "org-uuid-789"
  }
}
```

### Log Retention

| Index Pattern | Retention | Shards |
|---------------|-----------|--------|
| `survey-verify-*` | 30 days | 3 |
| `audit-logs-*` | 7 years | 5 |
| `security-logs-*` | 2 years | 3 |
| `access-logs-*` | 90 days | 2 |

### Kibana Queries

```bash
# Find errors in the last hour
@level:ERROR AND @timestamp:[now-1h TO now]

# Trace specific request
traceId:"abc-123-def-456"

# Service-specific errors
service:"verification-service" AND @level:ERROR

# Slow requests
service:"survey-service" AND response_time_ms:>2000
```

---

## Metrics Collection

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

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

### Key Metrics

#### Application Metrics (Micrometer)
```
# HTTP metrics
http_server_requests_seconds_count{status="200"}
http_server_requests_seconds_sum
http_server_requests_seconds_max

# JVM metrics
jvm_memory_used_bytes{area="heap"}
jvm_gc_pause_seconds
jvm_threads_live_threads

# Database metrics
hikaricp_connections_active
hikaricp_connections_idle
hikaricp_connections_pending

# Kafka metrics
kafka_consumer_records_lag
kafka_producer_record_send_rate

# Cache metrics
cache_hits_total
cache_misses_total
cache_puts_total
```

#### AI Engine Metrics
```
# Processing metrics
ai_engine_requests_total
ai_engine_processing_duration_seconds
ai_engine_fraud_detection_rate

# Model metrics
ai_model_inference_latency_seconds
ai_model_prediction_confidence
ai_model_drift_score
```

#### Blockchain Metrics
```
# Transaction metrics
blockchain_transactions_total
blockchain_transaction_latency_seconds
blockchain_gas_price_gwei

# Smart contract metrics
blockchain_contract_calls_total
blockchain_contract_events_total
```

### Grafana Alert Rules

```yaml
groups:
  - name: survey-verify-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "High error rate on {{ $labels.service }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
        for: 5m
        labels: { severity: warning }

      - alert: DatabaseConnectionExhaustion
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.9
        for: 5m
        labels: { severity: critical }

      - alert: ConsumerLagHigh
        expr: kafka_consumer_records_lag > 10000
        for: 5m
        labels: { severity: warning }

      - alert: PodRestarting
        expr: rate(kube_pod_container_status_restarts_total[1h]) > 3
        for: 10m
        labels: { severity: critical }
```

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 - Critical | Complete system outage, data breach | 15 min | CTO |
| P2 - High | Service degradation, major feature down | 1 hour | Team Lead |
| P3 - Medium | Partial functionality impact | 4 hours | Engineering Manager |
| P4 - Low | Minor issues, cosmetic | 24 hours | Team |

### Response Workflow

#### 1. Detection & Triage (0-15 min)
- Automated alert triggers
- On-call engineer acknowledges
- Initial severity assessment
- Incident channel created in Slack

#### 2. Containment (15-60 min)
- Isolate affected systems
- Implement temporary mitigations
- Scale up resources if needed
- Preserve forensic evidence

#### 3. Diagnosis & Resolution (1-4 hours)
- Root cause identification
- Hotfix or configuration change
- Test fix in staging
- Deploy to production

#### 4. Recovery (4-8 hours)
- Restore full functionality
- Verify all services healthy
- Monitor for recurrence
- Communicate resolution

#### 5. Post-Incident (1-7 days)
- Conduct post-mortem
- Document in INCIDENT-MANUAL.md
- Implement preventive measures
- Update runbooks

### On-Call Rotation

```yaml
# PagerDuty schedule
Schedule: Primary/Secondary rotation
Shift: 7 days (Mon-Mon)
Primary: First responder
Secondary: Backup for support
```

### Communication Templates

**Incident Notification:**
```
[SEVERITY: P1] Incident INC-12345 - Database Performance Degradation
Status: Investigating
Affected Services: Survey Service, Verification Service
Impact: Users experiencing 5s+ response times
Current Status: Database team investigating slow queries
Next Update: 5 minutes
```

**Status Page Update:**
```
We are investigating a performance issue affecting survey submission and verification.
Users may experience slower than normal response times.
We will provide updates every 15 minutes.
We apologize for the inconvenience.
```

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
