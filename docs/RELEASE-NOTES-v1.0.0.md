# Release Notes v1.0.0-rc.1

**Survey Verification Platform**
**Version**: 1.0.0-rc.1
**Release Date**: 2026-07-17
**Published by**: BackOffice Pro (Pty) Ltd

---

## What's New

### Surveys
- Full survey lifecycle management: create, publish, distribute, collect, and archive
- Template-based and ad-hoc survey creation with drag-and-drop builder
- Multi-step approval workflows with configurable gates
- Version control for survey instruments with branching support
- Conditional logic and question branching (up to 5 levels of nesting)
- Multi-language support (English, Afrikaans, Zulu, Xhosa)
- Distribution via email, shareable links, and embedded widgets
- Response collection with real-time validation and quality scoring

### Verification
- Multi-step verification workflows supporting parallel and sequential steps
- Automated validation, AI analysis, GPS verification, statistical analysis, and human review
- Configurable verification pipelines per organization
- Human-in-the-loop review with escalation management
- Verification certificate generation with QR codes
- Complete audit trail with immutable event history
- SLA tracking with deadline management and escalation triggers

### NFTs
- ERC-721 NFT certificate minting on Polygon network
- Immutable verification proofs stored on-chain
- Customizable certificate metadata with survey attributes
- NFT transfer and ownership management
- IPFS metadata storage for decentralized certificate access
- Batch minting for gas optimization
- Verification registry smart contracts for public auditability

### Wallet
- Web3 wallet integration (MetaMask, WalletConnect)
- Polygon MATIC balance display and gas management
- Transaction history with explorer links
- Wallet address management for NFT recipients
- Gas estimation before transaction submission
- Support for multiple wallet connections per user

### Payment
- Tiered subscription plans: Free, Basic, Professional, Enterprise
- Usage-based billing for verification volume
- Stripe payment integration with secure webhook handling
- Automated invoicing and receipt generation
- Credit-based system for pay-as-you-go usage
- Multi-currency support (ZAR, USD, EUR)

### Admin
- Organization management with multi-tenant isolation
- User administration with role assignment and audit logging
- Subscription plan management and billing dashboard
- System health monitoring with real-time metrics
- Configuration management for survey defaults and security policies
- API key management for programmatic access
- Compliance reporting for POPIA and GDPR requirements

### Platform Core
- Event-driven microservices architecture with 7 bounded contexts
- CQRS and Event Sourcing patterns for read/write separation
- Domain-Driven Design with clean bounded context boundaries
- Apache Kafka for reliable event streaming
- Rust-powered AI engine for sub-100ms fraud detection
- End-to-end encryption with AES-256 at rest and TLS 1.3 in transit

---

## Breaking Changes

**None.** This is the initial release candidate. No breaking changes from previous versions.

---

## Known Limitations

### DRRT Governance (Future)
- The Decentralized Reputation and Rights Token (DRRT) governance mechanism is not yet implemented
- On-chain voting and reputation staking are planned for v1.2.0
- Current trust scoring is centralized; decentralized governance will be phased in
- Token-based incentive models are under research and will be proposed in a future governance whitepaper

### Cross-Chain (Future)
- Currently deployed exclusively on Polygon (Ethereum L2)
- Cross-chain verification support (Ethereum, BNB Chain, Arbitrum) is planned for v1.2.0
- NFT certificates are only mintable on Polygon; cross-chain bridging is under evaluation
- Trust score oracle integration with other chains is not yet available

### Additional Limitations
- Maximum survey response size: 10 MB (including file uploads)
- Maximum questions per survey: 200
- Maximum concurrent verifications: 10,000 per organization
- Batch processing limited to 1,000 records per job
- Mobile SDK not yet available (planned for v1.1.0)
- Computer vision verification not yet supported (planned for v1.1.0)

---

## Upgrade Instructions

### New Installation

Follow the [Deployment Guide](DEPLOYMENT.md) for full installation instructions.

Quick start:
```bash
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform

# Docker Compose (development)
docker-compose up -d

# Kubernetes (production) - see OPERATOR-GUIDE.md
helm install survey-verify ./helm/survey-verify --namespace survey-verification --create-namespace
```

### Database Migrations

Migrations run automatically on startup via Flyway. See [Migration Guide](MIGRATION-GUIDE.md) for manual execution:
```bash
cd backend/java
mvn flyway:migrate
```

### Post-Upgrade Verification

1. Check all services are healthy: `GET /actuator/health`
2. Verify database migrations: `GET /actuator/info`
3. Test authentication flow: `POST /api/v1/auth/login`
4. Verify event processing: check Kafka consumer lag
5. Validate blockchain connection: `GET /api/v1/blockchain/health`

---

## Security Updates

### Security Features
- JWT authentication with RS256 signing and automatic key rotation
- Multi-factor authentication (TOTP, SMS, Email)
- Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)
- AES-256-GCM encryption at rest with AWS KMS key management
- TLS 1.3 encryption in transit with mTLS for service-to-service
- Container image scanning with Trivy in CI/CD pipeline
- Secrets management via AWS Secrets Manager + External Secrets Operator
- Comprehensive audit logging with 7-year retention
- OWASP Top 10 compliance across all endpoints
- Rate limiting per API key with configurable thresholds
- Input validation and output encoding to prevent injection and XSS

### Dependency Updates
- Spring Boot 3.2.x (latest patch)
- Spring Security 6.2.x with CVE fixes
- PostgreSQL JDBC driver updated to 42.7.x
- All dependencies scanned for vulnerabilities via Snyk and Dependabot
- Rust crates audited with `cargo audit`

### Security Testing
- SAST scanning via SonarQube and Checkmarx (no critical findings)
- DAST scanning via OWASP ZAP (all high-severity issues resolved)
- Container image scanning via Trivy (zero critical vulnerabilities)
- Dependency scanning via Snyk (all critical advisories patched)
- Penetration testing completed by external firm (report available on request)

---

## Compatibility

| Component | Version |
|-----------|---------|
| Java Runtime | 17+ |
| PostgreSQL | 15+ |
| Redis | 7+ |
| Kafka | 3.5+ |
| Kubernetes | 1.28+ |
| Docker | 24.0+ |
| Helm | 3.12+ |
| Terraform | 1.5+ |
| Node.js | 18+ (frontend) |
| Polygon RPC | Mumbai/ Mainnet |

---

## Deprecations

None for this release.

---

## Feedback and Support

- **Documentation**: See `/docs` for full documentation
- **Issues**: GitHub Issues
- **Security**: security@backofficepro.co.za
- **Support**: support@backofficepro.co.za

---

*Document Version: 1.0.0-rc.1*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
