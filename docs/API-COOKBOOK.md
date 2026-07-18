# API Cookbook

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17
**Base URL**: `https://api.surveyverify.backofficepro.co.za/api/v1`

---

## Table of Contents

- [Authentication Examples](#authentication-examples)
- [Survey CRUD Examples](#survey-crud-examples)
- [Verification Flow Examples](#verification-flow-examples)
- [NFT Minting Examples](#nft-minting-examples)
- [Webhook Handling Examples](#webhook-handling-examples)
- [Error Handling Patterns](#error-handling-patterns)

---

## Authentication Examples

### User Registration

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecureP@ss123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+27123456789",
    "organizationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response (201):**
```json
{
  "id": "660e9500-f39c-52e5-b827-557766551111",
  "email": "john.doe@example.com",
  "status": "PENDING_VERIFICATION",
  "createdAt": "2026-07-17T10:00:00Z"
}
```

### User Login

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecureP@ss123!"
  }'
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "660e9500-f39c-52e5-b827-557766551111",
    "email": "john.doe@example.com",
    "roles": ["survey_creator", "verifier"]
  }
}
```

### Using the Access Token

```bash
# Store token
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use in subsequent requests
curl https://api.surveyverify.backofficepro.co.za/api/v1/surveys \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### Refresh Token

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
  }'
```

**Response (200):**
```json
{
  "accessToken": "new-access-token...",
  "refreshToken": "new-refresh-token...",
  "expiresIn": 3600
}
```

### Multi-Factor Authentication

```bash
# Enable MFA
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/users/660e9500-f39c-52e5-b827-557766551111/mfa/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "TOTP"}'
```

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/SurveyVerify:john.doe@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SurveyVerify",
  "method": "TOTP"
}
```

```bash
# Verify MFA during login
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "660e9500-f39c-52e5-b827-557766551111",
    "code": "123456",
    "method": "TOTP"
  }'
```

### Error Response (Invalid Credentials)

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@example.com", "password": "wrong"}'
```

**Response (401):**
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password",
    "timestamp": "2026-07-17T10:00:00Z",
    "traceId": "abc-123-def-456"
  }
}
```

---

## Survey CRUD Examples

### Create Survey

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/surveys \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Satisfaction Survey Q3 2026",
    "description": "Quarterly customer satisfaction assessment",
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
        "text": "How likely to recommend us?",
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
      "responseDeadline": "2026-09-30T23:59:59Z"
    },
    "distribution": {
      "maxRespondents": 1000,
      "distributionChannels": ["EMAIL", "LINK"]
    }
  }'
```

**Response (201):**
```json
{
  "id": "survey-uuid-456",
  "title": "Customer Satisfaction Survey Q3 2026",
  "version": 1,
  "status": "DRAFT",
  "createdAt": "2026-07-17T10:00:00Z"
}
```

### Get Survey

```bash
curl https://api.surveyverify.backofficepro.co.za/api/v1/surveys/survey-uuid-456 \
  -H "Authorization: Bearer $TOKEN"
```

### List Surveys

```bash
# With pagination
curl "https://api.surveyverify.backofficepro.co.za/api/v1/surveys?status=ACTIVE&limit=20&cursor=abc123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-ID: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "survey-uuid-456",
      "title": "Customer Satisfaction Survey Q3 2026",
      "status": "ACTIVE",
      "responseCount": 342,
      "createdAt": "2026-07-17T10:00:00Z"
    }
  ],
  "pagination": {
    "cursor": "eyJpZCI6InN1cnZleS11dWlkLTQ1NiJ9",
    "hasMore": true,
    "total": 45,
    "limit": 20
  }
}
```

### Update Survey

```bash
curl -X PUT https://api.surveyverify.backofficepro.co.za/api/v1/surveys/survey-uuid-456 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Survey Title", "description": "Updated description"}'
```

**Response (200):**
```json
{
  "id": "survey-uuid-456",
  "title": "Updated Survey Title",
  "version": 2,
  "status": "DRAFT",
  "updatedAt": "2026-07-17T11:00:00Z"
}
```

### Delete Survey

```bash
curl -X DELETE https://api.surveyverify.backofficepro.co.za/api/v1/surveys/survey-uuid-456 \
  -H "Authorization: Bearer $TOKEN"
