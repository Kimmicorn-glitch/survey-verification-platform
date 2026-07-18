# API Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16
**Base URL**: `https://api.surveyverify.backofficepro.co.za/api/v1`

---

## Table of Contents

- [Authentication](#authentication)
- [Common Headers](#common-headers)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [User Service API](#user-service-api)
- [Survey Service API](#survey-service-api)
- [Verification Service API](#verification-service-api)
- [Trust Score Service API](#trust-score-service-api)
- [Blockchain Service API](#blockchain-service-api)
- [Analytics Service API](#analytics-service-api)

---

## Authentication

All API requests require JWT authentication unless otherwise specified.

### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "roles": ["survey_creator", "verifier"]
  }
}
```

### Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

### Multi-Factor Authentication

```http
POST /auth/mfa/verify
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "123456",
  "method": "TOTP"
}
```

---

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token for authentication |
| `Content-Type` | Yes | `application/json` for requests with body |
| `X-Request-ID` | No | Unique request identifier for tracing |
| `X-Organization-ID` | Conditional | Required for multi-tenant operations |
| `Accept-Language` | No | Language preference (default: `en-ZA`) |
| `X-API-Version` | No | API version (default: `v1`) |

---

## Rate Limiting

| Tier | Requests/Minute | Burst |
|------|----------------|-------|
| Free | 60 | 10 |
| Basic | 300 | 50 |
| Professional | 1,000 | 100 |
| Enterprise | 10,000 | 500 |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1689500000
X-RateLimit-Policy: 1000;w=60
```

**Rate Limit Exceeded Response (429):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 30
  }
}
```

---

## Pagination

All list endpoints support cursor-based pagination.

**Request Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | null | Cursor for next page |
| `limit` | integer | 20 | Items per page (max: 100) |
| `sort` | string | `createdAt` | Sort field |
| `order` | string | `desc` | Sort direction (`asc` or `desc`) |

**Response Format:**
```json
{
  "data": [],
  "pagination": {
    "cursor": "eyJpZCI6IjU1MGU4NDAw...",
    "hasMore": true,
    "total": 150,
    "limit": 20
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid fields.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "rejectedValue": "not-an-email"
      }
    ],
    "timestamp": "2026-07-16T12:00:00Z",
    "traceId": "abc-123-def-456"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation failed |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid credentials |
| `AUTH_002` | 401 | Token expired |
| `AUTH_003` | 401 | Token invalid |
| `AUTH_004` | 403 | Insufficient permissions |
| `AUTH_005` | 401 | Account locked |
| `VAL_001` | 400 | Required field missing |
| `VAL_002` | 422 | Invalid field format |
| `VAL_003` | 422 | Field value out of range |
| `BIZ_001` | 409 | Survey already published |
| `BIZ_002` | 400 | Survey response incomplete |
| `BIZ_003` | 400 | Verification already completed |
| `BIZ_004` | 404 | Survey not found |
| `BIZ_005` | 404 | Verification not found |
| `SYS_001` | 500 | Internal server error |
| `SYS_002` | 503 | Service unavailable |
| `CHAIN_001` | 502 | Blockchain transaction failed |
| `CHAIN_002` | 502 | Insufficient gas |
| `AI_001` | 500 | AI analysis failed |
| `AI_002` | 500 | Model unavailable |

---

## User Service API

### Register User

```http
POST /users/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+27123456789",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**
```json
{
  "id": "660e9500-f39c-52e5-b827-557766551111",
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "PENDING_VERIFICATION",
  "createdAt": "2026-07-16T12:00:00Z"
}
```

### Get User Profile

```http
GET /users/{userId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+27123456789",
  "status": "ACTIVE",
  "mfaEnabled": true,
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "BackOffice Pro (Pty) Ltd"
  },
  "roles": ["survey_creator", "verifier"],
  "createdAt": "2026-01-15T08:30:00Z",
  "updatedAt": "2026-07-16T10:00:00Z"
}
```

### Update User Profile

```http
PUT /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phoneNumber": "+27987654321"
}
```

### Delete User

```http
DELETE /users/{userId}
Authorization: Bearer {token}
```

**Response (204):** No Content

### List Users

```http
GET /users?limit=20&cursor=abc123&role=survey_creator
Authorization: Bearer {token}
```

### Enable MFA

```http
POST /users/{userId}/mfa/enable
Authorization: Bearer {token}
Content-Type: application/json

