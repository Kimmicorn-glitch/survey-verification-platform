# Testing Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)

---

## Testing Strategy

### Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲
                 ╱──────╲
                ╱ Integr.╲
               ╱──────────╲
              ╱    Unit     ╲
             ╱────────────────╲
```

### Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Unit Tests | 85%+ | JaCoCo / cargo-tarpaulin |
| Integration Tests | 75%+ | Testcontainers |
| E2E Tests | Critical paths | Playwright / Cypress |
| Mutation Testing | 70%+ | Pitest / cargo-mutants |

---

## Unit Testing

### Java (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @InjectMocks
    private SurveyService surveyService;

    @Test
    @DisplayName("Should create survey successfully")
    void shouldCreateSurvey() {
        CreateSurveyCommand command = new CreateSurveyCommand(
            "Test Survey", "Description", List.of(), new SurveySettings(), null, UUID.randomUUID()
        );

        when(surveyRepository.save(any(Survey.class)))
            .thenReturn(SurveyFactory.create(command));

        UUID surveyId = surveyService.createSurvey(command);

        assertNotNull(surveyId);
        verify(surveyRepository).save(any(Survey.class));
    }

    @Test
    @DisplayName("Should throw exception when publishing empty survey")
    void shouldThrowOnPublishEmptySurvey() {
        Survey survey = SurveyFactory.create("Empty", "No questions");

        assertThrows(SurveyHasNoQuestionsException.class,
            () -> survey.publish());
    }
}
```

### Rust

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fraud_detection_low_risk() {
        let features = FraudFeatures::default_low_risk();
        let result = detect_fraud(&features);
        
        assert!(!result.is_fraudulent);
        assert!(result.fraud_score < 0.3);
        assert_eq!(result.risk_level, RiskLevel::Low);
    }

    #[test]
    fn test_haversine_distance() {
        let dist = haversine_distance(-26.2041, 28.0473, -26.2045, 28.0478);
        assert!(dist < 1.0); // Less than 1km
    }
}
```

---

## Integration Testing

### Testcontainers Configuration

```java
@SpringBootTest
@Testcontainers
class SurveyRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("test_db")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private SurveyRepository surveyRepository;

    @Test
    void shouldPersistAndRetrieveSurvey() {
        Survey survey = SurveyFactory.create("Integration Test", "Desc");
        Survey saved = surveyRepository.save(survey);
        
        Optional<Survey> retrieved = surveyRepository.findById(saved.getId());
        
        assertTrue(retrieved.isPresent());
        assertEquals("Integration Test", retrieved.get().getTitle().value());
    }
}
```

---

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
```

### Sample E2E Test

```typescript
test.describe('Survey Creation Flow', () => {
  test('should create and publish a survey', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@backofficepro.co.za');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/surveys/new');
    await page.fill('[data-testid="survey-title"]', 'E2E Test Survey');
    await page.click('[data-testid="add-question"]');
    await page.fill('[data-testid="question-text-0"]', 'How was your experience?');
    await page.click('[data-testid="save-survey"]');
    
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="survey-status"]')).toHaveText('DRAFT');
  });
});
```

---

## Performance Testing

### k6 Load Test

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://api.surveyverify.backofficepro.co.za/api/v1/surveys');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Security Testing

### OWASP ZAP Baseline Scan

```bash
docker run --rm -v $(pwd)/zap-reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t https://api.surveyverify.backofficepro.co.za \
  -r zap-report.html \
  -l WARN
```

### Security Test Checklist

- [ ] SQL injection testing
- [ ] XSS testing (stored, reflected, DOM-based)
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Authorization escalation tests
- [ ] Rate limiting verification
- [ ] Input validation bypass attempts
- [ ] Session management testing
- [ ] API enumeration protection
- [ ] Sensitive data exposure checks

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
