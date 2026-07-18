# Contributing Guidelines

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We pledge to act and interact in ways that contribute to an open, friendly, diverse, and healthy community.

### Expected Behavior

- Be respectful and considerate of differing viewpoints
- Give and accept constructive feedback gracefully
- Focus on what is best for the community and the platform
- Show empathy towards other community members
- Use inclusive language and be mindful of accessibility

### Unacceptable Behavior

- Harassment, trolling, or personal attacks
- Publishing others' private information without consent
- Any conduct that would be considered inappropriate in a professional setting
- Promoting or sharing discriminatory content
- Introducing security vulnerabilities intentionally

---

## Development Workflow

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Set up** the development environment (see README.md)
4. **Create** a feature branch from `develop`
5. **Make** your changes following the coding standards
6. **Test** your changes thoroughly
7. **Submit** a pull request

### Branch Naming

| Pattern | Purpose |
|---------|---------|
| `feature/short-description` | New features |
| `bugfix/issue-number-description` | Bug fixes |
| `hotfix/critical-description` | Production hotfixes |
| `release/v1.x.x` | Release preparation |
| `docs/description` | Documentation updates |
| `refactor/description` | Code refactoring |

### Development Process

```
main ──────────────────────────────────────────────▶
  │                                                  ▲
  │         release/v1.1.0 ─────────────────────────│
  │        ╱                                        │
  ├── develop ─── feature/xyz ──┐                   │
  │        ╲                    ├──▶ PR ──▶ Review ──│
  │         feature/abc ────────┘                   │
  │                                                  │
  └── hotfix/critical ──────────────────────────────┘
```

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Code coverage maintained or improved
- [ ] Linting passes with no errors
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with `develop`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Testing
Describe tests performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
```

### Review Requirements

| Change Type | Approvals Required | Additional |
|-------------|-------------------|------------|
| Feature | 2 | Security review if touching auth |
| Bug Fix | 1 | Regression test required |
| Hotfix | 1 | Production deployment approval |
| Documentation | 1 | Technical accuracy review |
| Dependency Update | 1 | Security scan must pass |

---

## Code Standards

### Java

- Follow Google Java Style Guide
- Maximum method length: 50 lines
- Maximum class length: 500 lines
- Use meaningful variable and method names
- Write Javadoc for public APIs
- Use Optional instead of null returns

### Rust

- Follow Rust API Guidelines
- Use clippy with default + pedantic lints
- Maximum function length: 50 lines
- Prefer iterators over loops
- Use Result for error handling
- Document public items with `///`

### TypeScript/JavaScript

- Follow Airbnb Style Guide
- Use TypeScript strict mode
- Prefer const over let
- Use async/await over raw promises
- Maximum line length: 100 characters

### SQL

- Use UPPERCASE for keywords
- Use snake_case for identifiers
- Always specify table aliases
- Include comments for complex queries

---

## Commit Conventions

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Build, CI, dependencies |
| `perf` | Performance improvement |
| `security` | Security fix |

### Examples

```
feat(survey): add conditional question logic

Implement branching logic for survey questions based on
previous answers. Supports up to 5 levels of nesting.

Closes #123
```

```
fix(auth): resolve token refresh race condition

Fix concurrent token refresh requests causing invalid tokens.
Added mutex lock for refresh operations.

Fixes #456
```

---

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots/logs if applicable

### Security Issues

**Do not** create public issues for security vulnerabilities.

Email security@backofficepro.co.za with:
- Vulnerability description
- Reproduction steps
- Potential impact assessment
- Suggested fix (if any)

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
