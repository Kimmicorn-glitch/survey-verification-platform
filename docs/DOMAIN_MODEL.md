# Domain Model

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Bounded Contexts](#bounded-contexts)
- [Aggregates and Aggregate Roots](#aggregates-and-aggregate-roots)
- [Value Objects](#value-objects)
- [Domain Events](#domain-events)
- [Relationships Between Contexts](#relationships-between-contexts)
- [Domain Model Diagrams](#domain-model-diagrams)

---

## Bounded Contexts

### 1. User Context

The User Context manages all aspects of user identity, authentication, authorization, and consent management.

#### Entities

**User (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│               User                       │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - email: Email                          │
│ - firstName: String                     │
│ - lastName: String                      │
│ - phoneNumber: PhoneNumber              │
│ - status: UserStatus                    │
│ - mfaEnabled: boolean                   │
│ - createdAt: Instant                    │
│ - updatedAt: Instant                    │
│ - lastLoginAt: Instant                  │
│ - failedLoginAttempts: int              │
│ - lockedUntil: Instant                  │
├─────────────────────────────────────────┤
│ - register(): void                      │
│ - enableMfa(): MfaSetup                 │
│ - verifyMfa(code): boolean              │
│ - lock(): void                          │
│ - unlock(): void                        │
│ - updateProfile(info): void             │
│ - changePassword(old, new): void        │
│ - deactivate(): void                    │
└─────────────────────────────────────────┘
```

**Organization (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│            Organization                  │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: OrganizationName                │
│ - registrationNumber: String            │
│ - type: OrganizationType                │
│ - status: OrganizationStatus            │
│ - industry: Industry                    │
│ - contactEmail: Email                   │
│ - contactPhone: PhoneNumber             │
│ - address: Address                      │
│ - createdAt: Instant                    │
│ - updatedAt: Instant                    │
├─────────────────────────────────────────┤
│ - addMember(user, role): Membership     │
│ - removeMember(userId): void            │
│ - updateMemberRole(userId, role): void  │
│ - suspend(): void                       │
│ - reactivate(): void                    │
└─────────────────────────────────────────┘
```

**Role (Entity)**
```
┌─────────────────────────────────────────┐
│               Role                       │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: RoleName                        │
│ - description: String                   │
│ - permissions: Set<Permission>          │
│ - isSystemRole: boolean                 │
├─────────────────────────────────────────┤
│ - addPermission(permission): void       │
│ - removePermission(permissionId): void  │
│ - hasPermission(permission): boolean    │
└─────────────────────────────────────────┘
```

**Consent (Entity)**
```
┌─────────────────────────────────────────┐
│              Consent                     │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - userId: UUID                          │
│ - consentType: ConsentType              │
│ - purpose: String                       │
│ - granted: boolean                      │
│ - grantedAt: Instant                    │
│ - expiresAt: Instant                    │
│ - revokedAt: Instant                    │
│ - ipAddress: String                     │
│ - userAgent: String                     │
├─────────────────────────────────────────┤
│ - grant(): void                         │
│ - revoke(): void                        │
│ - isExpired(): boolean                  │
│ - isActive(): boolean                   │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum UserStatus {
    Active,
    Inactive,
    Suspended,
    PendingVerification,
    Locked,
}

enum OrganizationType {
    Corporate,
    Government,
    Academic,
    NonProfit,
    Individual,
}

enum ConsentType {
    DataProcessing,
    Marketing,
    Analytics,
    ThirdPartySharing,
    AiProcessing,
    BlockchainRecording,
}
```

---

### 2. Survey Context

The Survey Context manages the complete lifecycle of surveys, from design to distribution and response collection.

#### Entities

**Survey (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│               Survey                     │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - title: SurveyTitle                    │
│ - description: String                   │
│ - version: int                          │
│ - status: SurveyStatus                  │
│ - createdBy: UUID                       │
│ - organizationId: UUID                  │
│ - questions: List<Question>             │
│ - settings: SurveySettings              │
│ - distribution: DistributionConfig      │
│ - createdAt: Instant                    │
│ - updatedAt: Instant                    │
│ - publishedAt: Instant                  │
│ - closedAt: Instant                     │
├─────────────────────────────────────────┤
│ - addQuestion(question): void           │
│ - removeQuestion(questionId): void      │
│ - reorderQuestions(order): void         │
│ - publish(): void                       │
│ - close(): void                         │
│ - archive(): void                       │
│ - createVersion(): Survey               │
│ - canDistribute(): boolean              │
│ - responseCount(): int                  │
│ - completionRate(): double              │
└─────────────────────────────────────────┘
```

**Question (Entity)**
```
┌─────────────────────────────────────────┐
│              Question                    │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - surveyId: UUID                        │
│ - text: String                          │
│ - type: QuestionType                    │
│ - required: boolean                     │
│ - order: int                            │
│ - options: List<Option>                 │
│ - validation: ValidationRule            │
│ - conditionalLogic: ConditionalLogic    │
│ - metadata: Map<String, Object>         │
├─────────────────────────────────────────┤
│ - addOption(option): void               │
│ - removeOption(optionId): void          │
│ - setValidation(rule): void             │
│ - setCondition(condition): void         │
│ - validate(response): ValidationResult  │
└─────────────────────────────────────────┘
```

**SurveyResponse (Entity)**
```
┌─────────────────────────────────────────┐
│           SurveyResponse                 │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - surveyId: UUID                        │
│ - respondentId: UUID                    │
│ - answers: List<Answer>                 │
│ - status: ResponseStatus                │
│ - metadata: ResponseMetadata            │
│ - submittedAt: Instant                  │
│ - verifiedAt: Instant                   │
│ - verificationId: UUID                  │
├─────────────────────────────────────────┤
│ - addAnswer(answer): void               │
│ - submit(): void                        │
│ - verify(verificationId): void          │
│ - reject(reason): void                  │
│ - isComplete(): boolean                 │
│ - qualityScore(): double                │
└─────────────────────────────────────────┘
```

**Answer (Value Object)**
```
┌─────────────────────────────────────────┐
│              Answer                      │
├─────────────────────────────────────────┤
│ - questionId: UUID                      │
│ - value: Object                         │
│ - answeredAt: Instant                   │
│ - timeSpent: Duration                   │
│ - changeHistory: List<Change>           │
├─────────────────────────────────────────┤
│ - isValid(): boolean                    │
│ - hasBeenChanged(): boolean             │
│ - totalTimeSpent(): Duration            │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum SurveyStatus {
    Draft,
    InReview,
    Published,
    Active,
    Paused,
    Closed,
    Archived,
}

enum QuestionType {
    SingleChoice,
    MultipleChoice,
    FreeText,
    Numeric,
    Date,
    Scale,
    Matrix,
    Ranking,
    FileUpload,
    Location,
}

enum ResponseStatus {
    InProgress,
    Submitted,
    UnderReview,
    Verified,
    Rejected,
    Flagged,
}
```

---

### 3. Verification Context

The Verification Context orchestrates the verification process for submitted surveys.

#### Entities

**VerificationRequest (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│         VerificationRequest              │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - surveyResponseId: UUID                │
│ - requestedBy: UUID                     │
│ - priority: Priority                    │
│ - status: VerificationStatus            │
│ - steps: List<VerificationStep>         │
│ - currentStepIndex: int                 │
│ - result: VerificationResult            │
│ - createdAt: Instant                    │
│ - completedAt: Instant                  │
│ - deadline: Instant                     │
├─────────────────────────────────────────┤
│ - start(): void                         │
│ - advanceStep(): void                   │
│ - complete(result): void                │
│ - reject(reason): void                  │
│ - escalate(reason): void                │
│ - assignReviewer(userId): void          │
│ - isOverdue(): boolean                  │
│ - progress(): double                    │
└─────────────────────────────────────────┘
```

**VerificationStep (Entity)**
```
┌─────────────────────────────────────────┐
│          VerificationStep                │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - type: VerificationStepType            │
│ - status: StepStatus                    │
│ - assignedTo: UUID                      │
│ - config: StepConfig                    │
│ - result: StepResult                    │
│ - startedAt: Instant                    │
│ - completedAt: Instant                  │
├─────────────────────────────────────────┤
│ - start(): void                         │
│ - complete(result): void                │
│ - fail(reason): void                    │
│ - skip(reason): void                    │
│ - duration(): Duration                  │
└─────────────────────────────────────────┘
```

**VerificationResult (Value Object)**
```
┌─────────────────────────────────────────┐
│          VerificationResult              │
├─────────────────────────────────────────┤
│ - decision: VerificationDecision        │
│ - confidenceScore: double               │
│ - fraudIndicators: List<FraudIndicator> │
│ - aiAnalysis: AIAnalysisResult          │
│ - humanReview: HumanReviewResult        │
│ - certificateId: UUID                   │
│ - summary: String                       │
│ - completedAt: Instant                  │
├─────────────────────────────────────────┤
│ - isVerified(): boolean                 │
│ - hasFraudIndicators(): boolean         │
│ - overallRisk(): RiskLevel              │
└─────────────────────────────────────────┘
```

**FraudIndicator (Value Object)**
```
┌─────────────────────────────────────────┐
│          FraudIndicator                  │
├─────────────────────────────────────────┤
│ - type: FraudType                       │
│ - severity: Severity                    │
│ - description: String                   │
│ - evidence: List<Evidence>              │
│ - confidence: double                    │
│ - detectedAt: Instant                   │
│ - source: DetectionSource               │
├─────────────────────────────────────────┤
│ - isCritical(): boolean                 │
│ - requiresAction(): boolean             │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum VerificationStatus {
    Pending,
    InProgress,
    AwaitingHumanReview,
    Completed,
    Rejected,
    Escalated,
    Cancelled,
}

enum VerificationStepType {
    AutomatedValidation,
    AiAnalysis,
    GpsVerification,
    StatisticalAnalysis,
    HumanReview,
    ManagerApproval,
    ExternalVerification,
}

enum VerificationDecision {
    Verified,
    Rejected,
    ConditionallyVerified,
    RequiresMoreInformation,
}

enum FraudType {
    GpsSpoofing,
    ResponsePatternAnomaly,
    StatisticalOutlier,
    IdentityMismatch,
    TimingAnomaly,
    ContentSimilarity,
    DeviceFingerprint,
    IpAnomaly,
}
```

---

### 4. Trust Context

The Trust Context manages trust score calculation and management.

#### Entities

**TrustScore (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│             TrustScore                   │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - entityId: UUID                        │
│ - entityType: TrustEntityType           │
│ - score: double                         │
│ - previousScore: double                 │
│ - factors: List<TrustFactor>            │
│ - calculatedAt: Instant                 │
│ - validUntil: Instant                   │
│ - version: int                          │
├─────────────────────────────────────────┤
│ - calculate(): double                   │
│ - applyDecay(): double                  │
│ - addFactor(factor): void               │
│ - removeFactor(factorId): void          │
│ - compareTo(other): int                 │
│ - isExpired(): boolean                  │
│ - trend(): ScoreTrend                   │
└─────────────────────────────────────────┘
```

**TrustFactor (Entity)**
```
┌─────────────────────────────────────────┐
│             TrustFactor                  │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: String                          │
│ - category: FactorCategory              │
│ - weight: double                        │
│ - value: double                         │
│ - rawValue: Object                      │
│ - confidence: double                    │
│ - lastCalculated: Instant               │
│ - history: List<FactorHistory>          │
├─────────────────────────────────────────┤
│ - calculateValue(data): double          │
│ - applyWeight(score): double            │
│ - getContribution(): double             │
│ - update(rawValue): void                │
└─────────────────────────────────────────┘
```

**ScoreRule (Entity)**
```
┌─────────────────────────────────────────┐
│              ScoreRule                   │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: String                          │
│ - description: String                   │
│ - formula: String                       │
│ - parameters: Map<String, Double>       │
│ - effectiveFrom: Instant                │
│ - effectiveUntil: Instant               │
│ - isActive: boolean                     │
├─────────────────────────────────────────┤
│ - evaluate(context): double             │
│ - isValid(): boolean                    │
│ - deactivate(): void                    │
└─────────────────────────────────────────┘
```

#### Value Objects

**ScoreRange**
```
┌─────────────────────────────────────────┐
│             ScoreRange                   │
├─────────────────────────────────────────┤
│ - minimum: double                       │
│ - maximum: double                       │
│ - label: String                         │
│ - color: String                         │
├─────────────────────────────────────────┤
│ - contains(score): boolean              │
│ - normalize(score): double              │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum TrustEntityType {
    User,
    Organization,
    SurveyResponse,
    VerificationProcess,
}

enum FactorCategory {
    Identity,
    Behavior,
    History,
    Network,
    Performance,
    Compliance,
}

enum ScoreTrend {
    Improving,
    Stable,
    Declining,
    Volatile,
}
```

---

### 5. Blockchain Context

The Blockchain Context manages on-chain verification records and NFT operations.

#### Entities

**OnChainVerification (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│        OnChainVerification               │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - verificationId: UUID                  │
│ - transactionHash: String               │
│ - blockNumber: long                     │
│ - contractAddress: String               │
│ - networkId: int                        │
│ - status: ChainStatus                   │
│ - data: VerificationData                │
│ - gasUsed: long                         │
│ - gasPrice: BigInteger                  │
│ - createdAt: Instant                    │
│ - confirmedAt: Instant                  │
├─────────────────────────────────────────┤
│ - submit(): TransactionRequest          │
│ - confirm(txHash): void                 │
│ - fail(reason): void                    │
│ - isConfirmed(): boolean                │
│ - getExplorerUrl(): String              │
└─────────────────────────────────────────┘
```

**NFTCertificate (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│          NFTCertificate                  │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - tokenId: BigInteger                   │
│ - contractAddress: String               │
│ - ownerAddress: String                  │
│ - verificationId: UUID                  │
│ - metadataUri: String                   │
│ - metadata: CertificateMetadata         │
│ - mintedAt: Instant                     │
│ - status: NFTStatus                     │
├─────────────────────────────────────────┤
│ - mint(recipientAddress): TxRequest     │
│ - transfer(toAddress): TxRequest        │
│ - burn(): TxRequest                     │
│ - getMetadata(): CertificateMetadata    │
│ - verifyOwnership(): boolean            │
│ - getOpenSeaUrl(): String               │
└─────────────────────────────────────────┘
```

**SmartContract (Entity)**
```
┌─────────────────────────────────────────┐
│          SmartContract                   │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: String                          │
│ - address: String                       │
│ - networkId: int                        │
│ - abi: String                           │
│ - bytecode: String                      │
│ - deployedAt: Instant                   │
│ - deployedBy: UUID                      │
│ - version: String                       │
│ - isVerified: boolean                   │
├─────────────────────────────────────────┤
│ - deploy(params): DeploymentRequest     │
│ - getFunction(name): Function           │
│ - estimateGas(method, args): long       │
│ - getSourceCode(): String               │
└─────────────────────────────────────────┘
```

#### Value Objects

**CertificateMetadata**
```
┌─────────────────────────────────────────┐
│        CertificateMetadata               │
├─────────────────────────────────────────┤
│ - name: String                          │
│ - description: String                   │
│ - image: String                         │
│ - externalUrl: String                   │
│ - attributes: List<Trait>               │
│ - verificationData: VerificationData    │
│ - issuedDate: Instant                   │
│ - expiryDate: Instant                   │
├─────────────────────────────────────────┤
│ - toJson(): String                      │
│ - toIpfsUri(): String                   │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum ChainStatus {
    Pending,
    Submitted,
    Confirmed,
    Failed,
    Reverted,
}

enum NFTStatus {
    Minting,
    Minted,
    Transferred,
    Burned,
}

enum BlockchainNetwork {
    Ethereum,
    Polygon,
    Bsc,
    Arbitrum,
}
```

---

### 6. Analytics Context

The Analytics Context provides reporting, dashboards, and real-time insights.

#### Entities

**Dashboard (Aggregate Root)**
```
┌─────────────────────────────────────────┐
│              Dashboard                   │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: String                          │
│ - description: String                   │
│ - ownerId: UUID                         │
│ - organizationId: UUID                  │
│ - widgets: List<Widget>                 │
│ - layout: DashboardLayout               │
│ - isDefault: boolean                    │
│ - refreshInterval: Duration             │
│ - createdAt: Instant                    │
│ - updatedAt: Instant                    │
├─────────────────────────────────────────┤
│ - addWidget(widget): void               │
│ - removeWidget(widgetId): void          │
│ - updateLayout(layout): void            │
│ - refresh(): DashboardData              │
│ - share(userId): void                   │
│ - clone(): Dashboard                    │
└─────────────────────────────────────────┘
```

**Widget (Entity)**
```
┌─────────────────────────────────────────┐
│               Widget                     │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - type: WidgetType                      │
│ - title: String                         │
│ - query: AnalyticsQuery                 │
│ - visualization: VisualizationConfig    │
│ - position: WidgetPosition              │
│ - size: WidgetSize                      │
│ - refreshInterval: Duration             │
├─────────────────────────────────────────┤
│ - getData(): WidgetData                 │
│ - updateQuery(query): void              │
│ - resize(size): void                    │
│ - move(position): void                  │
└─────────────────────────────────────────┘
```

**Report (Entity)**
```
┌─────────────────────────────────────────┐
│               Report                     │
├─────────────────────────────────────────┤
│ - id: UUID                              │
│ - name: String                          │
│ - type: ReportType                      │
│ - schedule: ReportSchedule              │
│ - parameters: ReportParameters          │
│ - recipients: List<Email>               │
│ - format: ReportFormat                  │
│ - lastGenerated: Instant                │
│ - nextScheduled: Instant                │
├─────────────────────────────────────────┤
│ - generate(): ReportResult              │
│ - scheduleNext(): void                  │
│ - cancel(): void                        │
│ - export(format): File                  │
└─────────────────────────────────────────┘
```

#### Value Objects

**AnalyticsQuery**
```
┌─────────────────────────────────────────┐
│          AnalyticsQuery                  │
├─────────────────────────────────────────┤
│ - metrics: List<Metric>                 │
│ - dimensions: List<Dimension>           │
│ - filters: List<Filter>                 │
│ - timeRange: TimeRange                  │
│ - granularity: Granularity              │
├─────────────────────────────────────────┤
│ - execute(): QueryResult                │
│ - explain(): String                     │
│ - optimize(): AnalyticsQuery            │
└─────────────────────────────────────────┘
```

#### Enums

```rust
enum WidgetType {
    LineChart,
    BarChart,
    PieChart,
    Gauge,
    Table,
    Heatmap,
    Funnel,
    Kpi,
    Map,
}

enum ReportType {
    VerificationSummary,
    FraudDetection,
    TrustScoreDistribution,
    UserActivity,
    SystemPerformance,
    ComplianceAudit,
    Custom,
}

enum Granularity {
    Minute,
    Hour,
    Day,
    Week,
    Month,
    Quarter,
    Year,
}
```

---

## Value Objects

### Common Value Objects

**Email**
```
┌─────────────────────────────────────────┐
│               Email                      │
├─────────────────────────────────────────┤
│ - value: String                         │
├─────────────────────────────────────────┤
│ - validate(): boolean                   │
│ - domain(): String                      │
│ - mask(): String                        │
│ - equals(other): boolean                │
│ - hashCode(): int                       │
└─────────────────────────────────────────┘
```

**PhoneNumber**
```
┌─────────────────────────────────────────┐
│            PhoneNumber                   │
├─────────────────────────────────────────┤
│ - countryCode: String                   │
│ - nationalNumber: String                │
│ - formatted: String                     │
├─────────────────────────────────────────┤
│ - validate(): boolean                   │
│ - toE164(): String                      │
│ - equals(other): boolean                │
└─────────────────────────────────────────┘
```

**Address**
```
┌─────────────────────────────────────────┐
│              Address                     │
├─────────────────────────────────────────┤
│ - street: String                        │
│ - city: String                          │
│ - province: String                      │
│ - postalCode: String                    │
│ - country: String                       │
│ - coordinates: GeoCoordinates           │
├─────────────────────────────────────────┤
│ - format(): String                      │
│ - equals(other): boolean                │
│ - distanceTo(other): Distance           │
└─────────────────────────────────────────┘
```

**GeoCoordinates**
```
┌─────────────────────────────────────────┐
│          GeoCoordinates                  │
├─────────────────────────────────────────┤
│ - latitude: double                      │
│ - longitude: double                     │
│ - altitude: double                      │
│ - accuracy: double                      │
├─────────────────────────────────────────┤
│ - validate(): boolean                   │
│ - distanceTo(other): Distance           │
│ - toWkt(): String                       │
│ - equals(other): boolean                │
└─────────────────────────────────────────┘
```

**Money**
```
┌─────────────────────────────────────────┐
│               Money                      │
├─────────────────────────────────────────┤
│ - amount: BigDecimal                    │
│ - currency: Currency                    │
├─────────────────────────────────────────┤
│ - add(other): Money                     │
│ - subtract(other): Money                │
│ - multiply(factor): Money               │
│ - convertTo(target): Money              │
│ - equals(other): boolean                │
│ - compareTo(other): int                 │
└─────────────────────────────────────────┘
```

**DateRange**
```
┌─────────────────────────────────────────┐
│             DateRange                    │
├─────────────────────────────────────────┤
│ - start: Instant                        │
│ - end: Instant                          │
├─────────────────────────────────────────┤
│ - contains(date): boolean               │
│ - overlaps(other): boolean              │
│ - duration(): Duration                  │
│ - expand(days): DateRange               │
│ - equals(other): boolean                │
└─────────────────────────────────────────┘
```

---

## Domain Events

### User Context Events

| Event | Description | Payload |
|-------|-------------|---------|
| UserRegistered | New user account created | userId, email, organizationId |
| UserVerified | User email verified | userId, verifiedAt |
| UserAuthenticated | User logged in | userId, sessionId, ipAddress |
| UserLocked | Account locked due to failures | userId, lockedUntil, reason |
| UserDeactivated | User account deactivated | userId, reason |
| MfaEnabled | Multi-factor authentication enabled | userId, method |
| MfaDisabled | Multi-factor authentication disabled | userId, reason |
| ConsentGranted | User granted consent | userId, consentType, purpose |
| ConsentRevoked | User revoked consent | userId, consentType, reason |

### Survey Context Events

| Event | Description | Payload |
|-------|-------------|---------|
| SurveyCreated | New survey created | surveyId, createdBy, organizationId |
| SurveyPublished | Survey made available | surveyId, publishedAt |
| SurveyClosed | Survey response collection ended | surveyId, closedAt, responseCount |
| SurveyArchived | Survey archived | surveyId, archivedAt |
| SurveyResponseSubmitted | Response received | responseId, surveyId, respondentId |
| SurveyResponseComplete | All questions answered | responseId, completionTime |
| SurveyTemplateCreated | Template saved | templateId, createdBy |

### Verification Context Events

| Event | Description | Payload |
|-------|-------------|---------|
| VerificationRequested | Verification submitted | verificationId, responseId, requestedBy |
| VerificationStarted | Verification process began | verificationId, startedAt |
| VerificationStepCompleted | Step finished | verificationId, stepId, result |
| VerificationCompleted | Verification finished | verificationId, decision, result |
| VerificationRejected | Verification failed | verificationId, reason, indicators |
| VerificationEscalated | Sent to higher authority | verificationId, escalatedTo, reason |
| FraudDetected | Fraud indicators found | verificationId, indicators, severity |

### Trust Context Events

| Event | Description | Payload |
|-------|-------------|---------|
| TrustScoreCalculated | Score computed | entityId, score, factors |
| TrustScoreChanged | Score updated | entityId, previousScore, newScore, reason |
| TrustFactorAdded | New factor incorporated | factorId, entityId, weight |
| TrustFactorRemoved | Factor removed | factorId, entityId, reason |
| ScoreRuleUpdated | Scoring rules changed | ruleId, changes |
| ScoreThresholdBreached | Score crossed threshold | entityId, threshold, direction |

### Blockchain Context Events

| Event | Description | Payload |
|-------|-------------|---------|
| VerificationRecorded | Record submitted to chain | verificationId, txHash, network |
| VerificationConfirmed | Transaction confirmed | verificationId, blockNumber, gasUsed |
| VerificationFailed | Transaction failed | verificationId, reason, gasUsed |
| NFTMinted | Certificate NFT created | nftId, tokenId, ownerAddress |
| NFTTransferred | NFT ownership changed | nftId, fromAddress, toAddress |
| NFTBurned | NFT destroyed | nftId, burnedAt |

---

## Relationships Between Contexts

### Context Interactions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONTEXT INTERACTION MAP                            │
│                                                                         │
│  User Context ──────▶ Survey Context                                    │
│  (Owner creates surveys, Respondents answer)                           │
│                                                                         │
│  Survey Context ────▶ Verification Context                              │
│  (Responses submitted for verification)                                 │
│                                                                         │
│  Verification Context ──▶ Trust Context                                 │
│  (Results affect trust scores)                                          │
│                                                                         │
│  Trust Context ────▶ Blockchain Context                                 │
│  (Scores recorded on-chain for transparency)                           │
│                                                                         │
│  Verification Context ──▶ Blockchain Context                            │
│  (Verification proofs stored on-chain)                                  │
│                                                                         │
│  Analytics Context ◀─── All Contexts                                    │
│  (Consumes events from all contexts for reporting)                     │
│                                                                         │
│  User Context ──────▶ Trust Context                                     │
│  (User actions affect their trust score)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Anti-Corruption Layers

Each bounded context communicates through well-defined interfaces, using anti-corruption layers to prevent domain model leakage:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Survey     │     │   ACL:       │     │ Verification │
│   Context    │────▶│  Verification│────▶│   Context    │
│              │     │  Translator  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                    Translates:
                    - SurveyResponse → VerificationRequest
                    - SurveyMetadata → VerificationContext
```

---

## Domain Model Diagrams

### Survey Aggregate

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SURVEY AGGREGATE                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Survey (Aggregate Root)                     │    │
│  │  id, title, description, version, status, settings             │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                      │
│                    ┌─────────────┼─────────────┐                        │
│                    │             │             │                         │
│         ┌──────────▼──┐  ┌──────▼──────┐  ┌───▼──────────┐            │
│         │  Question    │  │  Survey     │  │ Distribution │            │
│         │  (Entity)    │  │  Settings   │  │ Config       │            │
│         │              │  │ (Value Obj) │  │ (Value Obj)  │            │
│         └──────┬───────┘  └─────────────┘  └──────────────┘            │
│                │                                                        │
│         ┌──────▼───────┐                                               │
│         │  Option      │                                               │
│         │  (Entity)    │                                               │
│         └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Verification Aggregate

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION AGGREGATE                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              VerificationRequest (Aggregate Root)               │    │
│  │  id, surveyResponseId, status, priority, deadline              │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                      │
│                    ┌─────────────┼─────────────┐                        │
│                    │             │             │                         │
│         ┌──────────▼──┐  ┌──────▼──────┐  ┌───▼──────────┐            │
│         │ Verification│  │ Verification│  │ Verification │            │
│         │ Step        │  │ Step        │  │ Step         │            │
│         │ (Entity)    │  │ (Entity)    │  │ (Entity)     │            │
│         └─────────────┘  └─────────────┘  └──────────────┘            │
│                                                                         │
│                    ┌─────────────▼─────────────┐                        │
│                    │   VerificationResult      │                        │
│                    │   (Value Object)          │                        │
│                    │   decision, confidence,   │                        │
│                    │   fraudIndicators         │                        │
│                    └───────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Trust Score Aggregate

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TRUST SCORE AGGREGATE                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                TrustScore (Aggregate Root)                      │    │
│  │  id, entityId, entityType, score, previousScore, validUntil    │    │
│  └───────────────────────────────┬─────────────────────────────────┘    │
│                                  │                                      │
│                    ┌─────────────┼─────────────┐                        │
│                    │             │             │                         │
│         ┌──────────▼──┐  ┌──────▼──────┐  ┌───▼──────────┐            │
│         │  Trust      │  │  Trust      │  │  Score       │            │
│         │  Factor     │  │  Factor     │  │  Rule        │            │
│         │  (Entity)   │  │  (Entity)   │  │  (Entity)    │            │
│         │             │  │             │  │              │            │
│         │  identity   │  │  behavior   │  │  weighted    │            │
│         │  weight:0.2 │  │  weight:0.3 │  │  average     │            │
│         └─────────────┘  └─────────────┘  └──────────────┘            │
│                                                                         │
│                    ┌─────────────▼─────────────┐                        │
│                    │   ScoreRange               │                        │
│                    │   (Value Object)           │                        │
│                    │   min, max, label, color   │                        │
│                    └───────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
