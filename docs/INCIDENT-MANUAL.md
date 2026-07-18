# Incident Management Manual

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [Incident Severity Levels](#incident-severity-levels)
- [Response Procedures](#response-procedures)
- [Escalation Matrix](#escalation-matrix)
- [Communication Templates](#communication-templates)
- [Post-Mortem Template](#post-mortem-template)

---

## Incident Severity Levels

### Severity Matrix

| Level | Label | Definition | Response Time | Examples |
|-------|-------|------------|---------------|----------|
| **P1** | Critical | Complete system outage or data breach | 15 minutes | Platform unavailable, data exfiltration, database corruption |
| **P2** | High | Major feature degradation or security vulnerability | 1 hour | Survey submission fails, verification pipeline broken, SSO outage |
| **P3** | Medium | Partial functionality impact | 4 hours | Dashboard loading slowly, NFT minting intermittent |
| **P4** | Low | Minor issue, no user impact | 24 hours | UI display bug, documentation error, non-critical alert |

### Severity Classification Guide

#### P1 - Critical
- Entire platform is unavailable
- Any service returning 5xx errors > 10% of requests
- Data breach or unauthorized access confirmed
- Database corruption or data loss
- Security vulnerability with active exploitation
- Complete loss of blockchain transaction processing
- Regulatory compliance violation detected

#### P2 - High
- Major feature unavailable (survey submission, verification)
- SSO or authentication system degraded
- Performance degradation affecting > 25% of users (p95 > 5s)
- Security vulnerability identified (not actively exploited)
- Payment processing failures
- Database replication lag > 5 minutes
- AI Engine offline > 15 minutes

#### P3 - Medium
- Non-critical feature unavailable
- Performance degradation affecting < 10% of users
- Minor data inconsistency (no customer impact)
- Monitoring or alerting issues
- Documentation/UI errors
- Single tenant issue (not widespread)

#### P4 - Low
- Cosmetic issues
- Non-functional requests
- Feature requests
- Minor logging or metric issues
- Known edge cases with workarounds

---

## Response Procedures

### P1 - Critical Incident Response

| Phase | Timeline | Actions | Owner |
|-------|----------|---------|-------|
| **Detection** | 0 min | Automated alert fires or user reports issue | On-call engineer |
| **Triage** | 0-15 min | Acknowledge alert, assess severity, create incident channel | On-call engineer |
| **Containment** | 15-60 min | Isolate affected systems, implement workaround, prevent escalation | Incident commander |
| **Diagnosis** | 1-4 hours | Identify root cause, determine fix | Engineering lead |
| **Resolution** | 4-8 hours | Deploy fix, verify recovery | Engineering team |
| **Monitoring** | 8-24 hours | Watch for recurrence, verify metrics normal | On-call engineer |
| **Post-mortem** | 7 days | Conduct RCA, document findings, implement preventions | Engineering lead |

### Detailed Steps

#### 1. Detection (0 min)
- Alert fires in PagerDuty, Slack, or monitoring system
- On-call engineer acknowledges within 5 minutes
- If no acknowledgement in 5 min, secondary on-call is paged

#### 2. Triage (0-15 min)
- Join dedicated Slack channel: `#incident-{id}`
- Assess severity using classification guide
- Declare incident in PagerDuty
- Create Zoom/Meet bridge for real-time coordination
- Appoint Incident Commander (most experienced on-call)

**Triage Checklist:**
```
[ ] Acknowledge alert
[ ] Determine severity (P1/P2/P3/P4)
[ ] Identify affected services
[ ] Estimate user impact
[ ] Check if escalation needed
[ ] Create Slack channel
[ ] Post initial status update
```

#### 3. Containment (15-60 min)
- Stop the bleeding before finding root cause
- Options may include:
  - Feature flag to disable affected functionality
  - Route traffic away from affected instances
  - Scale up resources to handle load
  - Block malicious traffic
  - Redirect to secondary region

**Containment Actions:**
```bash
# Feature flag to disable problematic feature
kubectl set env deployment/api-gateway FEATURE_VERIFICATION_DISABLED=true

# Route traffic away from bad node
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets

# Scale up
kubectl scale deployment/survey-service --replicas=10
```

#### 4. Diagnosis (1-4 hours)
- Gather data from logs, metrics, traces
- Reproduce issue in staging if possible
- Identify root cause
- Determine fix approach

**Diagnosis Tools:**
```
Logs:      Kibana (logs.surveyverify.backofficepro.co.za)
Metrics:   Grafana (grafana.surveyverify.backofficepro.co.za)
Traces:    Jaeger (jaeger.surveyverify.backofficepro.co.za)
Database:  pgAdmin or psql
Kubernetes: kubectl
```

#### 5. Resolution (4-8 hours)
- Implement fix
- Test in staging
- Deploy to production
- Verify all health checks pass
- Monitor for 30 minutes

**Verification Checklist:**
```
[ ] All services healthy (GET /actuator/health)
[ ] Error rate back to baseline
[ ] Latency back to baseline
[ ] All critical alerts cleared
[ ] No dead letter queue buildup
[ ] Blockchain transactions processing normally
```

#### 6. Monitoring (8-24 hours)
- Remain on high alert
- Watch for related issues
- Document timeline
- Begin preparing post-mortem

#### 7. Post-Mortem (within 7 days)
- Schedule meeting within 5 business days
- Complete post-mortem document
- Assign action items with owners and deadlines
- Share findings with engineering team
- Update runbooks and monitoring

---

## Escalation Matrix

### Primary Escalation Path

| Level | Role | Name / Rotation | Contact |
|-------|------|-----------------|---------|
| Tier 1 | Primary On-Call Engineer | Current rotation | PagerDuty |
| Tier 2 | Secondary On-Call Engineer | Current rotation | PagerDuty |
| Tier 3 | Service Owner | Per service | Slack @service-owner |
| Tier 4 | Engineering Manager | Weekly rotation | Slack @eng-manager |
| Tier 5 | CTO | On demand | +27 11 234 5678 |

### Escalation Criteria

| Criterion | Escalate To |
|-----------|-------------|
| P1 incident declared | Tier 3 immediately |
| No resolution in 2 hours | Tier 4 (Engineering Manager) |
| No resolution in 4 hours | Tier 5 (CTO) |
| Data breach confirmed | Tier 5 (CTO) + Legal + Security |
| Customer impacting > 1 hour | Tier 4 (Engineering Manager) |
| Unclear root cause | Tier 3 (Service Owner) |
| Security vulnerability | Tier 5 (CTO) + Security Team |

### Service Ownership

| Service | Owner | Backup |
|---------|-------|--------|
| API Gateway | Platform Team | DevOps Team |
| Survey Service | Survey Team | Platform Team |
| Verification Service | Verification Team | Survey Team |
| User Service | Platform Team | Security Team |
| Trust Service | Trust Team | Verification Team |
| Blockchain Service | Blockchain Team | Platform Team |
| Analytics Service | Analytics Team | Data Team |
| AI Engine | AI Team | Verification Team |
| PostgreSQL | Data Platform Team | DevOps Team |
| Kafka | Data Platform Team | DevOps Team |
| Redis | DevOps Team | Data Platform Team |

### After-Hours Escalation

- **P1/P2**: Page primary on-call via PagerDuty
- **P3/P4**: Log issue in tracking system, address next business day

---

## Communication Templates

### Initial Notification (Internal)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Severity: [P1/P2/P3/P4]
Incident ID: INC-{YYYYMMDD}-{NNN}
Title: [Brief description]
Date/Time: [Timestamp]
Detected By: [Monitoring/User/Team]

Services Affected:
- [Service 1]
- [Service 2]

User Impact:
[Description of how users are affected]

Current Status:
[Investigating / Containment / Resolution / Monitoring]

Next Update:
[Time of next update]

Incident Commander:
[Name]

Slack Channel:
#incident-{id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Status Update (Internal - Every 30 min for P1, 60 min for P2)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT UPDATE #{number} - INC-{id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: [Investigating/Identified/Mitigated/Resolved]

Timeline:
- HH:MM - Detected
- HH:MM - Containment action taken
- HH:MM - Root cause identified

Current Findings:
[What we know so far]

Action Items:
- [ ] Action 1 (owner, deadline)
- [ ] Action 2 (owner, deadline)

Next Update:
[Time of next update]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### External Customer Communication (P1/P2 only)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICE STATUS UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We are currently investigating an issue affecting [service].
Some users may be experiencing [symptoms].

Impact:
- [Description of impact]

Status: [Investigating/Resolved]
Estimated Resolution: [Time estimate or TBD]

We will provide another update in [X minutes/hours].

We sincerely apologize for any inconvenience.

Thank you,
Survey Verification Platform Team
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Resolution Notification

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT RESOLVED - INC-{id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The incident has been resolved.

Duration: [X hours, X minutes]
Root Cause: [Brief description]
Fix Applied: [Description of fix]

Metrics Returned to Baseline:
- Error Rate: [X%]
- P95 Latency: [Xms]
- All services healthy

Post-mortem scheduled: [Date/Time]

Full details will be shared in the post-mortem report.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Post-Mortem Template

```markdown
# Post-Mortem: INC-{YYYYMMDD}-{NNN}

**Title**: [Incident Title]
**Date**: [Date of incident]
**Duration**: [Start time] to [End time] ([duration])
**Severity**: [P1/P2/P3/P4]
**Author**: [Name]
**Reviewers**: [Names]

---

## Executive Summary

[2-3 paragraph summary of what happened, impact, and what was done]

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Event description] |
| HH:MM | [Event description] |
| HH:MM | [Event description] |

## Impact

### User Impact
- [Number] users affected
- [Description of user-facing impact]
- [Duration of impact]

### System Impact
- Services affected: [list]
- Error rate: [X%] (baseline: [X%])
- Latency: [Xms] p95 (baseline: [Xms])
- Data loss: [Yes/No - details]

## Root Cause

[Detailed explanation of what caused the incident]

### Contributing Factors
- Factor 1: [Description]
- Factor 2: [Description]

## Detection

- How was it detected? [Monitoring alert / User report / Manual discovery]
- Time to detection: [X minutes]
- Could detection have been faster? [Yes/No - how]

## Response

### What Went Well
- [Thing that went well]
- [Thing that went well]

### What Could Be Improved
- [Area for improvement]
- [Area for improvement]

## Action Items

| # | Action Item | Owner | Due Date | Status |
|---|-------------|-------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | [Open/In Progress/Done] |
| 2 | [Action description] | [Name] | [Date] | [Open/In Progress/Done] |

## Prevention Plan

### Short-term (within 1 week)
- [Action item]

### Medium-term (within 1 month)
- [Action item]

### Long-term (within 3 months)
- [Action item]

## Lessons Learned

1. [Lesson learned]
2. [Lesson learned]

## Follow-up

- Monitoring dashboard updated: [Yes/No]
- Runbook updated: [Yes/No]
- Alert threshold adjusted: [Yes/No]
- Team notified: [Yes/No]

---

## Appendices

### Relevant Logs
```
[Relevant log entries]
```

### Metrics Graphs
[Link to Grafana snapshots]

### Related Incidents
- INC-{id} - [Title]

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
```

---

## Post-Mortem Process

### Schedule
1. **Draft**: Author completes template within 3 days
2. **Review**: Peer review by involved engineers within 5 days
3. **Meeting**: 1-hour post-mortem meeting within 7 days
4. **Approval**: CTO signs off within 10 days
5. **Share**: Published to engineering team within 14 days

### Blameless Culture
Post-mortems are:
- **Blameless**: Focus on systems, not individuals
- **Data-driven**: Decisions based on evidence, not assumptions
- **Action-oriented**: Every finding has an action item
- **Shared**: Learnings are distributed across the organization

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
