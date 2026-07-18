# Service Level Agreement (SLA)

**BackOffice Pro (Pty) Ltd**
**Survey Verification Platform**

---

**Effective Date:** 1 January 2025
**Version:** 1.0

---

## 1. OVERVIEW

1.1 This Service Level Agreement ("SLA") defines the service levels, uptime commitments, support response times, and remedies applicable to the Survey Verification Platform provided by BackOffice Pro (Pty) Ltd ("BackOffice Pro").

1.2 This SLA is incorporated into and forms part of the Master Services Agreement (MSA).

---

## 2. SERVICE LEVEL COMMITMENTS

### 2.1 Platform Availability

| Metric | Commitment |
|--------|-----------|
| Monthly Uptime SLA | 99.9% |
| Scheduled Maintenance Window | Maximum 4 hours/month |
| Maximum Unplanned Downtime | 43 minutes/month |
| Deployment Frequency | Weekly (minimum) |
| Recovery Time Objective (RTO) | 4 hours |
| Recovery Point Objective (RPO) | 1 hour |

### 2.2 Uptime Calculation

2.2.1 Uptime is calculated as: (Total Minutes - Downtime Minutes) / Total Minutes x 100

2.2.2 Downtime excludes:
   - Scheduled maintenance with 72 hours' advance notice
   - Force majeure events
   - Client-caused outages
   - Third-party service provider failures
   - DNS propagation delays
   - Denial of service attacks

---

## 3. SUPPORT LEVELS

### 3.1 Support Tiers

| Tier | Plan | Hours | Channels |
|------|------|-------|----------|
| Standard | Starter | Business hours (08:00-17:00 SAST) | Email, Ticket |
| Priority | Professional | Extended hours (07:00-20:00 SAST) | Email, Phone, Ticket |
| Premium | Enterprise | 24/7/365 | Email, Phone, Slack, Dedicated AM |
| Custom | Custom | As agreed | As agreed |

### 3.2 Response Times

| Severity | Definition | Standard | Priority | Premium |
|----------|-----------|----------|----------|---------|
| P1 - Critical | Platform unavailable, data loss risk | 4 hours | 2 hours | 30 minutes |
| P2 - High | Major feature degraded, no workaround | 8 hours | 4 hours | 1 hour |
| P3 - Medium | Feature impaired, workaround available | 24 hours | 8 hours | 4 hours |
| P4 - Low | Minor issue, cosmetic, documentation | 72 hours | 24 hours | 8 hours |

### 3.3 Resolution Times

| Severity | Standard | Priority | Premium |
|----------|----------|----------|---------|
| P1 - Critical | 8 hours | 4 hours | 2 hours |
| P2 - High | 24 hours | 12 hours | 8 hours |
| P3 - Medium | 72 hours | 48 hours | 24 hours |
| P4 - Low | 10 business days | 5 business days | 3 business days |

---

## 4. MONITORING AND REPORTING

### 4.1 Real-Time Monitoring

4.1.1 BackOffice Pro maintains 24/7 automated monitoring of all Platform services including:
   - HTTP endpoint health checks (every 30 seconds)
   - Database connectivity and performance
   - AI engine response times
   - Blockchain node connectivity
   - Resource utilization (CPU, memory, disk)
   - Error rates and latency percentiles

### 4.2 Status Page

4.2.1 A public status page is available at status.backofficepro.com.

4.2.2 The status page is updated in real-time during incidents.

### 4.3 Monthly Reports

4.3.1 Enterprise customers receive monthly service reports including:
   - Uptime statistics
   - Incident summaries
   - Performance metrics
   - Capacity planning data
   - Recommendations

---

## 5. INCIDENT MANAGEMENT

### 5.1 Incident Classification

| Level | Description | Example |
|-------|-------------|---------|
| L1 - Critical | Complete service outage | Platform inaccessible |
| L2 - Major | Significant degradation | Slow response times, partial feature failure |
| L3 - Minor | Limited impact | Single feature issue, workaround available |
| L4 - Low | Minimal impact | Cosmetic issue, documentation error |

