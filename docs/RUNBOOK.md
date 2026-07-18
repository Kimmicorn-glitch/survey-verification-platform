# Runbook

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-17

---

## Table of Contents

- [Common Issues and Resolutions](#common-issues-and-resolutions)
- [Database Connection Issues](#database-connection-issues)
- [Redis Connection Issues](#redis-connection-issues)
- [AI Engine Issues](#ai-engine-issues)
- [Blockchain Issues](#blockchain-issues)
- [Performance Degradation](#performance-degradation)
- [Security Incidents](#security-incidents)

---

## Common Issues and Resolutions

### Issue: Service Won't Start

**Symptoms:**
- Container exits immediately
- CrashLoopBackOff in Kubernetes
- `docker-compose ps` shows restarting

**Checklist:**
1. Check logs: `docker-compose logs <service>` or `kubectl logs <pod> -n survey-verification`
2. Verify database is accessible: `kubectl exec -it postgres-pod -- pg_isready`
3. Check environment variables are set
4. Verify all dependent services are running

**Resolution:**
```bash
# View logs
kubectl logs -n survey-verification deployment/survey-service --tail=50

# Restart service
kubectl rollout restart deployment/survey-service -n survey-verification

# If configuration issue, check ConfigMap
kubectl describe configmap survey-verify-config -n survey-verification
```

### Issue: Health Check Fails

**Symptoms:**
- `GET /actuator/health` returns DOWN
- Load balancer marks instance as unhealthy
- Pod restarts

**Resolution:**
```bash
# Check health endpoint
curl https://api.surveyverify.backofficepro.co.za/actuator/health

# Check individual component status
curl https://api.surveyverify.backofficepro.co.za/actuator/health/{component}

# Inspect Kubernetes readiness probe
kubectl describe pod <pod-name> -n survey-verification | grep -A10 Readiness
```

### Issue: Kubernetes Pod Stuck in Pending

**Checklist:**
- `kubectl describe pod <pod> -n survey-verification` shows events
- Check node resources: `kubectl top nodes`
- Check PVC status: `kubectl get pvc -n survey-verification`

**Resolution:**
```bash
# Check node resources
kubectl describe node <node-name>

# Resolve PVC issues
kubectl get pvc -n survey-verification
kubectl describe pvc <pvc-name> -n survey-verification
```

---

## Database Connection Issues

### Symptoms

- Connection pool errors in logs
- `hikaricp_connections_pending` metric increases
- Slow queries and timeouts
- `psql: could not connect to server` errors

### Checks

```bash
# Check connectivity
kubectl exec -it <pod> -n survey-verification -- pg_isready -h <db-host> -U survey_app

# Check connection pool status
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active

# Check active connections on database
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
```

### Resolution

#### 1. High Connection Pool Usage

```yaml
# Increase pool size in application config
spring:
  datasource:
    hikari:
      maximum-pool-size: 40  # Increase from default 20
      minimum-idle: 10
      connection-timeout: 60000  # Increase timeout
```

#### 2. Blocked/Long-Running Queries

```sql
-- Kill long-running query
SELECT pg_terminate_backend(<pid>);

-- Check for locks
SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted;
```

#### 3. Database Connection Refused

```bash
# Check PostgreSQL service
kubectl get pods -n data-layer | grep postgres

# Restart PostgreSQL
kubectl rollout restart statefulset/postgresql -n data-layer

# Verify RDS status (if managed)
aws rds describe-db-instances --db-instance-identifier survey-verify-prod
```

#### 4. Replication Lag

```sql
-- Check replication status
SELECT application_name, state, sync_state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

---

## Redis Connection Issues

### Symptoms

- Cache miss rates increase
- `redis.clients.jedis.exceptions.JedisConnectionException` in logs
- API response times degrade without caching
- Session management failures

### Checks

```bash
# Test connectivity
kubectl exec -it <pod> -n survey-verification -- redis-cli -h redis-service ping

# Check memory usage
redis-cli info memory | grep used_memory_human

# Check connected clients
redis-cli client list | wc -l

# Check for slow commands
redis-cli slowlog get 10
```

### Resolution

#### 1. Redis Unreachable

```bash
# Check Redis pod
kubectl get pods -n data-layer | grep redis

# Restart Redis
kubectl rollout restart statefulset/redis -n data-layer

# Verify Sentinel (if clustered)
redis-cli -p 26379 sentinel master mymaster
```

#### 2. Memory Full (OOM)

```bash
# Check eviction policy
redis-cli config get maxmemory-policy

# Set to volatile-lru if not set
redis-cli config set maxmemory-policy volatile-lru

# Flush cache (if needed)
redis-cli FLUSHDB
# OR for specific cache
redis-cli DEL surveys:cache:* 
```

#### 3. High Memory Usage

```bash
# Analyze memory by key type
redis-cli --bigkeys

# Set TTL for specific key patterns
redis-cli EVAL "for i, name in ipairs(redis.call('KEYS', ARGV[1])) do redis.call('EXPIRE', name, ARGV[2]) end" 0 "cache:*" 300
```

---

## AI Engine Issues

### Symptoms

- `POST /api/v1/detect/fraud` returns errors
- Fraud detection latency spikes
- AI analysis step in verification stays "IN_PROGRESS"
- High CPU/GPU usage on AI Engine pods

### Checks

```bash
# Health check
curl http://ai-engine-service:9090/health

# Check model load status
curl http://ai-engine-service:9090/metrics | grep model_loaded

# Check inference latency
curl http://ai-engine-service:9090/metrics | grep inference_duration
```

### Resolution

#### 1. Model Not Loaded

```bash
# Check model files
kubectl exec -it <ai-pod> -- ls -la /models/

# Re-deploy with correct model path
kubectl rollout restart deployment/ai-engine -n ai-engine

# Check model version in logs
kubectl logs -n ai-engine deployment/ai-engine --tail=50 | grep "model loaded"
```

#### 2. High Latency

```yaml
# Increase workers in config
[server]
workers = 16  # Increase from 8
max_connections = 20000

# Enable GPU if available
GPU_ENABLED=true
```

```bash
# Scale out AI Engine pods
kubectl scale deployment/ai-engine -n ai-engine --replicas=4
```

#### 3. GPU Issues

```bash
# Check GPU availability
kubectl exec -it <ai-pod> -- nvidia-smi

# Check for CUDA errors
kubectl logs -n ai-engine deployment/ai-engine --tail=100 | grep -i cuda

# Fallback to CPU inference
kubectl set env deployment/ai-engine GPU_ENABLED=false
```

---

## Blockchain Issues

### Symptoms

- Transactions stuck in "PENDING" status
- `CHAIN_001` error codes in API responses
- High gas costs
- NFT minting failures

### Checks

```bash
# Check blockchain service health
curl http://blockchain-service:8086/actuator/health

# Check pending transactions count
curl http://blockchain-service:8086/actuator/metrics/blockchain.pending.transactions

# Check RPC endpoint status
curl -X POST https://polygon-mainnet.g.alchemy.com/v2/<key> \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Resolution

#### 1. Stuck Transactions

```bash
# Check transaction status
curl http://blockchain-service:8086/api/v1/blockchain/verify/pending

# Check gas price
curl http://blockchain-service:8086/api/v1/blockchain/gas-price

# Resubmit with higher gas if needed
# Configure gas price multiplier
kubectl set env deployment/blockchain-service GAS_PRICE_MULTIPLIER=1.5
```

#### 2. RPC Endpoint Down

```bash
# Switch to backup RPC
kubectl set env deployment/blockchain-service \
  BLOCKCHAIN_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/backup-key

# Or use public RPC as fallback
kubectl set env deployment/blockchain-service \
  BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
```

#### 3. Insufficient MATIC Balance

```bash
# Check wallet balance
curl http://blockchain-service:8086/api/v1/blockchain/wallet/balance

# Top up wallet from admin account
# Transfer MATIC to service wallet address
```

#### 4. Smart Contract Issues

```bash
# Verify contract is deployed
cast code <contract-address> --rpc-url <rpc-url>

# Check contract pause status
cast call <contract-address> "paused()" --rpc-url <rpc-url>

# Unpause if needed (admin only)
cast send <contract-address> "unpause()" --rpc-url <rpc-url> --private-key <admin-key>
```

---

## Performance Degradation

### Symptoms

- API response times exceed SLA (p95 > 2s)
- Error rate increases above 5%
- Users report slow page loads
- High CPU/memory usage on pods

### Monitoring Checks

```bash
# Check current latency
curl http://localhost:8080/actuator/metrics/http.server.requests.seconds

# Check error rate
curl http://localhost:8080/actuator/metrics/http.server.requests.count

# Check database metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active

# Check GC metrics
curl http://localhost:8080/actuator/metrics/jvm.gc.pause.seconds
```

### Resolution Steps

#### 1. High CPU/Memory

```bash
# Scale out horizontally
kubectl scale deployment/survey-service -n survey-verification --replicas=5

# Check if HPA is configured
kubectl get hpa -n survey-verification

# Restart pod if memory leak suspected
kubectl rollout restart deployment/survey-service -n survey-verification
```

#### 2. Slow Database Queries

```sql
-- Find slow queries
SELECT query, calls, total_time / calls AS avg_time_ms
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

#### 3. High Consumer Lag

```bash
# Check consumer lag
kubectl exec -it kafka-pod -- kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group survey-projection \
  --describe

# Restart consumer to catch up
kubectl rollout restart deployment/survey-projection -n survey-verification

# Scale consumer
kubectl scale deployment/survey-projection --replicas=3
```

#### 4. Connection Pool Exhausted

```yaml
# Temporary increase in ConfigMap
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      idle-timeout: 600000
```

---

## Security Incidents

### Incident: Suspicious Login Activity

**Symptoms:**
- Multiple failed login attempts from single IP
- Logins from unusual geographic locations
- AUTH_005 (Account Locked) errors increasing

**Immediate Actions:**
1. **Block IP**: Apply rate limiting at WAF level
2. **Lock affected accounts**: via admin API
3. **Investigate logs**: Check audit trail
4. **Rotate credentials**: If any account may be compromised

```bash
# Block IP at WAF level
aws wafv2 update-ip-set \
  --name blocked-ips \
  --addresses "192.168.1.100/32"

# Lock suspicious accounts
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/admin/users/{userId}/lock \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Suspicious activity detected"}'

# Force password reset
curl -X POST https://api.surveyverify.backofficepro.co.za/api/v1/admin/users/{userId}/force-password-reset \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Incident: Potential Data Breach

**Symptoms:**
- Unauthorized data access detected
- Anomalous API patterns
- Data export from unauthorized users

**Immediate Actions:**
1. **Isolate affected systems**: Remove from load balancer
2. **Revoke compromised keys**: Rotate all API keys and secrets
3. **Enable audit mode**: Log all access with maximum verbosity
4. **Notify security team**: security@backofficepro.co.za
5. **Preserve logs**: Ensure log retention for forensic analysis

```bash
# Remove service from load balancer
aws elbv2 deregister-targets \
  --target-group-arn <tg-arn> \
  --targets Id=<instance-id>

# Rotate secrets
aws secretsmanager rotate-secret --secret-id survey-verify/database

# Enable full audit logging
kubectl set env deployment/api-gateway AUDIT_MODE=FULL

# Snapshot current database for forensic analysis
pg_dump -h localhost -U survey_app -d survey_verify -F c \
  -f /forensics/breach_snapshot_$(date +%Y%m%d_%H%M%S).dump
```

### Incident: DDoS Attack

**Symptoms:**
- Traffic spikes 10x+ normal
- API latency spikes
- Error rate increases (503 Service Unavailable)
- CDN edge reporting high request volume

**Immediate Actions:**
1. **Enable WAF rate limiting**: Restrict to known good origins
2. **Scale out**: Increase pod count temporarily
3. **Enable CloudFront shield**: Advanced DDoS protection
4. **Block bad actors**: IP-based blocking at WAF

```bash
# AWS Shield Advanced (if enabled)
aws shield describe-protection --protection-id <id>

# Increase pod count for attack
kubectl scale deployment/api-gateway --replicas=20
kubectl scale deployment/survey-service --replicas=10

# Enable DDoS mitigation mode in API Gateway
kubectl set env deployment/api-gateway DDoS_MITIGATION_MODE=AGGRESSIVE
```

### Incident: Compromised Container

**Symptoms:**
- Container running unexpected processes
- Unusual network connections
- Alert from runtime security (Falco)

**Immediate Actions:**
1. **Isolate pod**: Apply network policy to block traffic
2. **Capture forensic data**: Snapshot container filesystem
3. **Terminate pod**: Replace with clean image
4. **Scan registry**: Check for other compromised images
5. **Rotate secrets**: All secrets in the compromised pod

```bash
# Isolate pod with network policy
kubectl label pod <pod-name> isolated=true
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: isolate-pod
spec:
  podSelector:
    matchLabels:
      isolated: "true"
  policyTypes:
  - Ingress
  - Egress
EOF

# Capture container logs and filesystem
kubectl logs <pod-name> > /forensics/pod-logs.txt
kubectl cp <pod-name>:/ - /forensics/container-fs/

# Replace with clean image
kubectl set image deployment/<deployment> <container>=<image>:<known-good-tag>
```

---

*Document Version: 1.0.0*
*Copyright &copy; 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