# Response: 204 No Content
```

### Publish Survey

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/surveys/survey-uuid-456/publish \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "id": "survey-uuid-456",
  "status": "PUBLISHED",
  "publishedAt": "2026-07-17T12:00:00Z"
}
```

### Submit Survey Response

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/surveys/survey-uuid-456/responses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "q1-uuid", "value": 8},
      {"questionId": "q2-uuid", "value": "Great service overall"},
      {"questionId": "q3-uuid", "value": "4"}
    ],
    "metadata": {
      "deviceType": "mobile",
      "os": "Android 14",
      "gpsData": {
        "latitude": -26.2041,
        "longitude": 28.0473,
        "accuracy": 15.0
      }
    }
  }'
```

**Response (201):**
```json
{
  "id": "response-uuid-789",
  "surveyId": "survey-uuid-456",
  "status": "SUBMITTED",
  "qualityScore": 0.92,
  "submittedAt": "2026-07-17T14:00:00Z"
}
```

---

## Verification Flow Examples

### Request Verification

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/verifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "surveyResponseId": "response-uuid-789",
    "priority": "HIGH"
  }'
```

**Response (201):**
```json
{
  "id": "verification-uuid-abc",
  "surveyResponseId": "response-uuid-789",
  "status": "PENDING",
  "priority": "HIGH",
  "createdAt": "2026-07-17T14:05:00Z"
}
```

### Get Verification Status

```bash
curl https://api.surveyverify.backofficepro.co.za/api/v1/verifications/verification-uuid-abc \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200) - In Progress:**
```json
{
  "id": "verification-uuid-abc",
  "status": "IN_PROGRESS",
  "steps": [
    {"id": "step-1", "type": "AUTOMATED_VALIDATION", "status": "COMPLETED"},
    {"id": "step-2", "type": "AI_ANALYSIS", "status": "IN_PROGRESS"},
    {"id": "step-3", "type": "GPS_VERIFICATION", "status": "PENDING"},
    {"id": "step-4", "type": "STATISTICAL_ANALYSIS", "status": "PENDING"},
    {"id": "step-5", "type": "HUMAN_REVIEW", "status": "PENDING"}
  ],
  "progress": 0.20
}
```

### Get Verification Result

```bash
curl https://api.surveyverify.backofficepro.co.za/api/v1/verifications/verification-uuid-abc/result \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200) - Complete:**
```json
{
  "verificationId": "verification-uuid-abc",
  "decision": "VERIFIED",
  "confidenceScore": 0.95,
  "fraudIndicators": [],
  "aiAnalysis": {
    "overallRisk": "LOW",
    "anomaliesDetected": 0,
    "responseConsistency": 0.97
  },
  "humanReview": {
    "reviewerId": "reviewer-uuid-001",
    "decision": "APPROVED",
    "reviewedAt": "2026-07-17T15:00:00Z"
  },
  "certificateId": "cert-uuid-xyz",
  "completedAt": "2026-07-17T15:00:00Z"
}
```

### Escalate Verification

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/verifications/verification-uuid-abc/escalate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Complex case requiring senior review",
    "escalatedTo": "senior-reviewer-uuid"
  }'
```

### Cancel Verification

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/verifications/verification-uuid-abc/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Duplicate submission detected"}'
```

---

## NFT Minting Examples

### Record Verification On-Chain

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "verification-uuid-abc",
    "network": "POLYGON",
    "metadata": {
      "surveyId": "survey-uuid-456",
      "respondentHash": "0xabc123...",
      "trustScore": 87.5,
      "verificationResult": "VERIFIED",
      "timestamp": "2026-07-17T15:00:00Z"
    }
  }'