{
  "method": "TOTP"
}
```

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/SurveyVerify:user@example.com?secret=...",
  "method": "TOTP"
}
```

### Disable MFA

```http
POST /users/{userId}/mfa/disable
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "123456"
}
```

### Grant Consent

```http
POST /users/{userId}/consent
Authorization: Bearer {token}
Content-Type: application/json

{
  "consentType": "DATA_PROCESSING",
  "purpose": "Survey data collection and verification",
  "granted": true
}
```

**Response (201):**
```json
{
  "id": "consent-uuid-123",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "consentType": "DATA_PROCESSING",
  "granted": true,
  "grantedAt": "2026-07-16T12:00:00Z",
  "expiresAt": "2027-07-16T12:00:00Z"
}
```

### Revoke Consent

```http
DELETE /users/{userId}/consent/{consentId}
Authorization: Bearer {token}
```

**Response (204):** No Content

### List User Consents

```http
GET /users/{userId}/consent
Authorization: Bearer {token}
```

---

## Survey Service API

### Create Survey

```http
POST /surveys
Authorization: Bearer {token}
X-Organization-ID: org-123
Content-Type: application/json

{
  "title": "Customer Satisfaction Survey Q3 2026",
  "description": "Quarterly customer satisfaction assessment for all service lines",
  "questions": [
    {
      "text": "How satisfied are you with our service?",
      "type": "SCALE",
      "required": true,
      "order": 1,
      "validation": {"min": 1, "max": 10}
    },
    {
      "text": "What could we improve?",
      "type": "FREE_TEXT",
      "required": false,
      "order": 2,
      "validation": {"maxLength": 500}
    },
    {
      "text": "How likely are you to recommend us?",
      "type": "SINGLE_CHOICE",
      "required": true,
      "order": 3,
      "options": [
        {"text": "Very Likely", "value": "5"},
        {"text": "Likely", "value": "4"},
        {"text": "Neutral", "value": "3"},
        {"text": "Unlikely", "value": "2"},
        {"text": "Very Unlikely", "value": "1"}
      ]
    }
  ],
  "settings": {
    "allowAnonymous": false,
    "requireAuthentication": true,
    "multipleSubmissions": false,
    "responseDeadline": "2026-09-30T23:59:59Z",
    "timezone": "Africa/Johannesburg"
  },
  "distribution": {
    "maxRespondents": 1000,
    "distributionChannels": ["EMAIL", "LINK"],
    "targetOrganization": "org-123"
  }
}
```

**Response (201):**
```json
{
  "id": "survey-uuid-456",
  "title": "Customer Satisfaction Survey Q3 2026",
  "version": 1,
  "status": "DRAFT",
  "createdBy": "user-uuid-789",
  "organizationId": "org-123",
  "createdAt": "2026-07-16T12:00:00Z"
}
```

### Get Survey

```http
GET /surveys/{surveyId}
Authorization: Bearer {token}
```

### Update Survey

```http
PUT /surveys/{surveyId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Survey Title",
  "description": "Updated description"
}
```

### Delete Survey

```http
DELETE /surveys/{surveyId}
Authorization: Bearer {token}
```

**Response (204):** No Content

### List Surveys

```http
GET /surveys?status=ACTIVE&limit=20
Authorization: Bearer {token}
X-Organization-ID: org-123
```

### Publish Survey

```http
POST /surveys/{surveyId}/publish
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "survey-uuid-456",
  "status": "PUBLISHED",
  "publishedAt": "2026-07-16T14:00:00Z"
}
```

### Close Survey

```http
POST /surveys/{surveyId}/close
Authorization: Bearer {token}
```

### Submit Survey Response

