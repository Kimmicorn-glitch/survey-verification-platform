# Survey Verification Platform

**Trust Every Survey. Verify Every Transaction.**

> Powered by AI | Secured by Blockchain | Built by BackOffice Pro

---

## Overview

The Survey Verification Platform is a Web3-powered AI Verification Platform built for enterprise survey management, blockchain verification, NFT certification, wallet management, geospatial validation, fraud detection, and programmable banking.

Developed by **BackOffice Pro (Pty) Ltd**, South Africa.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| **Backend** | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA |
| **AI Engine** | Rust, Tokio, Axum, ONNX Runtime |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin, ERC-721 |
| **Database** | PostgreSQL 16, Redis 7 |
| **Infrastructure** | Docker, Kubernetes, Nginx, GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Loki, Tempo |

## Architecture

The platform follows Domain Driven Design with:

- **Hexagonal Architecture** (Ports and Adapters)
- **CQRS** for read/write separation
- **Event-Driven Architecture** for cross-context communication
- **Repository Pattern** for data access
- **SOLID Principles** throughout

### Bounded Contexts

| Context | Description |
|---------|------------|
| Identity | User management, authentication, authorization |
| Survey | Survey creation, management, responses |
| Verification | AI-powered verification workflows |
| AI Governance | Fraud detection, trust scoring, behaviour analysis |
| NFT | ERC-721 certificate minting and management |
| Wallet | Web3 wallet integration and management |
| Payment | Subscription billing and payment processing |
| Administration | Platform administration and configuration |
| Notifications | Multi-channel notification delivery |
| Audit | Comprehensive audit logging |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Java 21
- Rust toolchain (for AI engine)
- PostgreSQL 16

### Development Setup

```bash
# Clone the repository
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform

# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# AI Engine: http://localhost:8081
# Grafana:   http://localhost:3001
# Prometheus: http://localhost:9090
```

### Manual Setup

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && ./mvnw spring-boot:run

# AI Engine
cd ai-engine && cargo run

# Blockchain
cd blockchain && npm install && npx hardhat node
```

## Documentation

| Document | Description |
|----------|------------|
| [Architecture](docs/ARCHITECTURE.md) | System architecture and design decisions |
| [Domain Model](docs/DOMAIN_MODEL.md) | DDD bounded contexts and entities |
| [API Reference](docs/API.md) | REST API documentation |
| [Deployment](docs/DEPLOYMENT.md) | Deployment guide |
| [Security](docs/SECURITY.md) | Security documentation |
| [Blockchain](docs/BLOCKCHAIN.md) | Smart contract documentation |
| [Rust Engine](docs/RUST_ENGINE.md) | AI engine documentation |
| [Java Backend](docs/JAVA_BACKEND.md) | Backend documentation |
| [Database](docs/DATABASE.md) | Database schema and migrations |
| [DevOps](docs/DEVOPS.md) | CI/CD and infrastructure |
| [Testing](docs/TESTING.md) | Testing strategy |
| [Whitepaper](docs/WHITEPAPER.md) | Technical whitepaper |

## Project Structure

```
survey-verification-platform/
├── frontend/          # Next.js 15 frontend application
├── backend/           # Java 21 Spring Boot backend
├── ai-engine/         # Rust AI governance engine
├── blockchain/        # Solidity smart contracts
├── infrastructure/    # Docker, Kubernetes, monitoring
├── docs/              # Technical documentation
├── legal/             # Legal documentation
├── .github/           # CI/CD pipelines
├── docker-compose.yml # Development environment
└── TODO.md            # Project task tracker
```

## Security

- JWT + OAuth2 authentication
- RBAC + ABAC authorization
- AES-256 encryption at rest
- TLS 1.3 in transit
- OWASP Top 10 compliance
- Zero Trust security model

See [Security Policy](legal/security-policy.md) for details.

## Legal

- [Terms of Service](legal/terms-of-service.md)
- [Privacy Policy](legal/privacy-policy.md)
- [POPIA Compliance](legal/popia-compliance.md)
- [GDPR Compliance](legal/gdpr-compliance.md)
- [Software License](legal/software-license.md)

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

Copyright (c) 2025 BackOffice Pro (Pty) Ltd. All rights reserved.

See [Software License](legal/software-license.md) for details.

---

**BackOffice Pro (Pty) Ltd** | Johannesburg, South Africa
