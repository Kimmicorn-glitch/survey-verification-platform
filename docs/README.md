# Survey Verification Platform

**By BackOffice Pro (Pty) Ltd**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/backofficepro/survey-verification-platform)
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](../legal/software-license.md)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Security](https://img.shields.io/badge/security-enterprise-green.svg)](SECURITY.md)
[![Compliance](https://img.shields.io/badge/compliance-POPIA%20%26%20GDPR-orange.svg)](#)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](#)

> *"Verifying truth through technology, building trust through transparency."*

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

The **Survey Verification Platform** is an enterprise-grade, AI-powered system designed to verify the authenticity and integrity of survey data across multiple industries. Built by **BackOffice Pro (Pty) Ltd**, a South African technology company, the platform leverages cutting-edge artificial intelligence, blockchain technology, and robust backend services to combat survey fraud, ensure data integrity, and establish verifiable trust chains.

### Key Features

- **AI-Powered Fraud Detection**: Rust-based engine with machine learning algorithms for real-time fraud identification
- **Blockchain Verification Registry**: Immutable record of survey verifications on Ethereum-compatible blockchain
- **NFT Verification Certificates**: Unique, non-fungible tokens representing verified survey results
- **Trust Score System**: Dynamic, algorithmically computed trust scores for survey participants
- **GPS & Geolocation Verification**: Multi-layered location verification for field surveys
- **Multi-Tenant Architecture**: Support for multiple organizations with data isolation
- **Real-Time Dashboard**: Live monitoring and analytics for survey verification status
- **POPIA & GDPR Compliant**: Full compliance with South African and European data protection regulations

### Industries Served

- Market Research & Consumer Insights
- Real Estate & Property Valuation
- Insurance Claims Assessment
- Government & Public Sector Surveys
- Academic & Scientific Research
- Healthcare & Epidemiological Studies
- Financial Services & Risk Assessment

---

## Tech Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Core Backend | Java 17 / Spring Boot 3.x | REST API, business logic, DDD implementation |
| AI Engine | Rust | High-performance fraud detection and trust scoring |
| API Gateway | Spring Cloud Gateway | Request routing, rate limiting, authentication |
| Message Broker | Apache Kafka | Event-driven communication, CQRS event store |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web Application | React 18 + TypeScript | Primary web interface |
| Mobile App | React Native | Cross-platform mobile application |
| UI Components | Tailwind CSS + shadcn/ui | Consistent, accessible design system |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container Runtime | Docker | Application containerization |
| Orchestration | Kubernetes (EKS) | Container orchestration and scaling |
| CI/CD | GitHub Actions | Automated build, test, and deployment |
| Infrastructure as Code | Terraform | Cloud infrastructure provisioning |
| Service Mesh | Istio | Service-to-service communication |

### Data & Storage

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Database | PostgreSQL 15 | Relational data storage |
| Cache Layer | Redis 7 | Session management, caching |
| Document Store | MongoDB 7 | Survey documents, flexible schemas |
| Object Storage | MinIO / AWS S3 | File and document storage |
| Search Engine | Elasticsearch 8 | Full-text search, analytics |

### Blockchain

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Smart Contracts | Solidity 0.8.x | Verification registry, NFTs |
| Blockchain Network | Ethereum (L2 - Polygon) | Immutable verification records |
| Web3 Library | ethers.js | Blockchain interaction |
| Oracle | Chainlink | External data feeds, trust scores |

### Monitoring & Observability

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Metrics | Prometheus + Grafana | System metrics and dashboards |
| Logging | ELK Stack | Centralized log management |
| Tracing | Jaeger | Distributed request tracing |
| Alerting | PagerDuty | Incident management and alerting |

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Java Development Kit (JDK)** 17 or later
- **Rust** 1.70 or later (with cargo)
- **Node.js** 18 LTS or later
- **Docker** 24.0 or later
- **Docker Compose** 2.20 or later
- **Kubernetes** 1.28+ (kubectl)
- **Helm** 3.12+
- **PostgreSQL** 15+
- **Redis** 7+
- **Maven** 3.9+
- **Git** 2.40+

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform
```

### 2. Start Infrastructure Services

```bash
docker-compose -f docker-compose.infra.yml up -d
```

This starts PostgreSQL, Redis, MongoDB, Elasticsearch, and Kafka.

### 3. Build and Start the Backend

```bash
cd backend/java
mvn clean install
mvn spring-boot:run
```

### 4. Build and Start the AI Engine

```bash
cd engine/rust
cargo build --release
cargo run --release
```

### 5. Build and Start the Frontend

```bash
cd frontend/web
npm install
npm run dev
```

### 6. Access the Platform

- **Web Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **AI Engine**: http://localhost:9090
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Grafana Dashboard**: http://localhost:3001

---

## Development Setup

### IDE Configuration

**IntelliJ IDEA** (recommended for Java):
- Import settings from `config/idea/`
- Enable Lombok plugin
- Configure code style from `config/code-style/java.xml`

**VS Code** (recommended for TypeScript/Rust):
- Install recommended extensions from `.vscode/extensions.json`
- Use workspace settings from `.vscode/settings.json`

### Environment Variables

Copy the environment template and configure:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `jdbc:postgresql://localhost:5432/survey_verify` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `JWT_SECRET` | JWT signing secret | (generate a secure secret) |
| `AI_ENGINE_URL` | AI Engine service URL | `http://localhost:9090` |
| `BLOCKCHAIN_RPC_URL` | Ethereum RPC endpoint | `https://polygon-rpc.com` |
| `S3_BUCKET` | Object storage bucket | `survey-verification-docs` |
| `LOG_LEVEL` | Application log level | `INFO` |

### Running Tests

```bash
# Unit tests (Java)
cd backend/java && mvn test

# Unit tests (Rust)
cd engine/rust && cargo test

# Integration tests
cd tests/integration && mvn verify

# E2E tests
cd tests/e2e && npm test

# All tests
./scripts/run-all-tests.sh
```

---

## Architecture Overview

The platform follows a **Domain-Driven Design (DDD)** approach with **CQRS** and **Event Sourcing** patterns. For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │  Third-Party │              │
│  │  (React/TS)  │  │ (React Nat.) │  │     APIs     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼───────────────────────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────────────┐
│         ▼                 ▼                 ▼                        │
│                    API GATEWAY                                      │
│              (Spring Cloud Gateway)                                 │
│         Authentication | Rate Limiting | Routing                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                   SERVICE LAYER                                     │
│  ┌──────────────┐  ┌────┴─────┐  ┌──────────────┐                  │
│  │  Survey Svc  │  │ Verify   │  │  Trust Score │                  │
│  │  (Java)      │  │ Svc(Java)│  │  Svc (Java)  │                  │
│  └──────────────┘  └──────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐                  │
│  │  User Svc    │  │ AI Engine│  │  Blockchain  │                  │
│  │  (Java)      │  │ (Rust)   │  │  Svc (Java)  │                  │
│  └──────────────┘  └──────────┘  └──────────────┘                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                    DATA LAYER                                       │
│  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │PostgreSQL│  │ Redis  │  │ MongoDB  │  │ Elasticsearch    │      │
│  └──────────┘  └────────┘  └──────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Domain-Driven Design

The platform is organized into bounded contexts, each with its own domain model:

1. **Survey Context** - Survey creation, management, and lifecycle
2. **Verification Context** - Survey verification workflows and results
3. **Trust Context** - Trust score calculation and management
4. **Blockchain Context** - On-chain verification records and NFTs
5. **User Context** - User management, authentication, authorization
6. **Analytics Context** - Reporting, dashboards, and insights

For detailed domain model documentation, see [DOMAIN_MODEL.md](DOMAIN_MODEL.md).

---

## API Reference

The platform exposes a RESTful API with comprehensive OpenAPI documentation.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/surveys` | Create a new survey |
| `GET` | `/api/v1/surveys/{id}` | Get survey details |
| `POST` | `/api/v1/verifications` | Submit survey for verification |
| `GET` | `/api/v1/verifications/{id}` | Get verification result |
| `GET` | `/api/v1/trust-scores/{userId}` | Get trust score |
| `POST` | `/api/v1/blockchain/verify` | Create on-chain verification |
| `GET` | `/api/v1/analytics/dashboard` | Get analytics dashboard |

For complete API documentation, see [API.md](API.md).

---

## Deployment

The platform supports multiple deployment options:

- **Docker Compose** - For development and small-scale deployments
- **Kubernetes (Helm)** - For production-grade deployments
- **AWS EKS** - Managed Kubernetes on AWS

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Contributing

We welcome contributions to the Survey Verification Platform. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This software is proprietary and owned by **BackOffice Pro (Pty) Ltd**. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited. See [Software License Agreement](../legal/software-license.md) for details.

Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.

---

## Contact

**BackOffice Pro (Pty) Ltd**

- **Website**: https://www.backofficepro.co.za
- **Email**: info@backofficepro.co.za
- **Support**: support@backofficepro.co.za
- **Address**: South Africa
- **Registration**: CIPC Registered (South African Company)

For technical support, please contact support@backofficepro.co.za or visit our support portal.

---

*Built with dedication by the BackOffice Pro team. Empowering businesses through verified insights.*