```

**Response (201):**
```json
{
  "id": "onchain-uuid-001",
  "verificationId": "verification-uuid-abc",
  "transactionHash": "0xdef456...",
  "status": "PENDING",
  "estimatedConfirmationTime": 30,
  "createdAt": "2026-07-17T15:05:00Z"
}
```

### Check On-Chain Status

```bash
curl https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/verify/onchain-uuid-001 \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "id": "onchain-uuid-001",
  "status": "CONFIRMED",
  "blockNumber": 45678901,
  "gasUsed": 21000,
  "confirmedAt": "2026-07-17T15:05:35Z",
  "explorerUrl": "https://polygonscan.com/tx/0xdef456..."
}
```

### Mint NFT Certificate

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/nft/mint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "verification-uuid-abc",
    "recipientAddress": "0x9876543210fedcba9876543210fedcba98765432",
    "metadata": {
      "name": "Survey Verification Certificate #001",
      "description": "This NFT certifies the verification of survey response",
      "image": "https://api.surveyverify.backofficepro.co.za/nft/image/001.png",
      "attributes": [
        {"trait_type": "Survey Type", "value": "Customer Satisfaction"},
        {"trait_type": "Trust Score", "value": 87.5},
        {"trait_type": "Verification Level", "value": "Full"},
        {"trait_type": "Fraud Risk", "value": "Low"}
      ]
    }
  }'
```

**Response (201):**
```json
{
  "id": "nft-uuid-001",
  "tokenId": "1",
  "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "ownerAddress": "0x9876543210fedcba9876543210fedcba98765432",
  "status": "MINTING",
  "estimatedConfirmationTime": 60,
  "createdAt": "2026-07-17T15:10:00Z"
}
```

### Get NFT Certificate

```bash
curl https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/nft/nft-uuid-001 \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "id": "nft-uuid-001",
  "tokenId": "1",
  "status": "MINTED",
  "metadataUri": "ipfs://QmHash123456789",
  "mintedAt": "2026-07-17T15:11:00Z",
  "explorerUrl": "https://polygonscan.com/token/0xabcdef..."
}
```

### Transfer NFT

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/nft/nft-uuid-001/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toAddress": "0xnewowner1234567890abcdef1234567890abcdef",
    "reason": "Ownership transfer"
  }'
```

### Estimate Gas

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/blockchain/estimate-gas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation": "MINT_NFT", "network": "POLYGON"}'
```

**Response (200):**
```json
{
  "operation": "MINT_NFT",
  "estimatedGas": 150000,
  "estimatedCost": "0.0045",
  "currency": "MATIC"
}
```

---

## Webhook Handling Examples

### Stripe Payment Webhook

```bash
# Stripe sends POST to this endpoint automatically
# You test locally with Stripe CLI:

stripe trigger invoice.payment_succeeded

# Expected handler behavior:
# 1. Verify Stripe signature signature
# 2. Process event type
# 3. Update subscription status
# 4. Return 200 OK
```

**Webhook Payload:**
```json
{
  "id": "evt_3N2fKxLkdIwQg8WZ0xY",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_1N2fKxLkdIwQg8WZ",
      "customer": "cus_N3f8s92j",
      "subscription": "sub_8sHdj92k",
      "amount_paid": 9900,
      "currency": "zar",
      "status": "paid"
    }
  }
}
```

```bash
# Test webhook locally
curl -X POST http://localhost:8080/api/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=123|v1=test_sig|v0=" \
  -d '{"type":"invoice.payment_succeeded","data":{"object":{"id":"in_test","subscription":"sub_test","amount_paid":9900}}}'
```

### Verification Complete Webhook

The platform sends webhooks to your endpoint when verification completes.

```bash
# Configure your webhook URL in admin settings
PUT https://api.surveyverify.backofficepro.co.za/api/v1/admin/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/verification",
    "events": ["verification.completed", "verification.failed"],
    "secret": "your-webhook-secret"
  }'
```

**Verification Complete Event:**
```json
{
  "event": "verification.completed",
  "timestamp": "2026-07-17T15:00:00Z",
  "data": {
    "verificationId": "verification-uuid-abc",
    "surveyResponseId": "response-uuid-789",
    "surveyId": "survey-uuid-456",
    "decision": "VERIFIED",
    "confidenceScore": 0.95,
    "certificateId": "cert-uuid-xyz",
    "nftId": "nft-uuid-001"
  }
}
```