### 5.2 Communication

5.2.1 For P1 incidents, BackOffice Pro shall:
   - Acknowledge within 15 minutes
   - Provide initial assessment within 30 minutes
   - Update every 30 minutes until resolved
   - Provide post-incident report within 48 hours

5.2.2 For P2 incidents, BackOffice Pro shall:
   - Acknowledge within 1 hour
   - Provide updates every 2 hours
   - Provide post-incident report within 5 business days

### 5.3 Post-Incident Reviews

5.3.1 All P1 and P2 incidents receive a post-incident review (PIR).

5.3.2 PIR reports include root cause analysis, timeline, impact assessment, and corrective actions.

---

## 6. SERVICE CREDITS

### 6.1 Uptime Credits

| Monthly Uptime | Credit (% of Monthly Fee) |
|---------------|---------------------------|
| 99.0% - 99.9% | 10% |
| 95.0% - 99.0% | 25% |
| 90.0% - 95.0% | 50% |
| Below 90.0% | 100% |

### 6.2 Response Time Credits

| Severity | Missed Response Time | Credit |
|----------|---------------------|--------|
| P1 | Exceeded by 2x | R2,500 per incident |
| P2 | Exceeded by 2x | R1,000 per incident |
| P3 | Exceeded by 3x | R500 per incident |

### 6.3 Credit Limit

6.3.1 Total service credits in any calendar month shall not exceed one hundred percent (100%) of the monthly subscription fee.

6.3.2 Service credits are applied as offsets against future invoices and are not redeemable for cash.

### 6.4 Claiming Credits

6.4.1 Service credit requests must be submitted within thirty (30) days of the incident.

6.4.2 Credits require verification of the qualifying event by BackOffice Pro.

---

## 7. MAINTENANCE

### 7.1 Scheduled Maintenance

7.1.1 Scheduled maintenance windows are communicated at least seventy-two (72) hours in advance.

7.1.2 Maintenance windows: Saturday 02:00 - 06:00 SAST (primary), with backup window on Sunday 02:00 - 06:00 SAST.

7.1.3 Critical security patches may be applied outside the maintenance window with as much notice as practicable.

### 7.2 Emergency Maintenance

7.2.1 Emergency maintenance for critical security vulnerabilities may be performed with minimal notice.

7.2.2 Emergency maintenance is limited to security-critical changes that cannot wait for the next scheduled window.

---

## 8. CAPACITY AND PERFORMANCE

### 8.1 Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p50) | < 200ms |
| API Response Time (p95) | < 500ms |
| API Response Time (p99) | < 1,000ms |
| AI Verification Processing | < 5 seconds |
| NFT Minting | < 30 seconds |
| Page Load Time | < 2 seconds |
| Database Query Time (p95) | < 100ms |

### 8.2 Scalability

8.2.1 The Platform automatically scales to handle up to 10x normal traffic without degradation.

8.2.2 Enterprise customers may request pre-provisioned capacity for known high-traffic events.

---

## 9. EXCLUSIONS

9.1 This SLA does not apply to:
   - (a) Issues caused by the Client's infrastructure, network, or configuration;
   - (b) Issues caused by third-party services beyond BackOffice Pro's control;
   - (c) Issues caused by unauthorized modifications by the Client;
   - (d) Beta or preview features;
   - (e) Free trial accounts.

---

## 10. TERM

10.1 This SLA is effective during the term of the MSA.

10.2 BackOffice Pro may modify this SLA upon thirty (30) days' written notice, with modifications taking effect at the next renewal.

---

## 11. CONTACT

For SLA inquiries and credit requests:
- **Email:** sla@backofficepro.com
- **Status Page:** status.backofficepro.com
- **Emergency Line:** +27 (0) 11 XXX XXXX

---

*BackOffice Pro (Pty) Ltd - All Rights Reserved*