```http
POST /surveys/{surveyId}/responses
Authorization: Bearer {token}
Content-Type: application/json

{
  "answers": [
    {"questionId": "q1-uuid", "value": 8},
    {"questionId": "q2-uuid", "value": "Great service overall"},
    {"questionId": "q3-uuid", "value": "4"}
  ],
  "metadata": {
    "deviceType": "mobile",
    "os": "Android 14",
    "browser": "Chrome 125",
    "location": {
      "latitude": -26.2041,
      "longitude": 28.0473,
      "accuracy": 15.0
    }
  }
}
```

**Response (201):**
```json
{
  "id": "response-uuid-789",
  "surveyId": "survey-uuid-456",
  "respondentId": "user-uuid-123",
  "status": "SUBMITTED",
  "submittedAt": "2026-07-16T15:30:00Z",
  "qualityScore": 0.92
}
```

### Get Survey Response

```http
GET /surveys/{surveyId}/responses/{responseId}
Authorization: Bearer {token}
```

### List Survey Responses

```http
GET /surveys/{surveyId}/responses?status=VERIFIED&limit=50
Authorization: Bearer {token}
```

---

## Verification Service API

### Request Verification

```http
POST /verifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "surveyResponseId": "response-uuid-789",
  "priority": "HIGH",
  "requestedBy": "user-uuid-123"
}
```

**Response (201):**
```json
{
  "id": "verification-uuid-abc",
  "surveyResponseId": "response-uuid-789",
  "status": "PENDING",
  "priority": "HIGH",
  "createdAt": "2026-07-16T16:00:00Z"
}
```

### Get Verification

```http
GET /verifications/{verificationId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "verification-uuid-abc",
  "surveyResponseId": "response-uuid-789",
  "requestedBy": "user-uuid-123",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "steps": [
    {
      "id": "step-uuid-001",
      "type": "AUTOMATED_VALIDATION",
      "status": "COMPLETED",
      "startedAt": "2026-07-16T16:00:05Z",
      "completedAt": "2026-07-16T16:00:08Z"
    },
    {
      "id": "step-uuid-002",
      "type": "AI_ANALYSIS",
      "status": "IN_PROGRESS",
      "startedAt": "2026-07-16T16:00:08Z"
    },
    {
      "id": "step-uuid-003",
      "type": "GPS_VERIFICATION",
      "status": "PENDING"
    },
    {
      "id": "step-uuid-004",
      "type": "STATISTICAL_ANALYSIS",
      "status": "PENDING"
    },
    {
      "id": "step-uuid-005",
      "type": "HUMAN_REVIEW",
      "status": "PENDING"
    }
  ],
  "currentStepIndex": 1,
  "progress": 0.20,
  "createdAt": "2026-07-16T16:00:00Z"
}
```

### Get Verification Result

```http
GET /verifications/{verificationId}/result
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "verificationId": "verification-uuid-abc",
  "decision": "VERIFIED",
  "confidenceScore": 0.95,
  "fraudIndicators": [],
  "aiAnalysis": {
    "overallRisk": "LOW",
    "anomaliesDetected": 0,
    "responseConsistency": 0.97,
    "gpsConsistency": true,
    "statisticalOutliers": 0,
    "analysisTimestamp": "2026-07-16T16:01:15Z"
  },
  "humanReview": {
    "reviewerId": "reviewer-uuid-001",
    "decision": "APPROVED",
    "comments": "All checks passed. Response appears genuine.",
    "reviewedAt": "2026-07-16T16:30:00Z"
  },
  "certificateId": "cert-uuid-xyz",
  "completedAt": "2026-07-16T16:30:00Z"
}
```

### List Verifications

```http
GET /verifications?status=COMPLETED&limit=20
Authorization: Bearer {token}
```

### Cancel Verification

```http
POST /verifications/{verificationId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Duplicate submission detected"
}
```

### Request Escalation

```http
POST /verifications/{verificationId}/escalate
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Complex case requiring specialist review",
  "escalatedTo": "senior-reviewer-uuid"
}
```

