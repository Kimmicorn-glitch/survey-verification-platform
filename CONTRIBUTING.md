# Contributing Guide

Thank you for your interest in contributing to the Survey Verification Platform! This guide will help you get started.

**Maintained by**: BackOffice Pro (Pty) Ltd

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience. Please be respectful, constructive, and professional in all interactions.

### Expected Behavior
- Be respectful of differing viewpoints
- Give and accept constructive feedback gracefully
- Focus on what is best for the community and the platform
- Show empathy towards other community members
- Use inclusive language

### Unacceptable Behavior
- Harassment, trolling, or personal attacks
- Publishing others' private information without consent
- Introducing security vulnerabilities intentionally
- Discriminatory language or content

---

## Development Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java | 21+ | Backend |
| Node.js | 20+ | Frontend & Blockchain |
| Rust | 1.78+ | AI Engine |
| Docker | 27+ | Services |
| Docker Compose | 2.29+ | Orchestration |
| Git | 2.40+ | Version control |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/backofficepro/survey-verification-platform.git
cd survey-verification-platform

# Copy environment template
cp .env.example .env

# Start all services
./start.sh          # Linux/macOS
start.bat           # Windows

# Or start individual services
docker compose up -d postgres redis
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Starts on http://localhost:3000
```

### Backend

```bash
cd backend
./mvnw spring-boot:run    # Or use Maven wrapper
```

### AI Engine

```bash
cd ai-engine
cargo build
cargo run
```

### Blockchain

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
```

---

## Project Structure

```
survey-verification-platform/
├── frontend/          # React 19 + Next.js 15 + TypeScript
├── backend/           # Java 21 + Spring Boot 3.3
├── ai-engine/         # Rust + Tokio + Axum
├── blockchain/        # Solidity + Hardhat
├── infrastructure/    # Terraform, Nginx, Vault, scripts
├── testing/           # Load tests, integration tests
├── legal/             # Legal documents and policies
├── docs/              # Additional documentation
└── .github/           # CI/CD, templates, Dependabot
```

---

## Code Style

### Java (Backend)

- Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- Max method length: 50 lines
- Max class length: 500 lines
- Use meaningful variable and method names
- Write Javadoc for public APIs
- Use `Optional` instead of null returns
- Use Lombok for boilerplate reduction

```bash
mvn checkstyle:check    # Verify style
```

### Rust (AI Engine)

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `clippy` with default + pedantic lints
- Max function length: 50 lines
- Prefer iterators over loops
- Use `Result` for error handling
- Document public items with `///`

```bash
cargo clippy -- -D warnings
cargo fmt -- --check
```

### TypeScript (Frontend)

- Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use `async/await` over raw promises
- Max line length: 100 characters

```bash
npm run lint
npm run typecheck
```

### Solidity (Blockchain)

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use OpenZeppelin contracts where possible
- Maximum contract size: 24KB
- Use NatSpec documentation

```bash
npx hardhat check
```

### SQL

- UPPERCASE for keywords
- snake_case for identifiers
- Always specify table aliases
- Include comments for complex queries

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies |
| `perf` | Performance improvement |
| `security` | Security fix |

**Examples:**
```
feat(survey): add conditional question logic
fix(auth): resolve token refresh race condition
security(api): patch SQL injection in search endpoint
```

---

## Testing Requirements

### Unit Tests

Every new feature and bug fix must include unit tests.

| Component | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Backend (Java) | JUnit 5 + Mockito | 80% |
| AI Engine (Rust) | built-in `#[test]` | 80% |
| Frontend (React) | Jest + React Testing Library | 75% |
| Blockchain (Solidity) | Hardhat + Chai | 90% |

### Integration Tests

- API endpoint testing required for new endpoints
- Database integration tests for new queries
- Service-to-service integration tests for event-driven flows

### Running Tests

```bash
# All tests
./start.sh --test

# Backend only
cd backend && mvn test

# AI Engine only
cd ai-engine && cargo test

# Frontend only
cd frontend && npm test

# Blockchain only
cd blockchain && npx hardhat test

# Load tests
cd testing/load && npm test
```

### Test Naming Convention

```
[ClassName]_[Method]_[Scenario]_[ExpectedResult]

Example: SurveyService_CreateSurvey_WithValidInput_ReturnsCreatedSurvey
```

---

## Pull Request Process

### Workflow

1. **Fork** the repository
2. **Create** a feature branch from `develop`
3. **Make** your changes following code standards
4. **Write** or update tests
5. **Run** all tests and lint checks
6. **Commit** with conventional commit messages
7. **Push** to your fork
8. **Open** a pull request against `develop`

### Branch Naming

| Pattern | Purpose |
|---------|---------|
| `feature/short-description` | New features |
| `bugfix/issue-number-description` | Bug fixes |
| `hotfix/critical-description` | Production hotfixes |
| `release/v1.x.x` | Release preparation |
| `docs/description` | Documentation updates |
| `refactor/description` | Code refactoring |
| `security/description` | Security fixes |

### Before Submitting

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Code coverage maintained or improved
- [ ] Linting passes (`npm run lint`, `cargo clippy`, `mvn checkstyle:check`)
- [ ] Type checking passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with `develop`

### Review Requirements

| Change Type | Approvals Required | Additional |
|-------------|-------------------|------------|
| Feature | 2 | Security review if touching auth |
| Bug Fix | 1 | Regression test required |
| Hotfix | 1 | Production deployment approval |
| Documentation | 1 | Technical accuracy review |
| Dependency Update | 1 | Security scan must pass |

### After Review

- Address all review comments
- Re-run CI checks if needed
- Squash commits if requested
- A maintainer will merge the PR

---

## Release Process

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (`X.0.0`): Incompatible API changes
- **MINOR** (`0.X.0`): Backwards-compatible new functionality
- **PATCH** (`0.0.X`): Backwards-compatible bug fixes
- **Pre-release** (`1.0.0-rc.1`): Release candidates

### Release Workflow

1. Create `release/vX.Y.Z` branch from `develop`
2. Update `CHANGELOG.md` with release notes
3. Update version numbers across all services
4. Run full test suite
5. QA validation on staging environment
6. Create PR from `release/vX.Y.Z` to `main`
7. Get release approval from 2 maintainers
8. Merge to `main` and tag the release
9. CI/CD deploys to production
10. Create GitHub Release with auto-generated notes

### Post-Release

- Merge `main` back to `develop`
- Monitor production for issues
- Announce release to stakeholders

---

## Reporting Issues

### Bug Reports

Use the [Bug Report template](https://github.com/backofficepro/survey-verification-platform/issues/new?template=bug_report.yml). Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots/logs if applicable

### Security Issues

**Do not create public issues for security vulnerabilities.**

Email security@backofficepro.co.za with:
- Vulnerability description
- Reproduction steps
- Potential impact assessment
- Suggested fix (if any)

See [SECURITY.md](SECURITY.md) for our full security policy.

### Feature Requests

Use the [Feature Request template](https://github.com/backofficepro/survey-verification-platform/issues/new?template=feature_request.yml).

---

## Questions?

If you have questions about contributing, reach out:
- **Email**: support@backofficepro.co.za
- **GitHub Discussions**: Use the repository Discussions tab

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