### Webhook Signature Verification

```typescript
// Node.js example
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}
```

### Webhook Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st | Immediate |
| 2nd | 10 seconds |
| 3rd | 1 minute |
| 4th | 10 minutes |
| 5th | 1 hour |

After 5 failed attempts, the webhook is disabled and an admin alert is triggered.

---

## Error Handling Patterns

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error",
        "rejectedValue": "bad-input"
      }
    ],
    "timestamp": "2026-07-17T10:00:00Z",
    "traceId": "abc-123-def-456"
  }
}
```

### Validation Error

```bash
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/surveys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

**Response (422):**
```json
{
  "error": {
    "code": "VAL_001",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required",
        "rejectedValue": ""
      },
      {
        "field": "questions",
        "message": "At least one question is required"
      }
    ]
  }
}
```

### Authentication Error

```json
{
  "error": {
    "code": "AUTH_002",
    "message": "Token has expired. Please refresh your token.",
    "timestamp": "2026-07-17T10:00:00Z",
    "traceId": "abc-123-def-456"
  }
}
```

### Authorization Error

```json
{
  "error": {
    "code": "AUTH_004",
    "message": "Insufficient permissions. Required role: org_admin",
    "timestamp": "2026-07-17T10:00:00Z",
    "traceId": "abc-123-def-456"
  }
}
```

### Business Logic Error

```json
{
  "error": {
    "code": "BIZ_001",
    "message": "Survey has already been published and cannot be modified",
    "details": [
      {
        "field": "surveyId",
        "message": "Survey has status PUBLISHED",
        "rejectedValue": "survey-uuid-456"
      }
    ]
  }
}
```

### Rate Limit Error

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

### Error Handling by Language

#### TypeScript/JavaScript

```typescript
async function createSurvey(data: SurveyCreateRequest): Promise<SurveyResponse> {
  try {
    const response = await api.post('/surveys', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      const { code, message, details } = error.response.data.error;
      
      switch (code) {
        case 'VAL_001':
          // Handle validation errors
          details.forEach(d => console.error(`${d.field}: ${d.message}`));
          break;
        case 'AUTH_002':
          // Refresh token and retry
          await refreshToken();
          return createSurvey(data);
        case 'RATE_LIMIT_EXCEEDED':
          // Wait and retry
          await sleep(error.response.data.error.retryAfter * 1000);
          return createSurvey(data);
        default:
          throw new ApiError(code, message);
      }
    }
    throw error;
  }
}
```

#### Python

```python
import requests
from requests.exceptions import RequestException

def create_survey(token, data):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/surveys',
            json=data,
            headers=headers
        )
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.HTTPError as e:
        error = e.response.json().get('error', {})
        code = error.get('code')
        
        if code == 'AUTH_002':
            # Refresh token
            token = refresh_token()
            return create_survey(token, data)
        elif code == 'RATE_LIMIT_EXCEEDED':
            retry_after = error.get('retryAfter', 30)
            time.sleep(retry_after)
            return create_survey(token, data)
        else:
            raise ApiError(code, error.get('message'))
```

#### Java

```java
public SurveyResponse createSurvey(CreateSurveyRequest request) {
    try {
        ResponseEntity<SurveyResponse> response = restTemplate.postForEntity(
            "/api/v1/surveys", request, SurveyResponse.class);
        return response.getBody();
        
    } catch (HttpClientErrorException e) {
        ErrorResponse error = objectMapper.readValue(
            e.getResponseBodyAsString(), ErrorResponse.class);
            
        switch (error.getCode()) {
            case "AUTH_002":
                // Refresh token
                refreshToken();
                return createSurvey(request);
            case "RATE_LIMIT_EXCEEDED":
                // Wait
                Thread.sleep(error.getRetryAfter() * 1000L);
                return createSurvey(request);
            default:
                throw new ApiException(error);
        }
    }
}
```

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