### Get Verification History

```http
GET /verifications/{verificationId}/history
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "verificationId": "verification-uuid-abc",
  "events": [
    {
      "timestamp": "2026-07-16T16:00:00Z",
      "event": "VERIFICATION_REQUESTED",
      "actor": "user-uuid-123",
      "details": "Verification submitted for response-uuid-789"
    },
    {
      "timestamp": "2026-07-16T16:00:05Z",
      "event": "STEP_STARTED",
      "actor": "system",
      "details": "Automated validation started"
    },
    {
      "timestamp": "2026-07-16T16:00:08Z",
      "event": "STEP_COMPLETED",
      "actor": "system",
      "details": "Automated validation passed"
    }
  ]
}
```

---

## Trust Score Service API

### Get Trust Score

```http
GET /trust-scores/{entityId}?entityType=USER
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "trust-uuid-001",
  "entityId": "user-uuid-123",
  "entityType": "USER",
  "score": 87.5,
  "previousScore": 85.2,
  "trend": "IMPROVING",
  "factors": [
    {
      "id": "factor-uuid-001",
      "name": "Identity Verification",
      "category": "IDENTITY",
      "weight": 0.25,
      "value": 95.0,
      "confidence": 0.98,
      "contribution": 23.75
    },
    {
      "id": "factor-uuid-002",
      "name": "Response History",
      "category": "HISTORY",
      "weight": 0.30,
      "value": 88.0,
      "confidence": 0.95,
      "contribution": 26.4
    },
    {
      "id": "factor-uuid-003",
      "name": "Behavioral Pattern",
      "category": "BEHAVIOR",
      "weight": 0.20,
      "value": 82.0,
      "confidence": 0.88,
      "contribution": 16.4
    },
    {
      "id": "factor-uuid-004",
      "name": "Network Analysis",
      "category": "NETWORK",
      "weight": 0.10,
      "value": 90.0,
      "confidence": 0.85,
      "contribution": 9.0
    },
    {
      "id": "factor-uuid-005",
      "name": "Compliance",
      "category": "COMPLIANCE",
      "weight": 0.15,
      "value": 78.0,
      "confidence": 0.92,
      "contribution": 11.7
    }
  ],
  "scoreRange": {
    "label": "Trusted",
    "color": "#4CAF50",
    "min": 80,
    "max": 100
  },
  "calculatedAt": "2026-07-16T12:00:00Z",
  "validUntil": "2026-08-15T12:00:00Z"
}
```

### Get Trust Score History

```http
GET /trust-scores/{entityId}/history?period=90d&entityType=USER
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "entityId": "user-uuid-123",
  "history": [
    {
      "score": 87.5,
      "calculatedAt": "2026-07-16T12:00:00Z"
    },
    {
      "score": 85.2,
      "calculatedAt": "2026-06-16T12:00:00Z"
    },
    {
      "score": 82.0,
      "calculatedAt": "2026-05-16T12:00:00Z"
    }
  ],
  "statistics": {
    "average": 84.9,
    "minimum": 82.0,
    "maximum": 87.5,
    "stdDeviation": 2.25
  }
}
```

### List Trust Scores (Organization)

```http
GET /trust-scores?organizationId=org-123&minScore=80&limit=20
Authorization: Bearer {token}
```

### Recalculate Trust Score

```http
POST /trust-scores/{entityId}/recalculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "entityType": "USER",
  "factors": ["IDENTITY", "HISTORY", "BEHAVIOR", "NETWORK", "COMPLIANCE"],
  "forceFullRecalculation": true
}
```

### Get Score Distribution

```http
GET /trust-scores/distribution?organizationId=org-123
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "organizationId": "org-123",
  "distribution": {
    "total": 1500,
    "ranges": [
      {"label": "Excellent", "min": 90, "max": 100, "count": 300, "percentage": 20.0},
      {"label": "Trusted", "min": 80, "max": 89, "count": 600, "percentage": 40.0},
      {"label": "Moderate", "min": 60, "max": 79, "count": 450, "percentage": 30.0},
      {"label": "Low", "min": 40, "max": 59, "count": 120, "percentage": 8.0},
      {"label": "Poor", "min": 0, "max": 39, "count": 30, "percentage": 2.0}
    ],
    "average": 78.5,
    "median": 82.0
  }
}
```

