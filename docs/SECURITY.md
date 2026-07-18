# Security Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Authentication Mechanisms](#authentication-mechanisms)
- [Authorization Model](#authorization-model)
- [Data Encryption](#data-encryption)
- [API Security](#api-security)
- [OWASP Compliance](#owasp-compliance)
- [Secrets Management](#secrets-management)
- [Audit Logging](#audit-logging)
- [Incident Response](#incident-response)

---

## Authentication Mechanisms

### JWT Authentication

The platform uses RS256 (RSA Signature with SHA-256) for JWT token signing.

**Token Structure:**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-2026-07-16"
  },
  "payload": {
    "sub": "user-uuid-123",
    "iss": "survey-verify-auth",
    "aud": "survey-verify-api",
    "exp": 1689503600,
    "iat": 1689500000,
    "jti": "token-uuid-456",
    "email": "user@example.com",
    "roles": ["survey_creator", "verifier"],
    "organizationId": "org-123",
    "mfaVerified": true
  }
}
```

**Token Lifecycle:**
- Access token expiry: 1 hour
- Refresh token expiry: 24 hours
- Token rotation on refresh
- Revocation support via token blacklist (Redis)

### Multi-Factor Authentication (MFA)

| Method | Description | Status |
|--------|-------------|--------|
| TOTP | Time-based One-Time Password (Google Authenticator, Authy) | Supported |
| SMS | SMS-based verification code | Supported |
| Email | Email-based verification code | Supported |
| Hardware Key | FIDO2/WebAuthn (YubiKey) | Planned |

**MFA Enrollment Flow:**
1. User initiates MFA setup
2. Server generates secret and sends to client
3. Client generates QR code for authenticator app
4. User scans QR code and provides verification code
5. Server validates code and enables MFA

### Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum Length | 12 characters |
| Maximum Length | 128 characters |
| Complexity | Uppercase, lowercase, number, special character |
| History | Last 12 passwords cannot be reused |
| Max Age | 90 days (configurable per organization) |
| Lockout | 5 failed attempts, 30-minute lockout |
| Breach Check | HaveIBeenPwned API integration |

### SSO Integration

- **SAML 2.0** for enterprise identity providers
- **OAuth 2.0 / OpenID Connect** for social and enterprise login
- **LDAP** for on-premise directory services

---

## Authorization Model

### Role-Based Access Control (RBAC)

**System Roles:**

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Full system access | All permissions |
| `org_admin` | Organization administrator | Manage org users, surveys, settings |
| `survey_creator` | Create and manage surveys | CRUD surveys, view responses |
| `verifier` | Verify survey responses | View and verify responses |
| `reviewer` | Review flagged responses | Review and approve/reject |
| `respondent` | Answer surveys | Submit responses |
| `viewer` | Read-only access | View dashboards and reports |
| `api_user` | API access only | Programmatic access |

### Attribute-Based Access Control (ABAC)

**Policy Examples:**

```yaml
# Survey access policy
- effect: ALLOW
  subject:
    role: survey_creator
    organization: "${resource.organizationId}"
  action: "survey:create"
  resource:
    type: "Survey"

# Verification access policy
- effect: ALLOW
  subject:
    role: verifier
    organization: "${resource.organizationId}"
    trustScore: ">= 70"
  action: "verification:review"
  resource:
    type: "VerificationRequest"

# Data access policy (POPIA compliance)
- effect: DENY
  subject:
    organization: "!= ${resource.dataSubjectOrganization}"
  action: "data:read"
  resource:
    type: "PersonalInformation"
```

### Permission Matrix

| Resource | super_admin | org_admin | survey_creator | verifier | viewer |
|----------|------------|-----------|----------------|----------|--------|
| Users | CRUD | Read (org) | - | - | - |
| Surveys | CRUD | CRUD (org) | CRUD (own) | Read | Read |
| Responses | CRUD | Read (org) | Read (own) | Read | - |
| Verifications | CRUD | Read (org) | Read (own) | CRUD | - |
| Trust Scores | Read | Read (org) | - | Read | Read |
| Blockchain | CRUD | Read | - | Read | Read |
| Analytics | CRUD | Read (org) | Read (limited) | Read (limited) | Read |
| Reports | CRUD | CRUD (org) | Create | Create | Read |
| Settings | CRUD | CRUD (org) | - | - | - |

---

## Data Encryption

### Encryption at Rest

| Data Type | Algorithm | Key Management |
|-----------|-----------|----------------|
| Database | AES-256-GCM | AWS KMS |
| File Storage | AES-256 | AWS KMS |
| Backups | AES-256 | AWS KMS |
| Secrets | AES-256 | AWS Secrets Manager |
| Logs | AES-256 | AWS KMS |

### Field-Level Encryption

Sensitive personal information is encrypted at the field level:

```java
@Entity
public class UserProfile {
    @Encrypted
    @Column(name = "id_number")
    private String idNumber;  // Encrypted: AES-256-GCM

    @Encrypted
    @Column(name = "phone_number")
    private String phoneNumber;  // Encrypted: AES-256-GCM

    @Sensitive
    @Column(name = "email")
    private String email;  // Masked in logs
}
```

### Encryption in Transit

| Channel | Protocol | Minimum Version |
|---------|----------|-----------------|
| External API | TLS | 1.3 |
| Service-to-Service | mTLS | 1.3 |
| Database | TLS | 1.2 |
| Redis | TLS | 1.2 |
| Kafka | TLS | 1.2 |

---

## API Security

### Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store, no-cache, must-revalidate
```

### Input Validation

- All inputs validated against JSON Schema
- Parameterized queries prevent SQL injection
- Output encoding prevents XSS
- Request size limits enforced (10MB default)
- Content-Type validation on all endpoints

### CORS Configuration

```yaml
cors:
  allowedOrigins:
    - "https://surveyverify.backofficepro.co.za"
    - "https://admin.surveyverify.backofficepro.co.za"
  allowedMethods:
    - GET
    - POST
    - PUT
    - DELETE
    - PATCH
  allowedHeaders:
    - Authorization
    - Content-Type
    - X-Request-ID
    - X-Organization-ID
  allowCredentials: true
  maxAge: 3600
```

---

## OWASP Compliance

### OWASP Top 10 2021 Compliance

| Risk | Status | Mitigations |
|------|--------|-------------|
| A01: Broken Access Control | Compliant | RBAC + ABAC, method-level security |
| A02: Cryptographic Failures | Compliant | AES-256, TLS 1.3, key rotation |
| A03: Injection | Compliant | Parameterized queries, input validation |
| A04: Insecure Design | Compliant | Threat modeling, security reviews |
| A05: Security Misconfiguration | Compliant | Hardened defaults, config scanning |
| A06: Vulnerable Components | Compliant | Dependency scanning, automated updates |
| A07: Auth Failures | Compliant | MFA, brute-force protection, rate limiting |
| A08: Software/Data Integrity | Compliant | Digital signatures, CI/CD verification |
| A09: Logging Failures | Compliant | Structured logging, alerting |
| A10: SSRF | Compliant | URL validation, allow-listing |

### Security Testing

- **SAST**: SonarQube, Checkmarx
- **DAST**: OWASP ZAP, Burp Suite
- **SCA**: Snyk, Dependabot
- **Container Scanning**: Trivy, Clair
- **Infrastructure Scanning**: Prowler (AWS), kube-bench (K8s)

---

## Secrets Management

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Application  │────▶│ External Secrets  │────▶│ AWS Secrets  │
│ (K8s Pod)    │     │ Operator         │     │ Manager      │
└──────────────┘     └──────────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │ Kubernetes  │
                     │ Secrets     │
                     └─────────────┘
```

### Rotation Schedule

| Secret | Rotation Period | Method |
|--------|----------------|--------|
| JWT Signing Key | 90 days | Automated |
| Database Password | 90 days | Automated |
| API Keys | 180 days | Automated |
| TLS Certificates | 90 days | Automated (cert-manager) |
| Encryption Keys | 365 days | Manual with AWS KMS |

### Rules

- Never store secrets in code or version control
- Use environment variables or secret managers only
- Rotate secrets regularly and automatically
- Audit secret access
- Use least-privilege access for secret retrieval

---

## Audit Logging

### What is Logged

| Event Category | Examples |
|----------------|----------|
| Authentication | Login, logout, failed login, MFA events |
| Authorization | Permission denied, role changes |
| Data Access | Read/write of sensitive data |
| Data Modification | Create, update, delete operations |
| Administrative | User management, system config changes |
| API Access | All API requests with metadata |
| Blockchain | Transaction submissions, confirmations |

### Log Format

```json
{
  "timestamp": "2026-07-16T12:00:00.000Z",
  "level": "INFO",
  "service": "user-service",
  "traceId": "abc-123-def-456",
  "spanId": "789-xyz",
  "userId": "user-uuid-123",
  "organizationId": "org-123",
  "eventType": "USER_LOGIN",
  "action": "authenticate",
  "resource": "User",
  "resourceId": "user-uuid-123",
  "result": "SUCCESS",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "method": "password",
    "mfaUsed": true
  }
}
```

### Log Retention

| Log Type | Retention Period | Storage |
|----------|-----------------|---------|
| Security Events | 2 years | S3 (Glacier) |
| Audit Logs | 7 years | S3 (Glacier) |
| Application Logs | 30 days | Elasticsearch |
| Access Logs | 90 days | S3 |

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 - Critical | System-wide outage, data breach | 15 minutes | Immediate to CTO |
| P2 - High | Service degradation, security vulnerability | 1 hour | Team lead |
| P3 - Medium | Partial service impact | 4 hours | Engineering manager |
| P4 - Low | Minor issue, no service impact | 24 hours | Team |

### Incident Response Process

1. **Detection & Triage** (0-15 min)
   - Automated alert triggers
   - On-call engineer acknowledges
   - Initial severity assessment

2. **Containment** (15-60 min)
   - Isolate affected systems
   - Prevent further damage
   - Preserve evidence

3. **Eradication** (1-4 hours)
   - Identify root cause
   - Remove threat/vulnerability
   - Apply fixes

4. **Recovery** (4-8 hours)
   - Restore services
   - Verify functionality
   - Monitor for recurrence

5. **Post-Incident** (1-7 days)
   - Conduct post-mortem
   - Document findings
   - Implement preventive measures
   - Update runbooks

### Communication Templates

**Internal Notification:**
```
[SEVERITY] Incident [ID] - [Title]
Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [Description of user impact]
Current Status: [What we know]
Next Update: [Time of next update]
```

**External Notification:**
```
We are currently investigating an issue affecting [service].
Some users may experience [symptoms].
We are actively working to resolve this and will provide updates.
We apologize for any inconvenience.
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
