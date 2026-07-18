# Security Policy

**Survey Verification Platform**
**Maintained by**: BackOffice Pro (Pty) Ltd

---

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest release candidate and stable releases receive security updates.

---

## Vulnerability Disclosure Process

### Reporting a Vulnerability

**Do not create public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability, please report it responsibly:

1. **Email**: security@backofficepro.co.za
2. **Subject**: `[SECURITY] Brief description of vulnerability`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)
   - Your contact information for follow-up

### What to Expect

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Status update | Every 2 weeks until resolved |
| Security patch | Based on severity (see below) |

### Severity Response Times

| Severity | Description | Fix Timeline |
|----------|-------------|--------------|
| Critical | Remote code execution, data breach, authentication bypass | 24-48 hours |
| High | Privilege escalation, significant data exposure | 7 days |
| Medium | Limited data exposure, denial of service | 30 days |
| Low | Minor information disclosure, best practice violations | 90 days |

### Disclosure Policy

- We request **90 days** from the report date before public disclosure
- We will credit reporters in the security advisory (unless anonymity is requested)
- We will not take legal action against researchers who follow responsible disclosure
- We participate in coordinated disclosure through GitHub Security Advisories

---

## Security Measures

### Authentication & Authorization
- JWT with RS256 signing
- Multi-factor authentication (TOTP, SMS, Email)
- Role-Based Access Control (RBAC) + Attribute-Based Access Control (ABAC)
- Session management with Redis-backed token blacklist
- Account lockout after failed attempts

### Data Protection
- AES-256-GCM encryption at rest
- TLS 1.3 encryption in transit
- Field-level encryption for PII
- Automatic PII masking in logs
- POPIA and GDPR compliance

### Infrastructure Security
- Container image scanning (Trivy)
- Dependency vulnerability scanning (Snyk, Dependabot)
- HashiCorp Vault for secrets management
- Network segmentation
- Web application firewall (WAF)
- DDoS protection

### Application Security
- OWASP Top 10 compliance
- Input validation and output encoding
- Parameterized queries
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting on all endpoints
- CORS with strict allowlisting

### Monitoring & Auditing
- Comprehensive audit logging
- Real-time security alerting
- Anomaly detection
- Incident response procedures
- Regular penetration testing

---

## Security Update Process

1. Security patch is developed and tested
2. Patch is reviewed by at least one security team member
3. Regression tests are run to ensure no side effects
4. Patch is deployed to staging for validation
5. Patch is deployed to production
6. Security advisory is published on GitHub
7. Affected users are notified via email (for critical/high severity)

---

## Contact

| Purpose | Contact |
|---------|---------|
| Security Vulnerabilities | security@backofficepro.co.za |
| General Support | support@backofficepro.co.za |
| Website | https://backofficepro.com |

---

## Recognition

We appreciate the security research community and will acknowledge researchers who help improve our security through responsible disclosure.

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