---

## Blockchain Service API

### Record Verification On-Chain

```http
POST /blockchain/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "verificationId": "verification-uuid-abc",
  "network": "POLYGON",
  "metadata": {
    "surveyId": "survey-uuid-456",
    "respondentHash": "0xabc123...",
    "trustScore": 87.5,
    "verificationResult": "VERIFIED",
    "timestamp": "2026-07-16T16:30:00Z"
  }
}
```

**Response (201):**
```json
{
  "id": "onchain-uuid-001",
  "verificationId": "verification-uuid-abc",
  "transactionHash": "0xdef456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "blockNumber": null,
  "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "networkId": 137,
  "status": "PENDING",
  "estimatedConfirmationTime": 30,
  "createdAt": "2026-07-16T16:30:05Z"
}
```

### Get On-Chain Verification Status

```http
GET /blockchain/verify/{onChainVerificationId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "onchain-uuid-001",
  "verificationId": "verification-uuid-abc",
  "transactionHash": "0xdef456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "blockNumber": 45678901,
  "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "networkId": 137,
  "status": "CONFIRMED",
  "gasUsed": 21000,
  "gasPrice": "30000000000",
  "confirmedAt": "2026-07-16T16:30:35Z",
  "explorerUrl": "https://polygonscan.com/tx/0xdef456..."
}
```

### Mint NFT Certificate

```http
POST /blockchain/nft/mint
Authorization: Bearer {token}
Content-Type: application/json

{
  "verificationId": "verification-uuid-abc",
  "recipientAddress": "0x9876543210fedcba9876543210fedcba98765432",
  "metadata": {
    "name": "Survey Verification Certificate #001",
    "description": "This NFT certifies the verification of survey response",
    "image": "https://api.surveyverify.backofficepro.co.za/nft/image/001.png",
    "externalUrl": "https://surveyverify.backofficepro.co.za/certificate/001",
    "attributes": [
      {"traitType": "Survey Type", "value": "Customer Satisfaction"},
      {"traitType": "Trust Score", "value": 87.5},
      {"traitType": "Verification Date", "value": "2026-07-16"},
      {"traitType": "Verification Level", "value": "Full"},
      {"traitType": "Fraud Risk", "value": "Low"}
    ]
  }
}
```

**Response (201):**
```json
{
  "id": "nft-uuid-001",
  "tokenId": "1",
  "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "ownerAddress": "0x9876543210fedcba9876543210fedcba98765432",
  "verificationId": "verification-uuid-abc",
  "metadataUri": "ipfs://QmHash123456789",
  "status": "MINTING",
  "estimatedConfirmationTime": 60,
  "createdAt": "2026-07-16T16:35:00Z"
}
```

### Get NFT Certificate

```http
GET /blockchain/nft/{nftId}
Authorization: Bearer {token}
```

### Transfer NFT Certificate

```http
POST /blockchain/nft/{nftId}/transfer
Authorization: Bearer {token}
Content-Type: application/json

{
  "toAddress": "0xnewowner1234567890abcdef1234567890abcdef",
  "reason": "Ownership transfer"
}
```

### Estimate Gas

```http
POST /blockchain/estimate-gas
Authorization: Bearer {token}
Content-Type: application/json

{
  "operation": "MINT_NFT",
  "network": "POLYGON",
  "parameters": {}
}
```

**Response (200):**
```json
{
  "operation": "MINT_NFT",
  "estimatedGas": 150000,
  "gasPrice": "30000000000",
  "estimatedCost": "0.0045",
  "currency": "MATIC",
  "networkFee": "0.0015 USD"
}
```

### Get Verification Registry

```http
GET /blockchain/registry?network=POLYGON&limit=20
Authorization: Bearer {token}
```

