# Java Backend Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Spring Boot Architecture](#spring-boot-architecture)
- [DDD Implementation](#ddd-implementation)
- [CQRS Patterns](#cqrs-patterns)
- [Security Configuration](#security-configuration)
- [Database Migrations](#database-migrations)
- [Caching Strategy](#caching-strategy)

---

## Spring Boot Architecture

### Module Structure

```
survey-verify-backend/
├── survey-verify-common/          # Shared utilities and DTOs
├── survey-verify-user/            # User bounded context
├── survey-verify-survey/          # Survey bounded context
├── survey-verify-verification/    # Verification bounded context
├── survey-verify-trust/           # Trust score bounded context
├── survey-verify-blockchain/      # Blockchain bounded context
├── survey-verify-analytics/       # Analytics bounded context
├── survey-verify-gateway/         # API Gateway
└── survey-verify-shared-events/   # Event definitions
```

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Java | OpenJDK | 17 |
| Framework | Spring Boot | 3.2.x |
| Security | Spring Security | 6.2.x |
| Data Access | Spring Data JPA / Hibernate | 6.4.x |
| Validation | Bean Validation / Hibernate Validator | 3.0.x |
| Messaging | Spring Kafka | 3.1.x |
| Cache | Spring Data Redis | 3.2.x |
| Documentation | SpringDoc OpenAPI | 2.3.x |
| Resilience | Resilience4j | 2.2.x |
| Mapping | MapStruct | 1.5.x |

### Package Structure (Per Service)

```
src/main/java/za/co/backofficepro/surveyverify/
├── config/                  # Configuration classes
│   ├── SecurityConfig.java
│   ├── KafkaConfig.java
│   ├── RedisConfig.java
│   └── SwaggerConfig.java
├── domain/                  # Domain model
│   ├── model/
│   │   ├── aggregate/       # Aggregate roots
│   │   ├── entity/          # Entities
│   │   ├── valueobject/     # Value objects
│   │   └── event/           # Domain events
│   ├── repository/          # Repository interfaces
│   ├── service/             # Domain services
│   └── exception/           # Domain exceptions
├── application/             # Application services
│   ├── command/             # Command handlers
│   ├── query/               # Query handlers
│   └── dto/                 # Data transfer objects
├── infrastructure/          # Infrastructure adapters
│   ├── persistence/         # JPA repositories
│   ├── messaging/           # Kafka producers/consumers
│   ├── cache/               # Redis repositories
│   ├── external/            # External service clients
│   └── config/              # Infrastructure configs
└── interfaces/              # Interface adapters
    ├── rest/                # REST controllers
    ├── graphql/             # GraphQL resolvers
    └── grpc/                # gRPC services
```

---

## DDD Implementation

### Aggregate Root Example

```java
@Entity
@Table(name = "surveys")
public class Survey extends AggregateRoot {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Embedded
    private SurveyTitle title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Version
    private Long version;
    
    @Enumerated(EnumType.STRING)
    private SurveyStatus status;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id")
    @OrderBy("order ASC")
    private List<Question> questions = new ArrayList<>();
    
    @Embedded
    private SurveySettings settings;
    
    @Embedded
    private DistributionConfig distribution;
    
    private UUID createdBy;
    private UUID organizationId;
    
    @Column(name = "created_at")
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @Column(name = "published_at")
    private Instant publishedAt;
    
    @Column(name = "closed_at")
    private Instant closedAt;
    
    // Domain methods
    
    public void publish() {
        if (this.status != SurveyStatus.IN_REVIEW) {
            throw new SurveyCannotBePublishedException(this.id, this.status);
        }
        if (this.questions.isEmpty()) {
            throw new SurveyHasNoQuestionsException(this.id);
        }
        
        this.status = SurveyStatus.PUBLISHED;
        this.publishedAt = Instant.now();
        
        registerEvent(new SurveyPublishedEvent(this.id, this.createdBy, this.organizationId));
    }
    
    public void addQuestion(Question question) {
        if (this.status != SurveyStatus.DRAFT) {
            throw new SurveyNotEditableException(this.id);
        }
        
        question.setOrder(this.questions.size() + 1);
        this.questions.add(question);
        this.updatedAt = Instant.now();
    }
    
    public void close() {
        if (this.status != SurveyStatus.ACTIVE && this.status != SurveyStatus.PUBLISHED) {
            throw new SurveyCannotBeClosedException(this.id, this.status);
        }
        
        this.status = SurveyStatus.CLOSED;
        this.closedAt = Instant.now();
        
        registerEvent(new SurveyClosedEvent(this.id, responseCount()));
    }
    
    public int responseCount() {
        // Query via repository - not stored in aggregate
        return 0; // Simplified
    }
}
```

### Value Objects

```java
@Embeddable
public class SurveyTitle {
    
    @Column(name = "title")
    private String value;
    
    protected SurveyTitle() {}
    
    public SurveyTitle(String value) {
        if (value == null || value.isBlank()) {
            throw new InvalidSurveyTitleException("Title cannot be empty");
        }
        if (value.length() > 200) {
            throw new InvalidSurveyTitleException("Title cannot exceed 200 characters");
        }
        this.value = value;
    }
    
    public String value() { return value; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SurveyTitle that)) return false;
        return Objects.equals(value, that.value);
    }
    
    @Override
    public int hashCode() { return Objects.hash(value); }
}
```

### Domain Events

```java
public abstract class DomainEvent {
    private final UUID eventId;
    private final Instant occurredOn;
    private final String eventType;
    
    protected DomainEvent(String eventType) {
        this.eventId = UUID.randomUUID();
        this.occurredOn = Instant.now();
        this.eventType = eventType;
    }
    
    // Getters
}

public class SurveyPublishedEvent extends DomainEvent {
    private final UUID surveyId;
    private final UUID publishedBy;
    private final UUID organizationId;
    
    public SurveyPublishedEvent(UUID surveyId, UUID publishedBy, UUID organizationId) {
        super("SurveyPublished");
        this.surveyId = surveyId;
        this.publishedBy = publishedBy;
        this.organizationId = organizationId;
    }
    
    // Getters
}
```

### Repository Pattern

```java
@Repository
public interface SurveyRepository extends JpaRepository<Survey, UUID> {
    
    Optional<Survey> findByIdAndOrganizationId(UUID id, UUID organizationId);
    
    Page<Survey> findByOrganizationIdAndStatus(UUID organizationId, SurveyStatus status, Pageable pageable);
    
    @Query("SELECT s FROM Survey s WHERE s.status = 'PUBLISHED' AND s.publishedAt < :cutoffDate")
    List<Survey> findStalePublishedSurveys(@Param("cutoffDate") Instant cutoffDate);
    
    @Modifying
    @Query("UPDATE Survey s SET s.status = 'ARCHIVED' WHERE s.closedAt < :cutoffDate")
    int archiveOldSurveys(@Param("cutoffDate") Instant cutoffDate);
}
```

---

## CQRS Patterns

### Command Side

```java
@Service
@Transactional
public class CreateSurveyCommandHandler {
    
    private final SurveyRepository surveyRepository;
    private final SurveyMapper surveyMapper;
    private final ApplicationEventPublisher eventPublisher;
    
    public CreateSurveyCommandHandler(
            SurveyRepository surveyRepository,
            SurveyMapper surveyMapper,
            ApplicationEventPublisher eventPublisher) {
        this.surveyRepository = surveyRepository;
        this.surveyMapper = surveyMapper;
        this.eventPublisher = eventPublisher;
    }
    
    public UUID handle(CreateSurveyCommand command) {
        Survey survey = SurveyFactory.create(
            command.getTitle(),
            command.getDescription(),
            command.getQuestions(),
            command.getSettings(),
            command.getDistribution(),
            command.getCreatedBy(),
            command.getOrganizationId()
        );
        
        Survey saved = surveyRepository.save(survey);
        
        // Domain events are collected and published after transaction commits
        survey.getDomainEvents().forEach(eventPublisher::publishEvent);
        
        return saved.getId();
    }
}
```

### Query Side

```java
@Service
public class GetSurveyQueryHandler {
    
    private final SurveyReadRepository surveyReadRepository;
    private final SurveyQueryMapper queryMapper;
    
    public SurveyResponse handle(GetSurveyQuery query) {
        SurveyReadModel readModel = surveyReadRepository.findById(query.getSurveyId())
            .orElseThrow(() -> new SurveyNotFoundException(query.getSurveyId()));
        
        return queryMapper.toResponse(readModel);
    }
}

@Repository
public interface SurveyReadRepository extends JpaRepository<SurveyReadModel, UUID> {
    
    @Query("SELECT s FROM SurveyReadModel s WHERE s.organizationId = :orgId ORDER BY s.updatedAt DESC")
    Page<SurveyReadModel> findByOrganization(@Param("orgId") UUID orgId, Pageable pageable);
}
```

### Event Handler (Projection)

```java
@Component
public class SurveyEventHandler {
    
    private final SurveyReadRepository surveyReadRepository;
    
    @KafkaListener(topics = "survey-events", groupId = "survey-projection")
    public void handleSurveyEvent(SurveyEvent event) {
        switch (event.getEventType()) {
            case "SurveyCreated" -> handleCreated((SurveyCreatedEvent) event);
            case "SurveyPublished" -> handlePublished((SurveyPublishedEvent) event);
            case "SurveyClosed" -> handleClosed((SurveyClosedEvent) event);
            default -> log.warn("Unknown event type: {}", event.getEventType());
        }
    }
    
    private void handleCreated(SurveyCreatedEvent event) {
        SurveyReadModel readModel = new SurveyReadModel();
        readModel.setId(event.getSurveyId());
        readModel.setTitle(event.getTitle());
        readModel.setStatus("DRAFT");
        readModel.setOrganizationId(event.getOrganizationId());
        readModel.setCreatedAt(event.getOccurredOn());
        
        surveyReadRepository.save(readModel);
    }
}
```

---

## Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/surveys/*/public").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> 
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()));
        
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthorityPrefix("ROLE_");
        authoritiesConverter.setAuthoritiesClaimName("roles");
        
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
}
```

---

## Database Migrations

### Flyway Configuration

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true
    out-of-order: false
```

### Migration Naming Convention

```
V1__create_user_tables.sql
V2__create_survey_tables.sql
V3__add_gps_fields.sql
V4__create_verification_tables.sql
V5__add_blockchain_fields.sql
R__create_audit_view.sql  (Repeatable)
```

### Sample Migration

```sql
-- V1__create_user_tables.sql

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_organization ON users(organization_id);

CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);
```

---

## Caching Strategy

### Cache Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Request    │────▶│  L1 Cache    │────▶│  L2 Cache    │
│              │     │  (Caffeine)  │     │  (Redis)     │
│              │     │  In-Memory   │     │  Distributed │
│              │     │  TTL: 5min   │     │  TTL: 30min  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                            ┌─────▼──────┐
                                            │  Database   │
                                            │  (PostgreSQL│
                                            └────────────┘
```

### Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();
        
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
            "surveys", config.entryTtl(Duration.ofMinutes(15)),
            "users", config.entryTtl(Duration.ofMinutes(10)),
            "trust-scores", config.entryTtl(Duration.ofMinutes(5)),
            "analytics", config.entryTtl(Duration.ofMinutes(1))
        );
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }
}
```

### Cache Usage

```java
@Service
public class SurveyService {
    
    @Cacheable(value = "surveys", key = "#surveyId")
    public SurveyResponse getSurvey(UUID surveyId) {
        return surveyRepository.findById(surveyId)
            .map(surveyMapper::toResponse)
            .orElseThrow(() -> new SurveyNotFoundException(surveyId));
    }
    
    @CacheEvict(value = "surveys", key = "#surveyId")
    @Transactional
    public void updateSurvey(UUID surveyId, UpdateSurveyCommand command) {
        // Update logic
    }
    
    @CacheEvict(value = "surveys", key = "#surveyId")
    @Transactional
    public void deleteSurvey(UUID surveyId) {
        // Delete logic
    }
    
    @CacheEvict(value = "surveys", allEntries = true)
    @Transactional
    public void clearSurveyCache() {
        // Manual cache clear
    }
}
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
