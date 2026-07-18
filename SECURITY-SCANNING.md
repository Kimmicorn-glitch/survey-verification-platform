# Security Scanning Configuration

## OWASP Dependency-Check

The backend uses OWASP Dependency-Check via Maven plugin.

### Run locally:
```bash
cd backend
mvn dependency-check:check
```

### Configuration:
- Suppressions: `backend/dependency-check-suppressions.xml`
- Fail on: CVSS >= 7
- Includes: CVE database (NVD)

## Trivy Container Scanning

### Scan Docker images:
```bash
trivy image ghcr.io/backofficepro/survey-platform-backend:latest
trivy image ghcr.io/backofficepro/survey-platform-frontend:latest
trivy image ghcr.io/backofficepro/survey-platform-ai-engine:latest
```

### Configuration:
- Ignore file: `.trivyignore`
- Severity threshold: HIGH, CRITICAL
- Skip unfixed: true

## Snyk Vulnerability Scanning

### Scan dependencies:
```bash
snyk test --severity-threshold=high
```

### Configuration:
- Config file: `.snyk`
- Severity threshold: HIGH
- License allowlist: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC

## Semgrep SAST Scanning

### Run static analysis:
```bash
semgrep scan --config auto --severity WARNING
```

## Security Headers

The nginx configuration enforces security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: default-src 'self'
- Strict-Transport-Security: max-age=31536000; includeSubDomains

## CORS Configuration

Backend CORS is configured in `application.yml`:
- Allowed origins: configurable per environment
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type
- Allow credentials: true
- Max age: 3600

## Rate Limiting

Resilience4j rate limiting is applied via AOP aspect:
- Default: 100 requests per minute per IP
- Auth endpoints: 10 requests per minute
- Admin endpoints: 200 requests per minute

## Audit Logging

All state-changing operations are logged via AuditAspect:
- User authentication events
- Survey CRUD operations
- Verification submissions
- Payment transactions
- NFT minting events
- Admin actions