---

## Analytics Service API

### Get Dashboard Data

```http
GET /analytics/dashboard?organizationId=org-123
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "organizationId": "org-123",
  "summary": {
    "totalSurveys": 45,
    "activeSurveys": 12,
    "totalResponses": 15420,
    "pendingVerifications": 230,
    "completedVerifications": 14890,
    "verifiedPercentage": 96.6,
    "averageTrustScore": 78.5,
    "fraudDetectionRate": 3.4,
    "blockchainRecords": 12500,
    "nftCertificates": 12500
  },
  "trends": {
    "responsesLast30Days": 2340,
    "verificationsLast30Days": 2300,
    "growthRate": 12.5
  }
}
```

### Get Verification Analytics

```http
GET /analytics/verifications?period=30d&organizationId=org-123
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "period": "30d",
  "total": 2300,
  "byStatus": {
    "verified": 2218,
    "rejected": 82,
    "pending": 0
  },
  "byStep": {
    "automatedValidation": {"passed": 2280, "failed": 20},
    "aiAnalysis": {"passed": 2250, "failed": 50},
    "gpsVerification": {"passed": 2240, "failed": 10},
    "statisticalAnalysis": {"passed": 2230, "failed": 20},
    "humanReview": {"approved": 2218, "rejected": 82}
  },
  "averageCompletionTime": "4.5 hours",
  "fraudDetectionBreakdown": {
    "gpsSpoofing": 15,
    "responsePatternAnomaly": 25,
    "statisticalOutlier": 20,
    "identityMismatch": 10,
    "timingAnomaly": 12
  }
}
```

### Get Trust Score Analytics

```http
GET /analytics/trust-scores?period=30d&organizationId=org-123
Authorization: Bearer {token}
```

### Generate Report

```http
POST /analytics/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "VERIFICATION_SUMMARY",
  "organizationId": "org-123",
  "dateRange": {
    "start": "2026-06-01T00:00:00Z",
    "end": "2026-07-01T00:00:00Z"
  },
  "format": "PDF",
  "recipients": ["admin@backofficepro.co.za"]
}
```

**Response (202):**
```json
{
  "reportId": "report-uuid-001",
  "status": "PROCESSING",
  "estimatedCompletionTime": "2026-07-16T17:00:00Z"
}
```

### Get Report Status

```http
GET /analytics/reports/{reportId}
Authorization: Bearer {token}
```

### Download Report

```http
GET /analytics/reports/{reportId}/download
Authorization: Bearer {token}
```

**Response:** Binary file download (PDF/CSV/Excel)

### Get Real-Time Metrics

```http
GET /analytics/metrics/realtime?organizationId=org-123
Authorization: Bearer {token}
```

### Export Analytics Data

```http
POST /analytics/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "VERIFICATION_DATA",
  "dateRange": {
    "start": "2026-01-01T00:00:00Z",
    "end": "2026-07-16T23:59:59Z"
  },
  "format": "CSV",
  "filters": {
    "status": ["VERIFIED", "REJECTED"]
  }
}
```

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

- **JSON**: `https://api.surveyverify.backofficepro.co.za/api/v1/openapi.json`
- **YAML**: `https://api.surveyverify.backofficepro.co.za/api/v1/openapi.yaml`
- **Swagger UI**: `https://api.surveyverify.backofficepro.co.za/swagger-ui.html`
- **ReDoc**: `https://api.surveyverify.backofficepro.co.za/redoc`

### API Versioning

The API supports versioning through the `X-API-Version` header. Current version is `v1`. Deprecated versions will be supported for a minimum of 12 months after deprecation notice.

### SDK Availability

| Language | Package | Version |
|----------|---------|---------|
| JavaScript/TypeScript | `@backofficepro/survey-verify-sdk` | 1.0.0 |
| Python | `survey-verify-sdk` | 1.0.0 |
| Java | `za.co.backofficepro:survey-verify-sdk` | 1.0.0 |
| Go | `github.com/backofficepro/survey-verify-go` | 1.0.0 |

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
