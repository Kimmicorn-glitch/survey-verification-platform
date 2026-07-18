#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT="${1:-development}"
MAX_RETRIES=5
RETRY_INTERVAL=10

log() { echo -e "${GREEN}[HEALTH]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_url() {
    local url=$1
    local name=$2
    local retries=0

    while [ $retries -lt $MAX_RETRIES ]; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 2>/dev/null || echo "000")
        if [ "$HTTP_STATUS" = "200" ]; then
            log "$name: HEALTHY (HTTP $HTTP_STATUS)"
            return 0
        fi
        retries=$((retries + 1))
        warn "$name: Attempt $retries/$MAX_RETRIES returned HTTP $HTTP_STATUS, retrying in ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done

    error "$name: UNHEALTHY after $MAX_RETRIES attempts"
    return 1
}

check_container() {
    local container=$1
    local name=$2

    if docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null | grep -q "healthy"; then
        log "$name container: HEALTHY"
        return 0
    elif docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null | grep -q "running"; then
        warn "$name container: RUNNING (health check not available)"
        return 0
    else
        error "$name container: NOT RUNNING"
        return 1
    fi
}

check_k8s_pod() {
    local deployment=$1
    local namespace=$2
    local name=$3

    READY=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    DESIRED=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ] && [ "$READY" != "" ]; then
        log "$name: HEALTHY ($READY/$DESIRED replicas ready)"
        return 0
    else
        error "$name: UNHEALTHY ($READY/$DESIRED replicas ready)"
        return 1
    fi
}

log "========================================="
log "Health Check - Environment: $ENVIRONMENT"
log "========================================="

FAILED=0

if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
    log "Checking Kubernetes deployments..."
    NAMESPACE="survey-verification-platform"

    check_k8s_pod "frontend" "$NAMESPACE" "Frontend" || FAILED=$((FAILED + 1))
    check_k8s_pod "backend" "$NAMESPACE" "Backend" || FAILED=$((FAILED + 1))
    check_k8s_pod "ai-engine" "$NAMESPACE" "AI Engine" || FAILED=$((FAILED + 1))

    INGRESS_HOST=$(kubectl get ingress svp-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    if [ -n "$INGRESS_HOST" ]; then
        BASE_URL="https://${INGRESS_HOST}"
        check_url "${BASE_URL}/health" "Nginx" || FAILED=$((FAILED + 1))
        check_url "${BASE_URL}/api/health" "Backend API" || FAILED=$((FAILED + 1))
        check_url "${BASE_URL}/ai/health" "AI Engine" || FAILED=$((FAILED + 1))
    fi
else
    log "Checking Docker containers..."

    check_container "svp-frontend" "Frontend" || FAILED=$((FAILED + 1))
    check_container "svp-backend" "Backend" || FAILED=$((FAILED + 1))
    check_container "svp-ai-engine" "AI Engine" || FAILED=$((FAILED + 1))
    check_container "svp-postgres" "PostgreSQL" || FAILED=$((FAILED + 1))
    check_container "svp-redis" "Redis" || FAILED=$((FAILED + 1))
    check_container "svp-nginx" "Nginx" || FAILED=$((FAILED + 1))
    check_container "svp-prometheus" "Prometheus" || FAILED=$((FAILED + 1))
    check_container "svp-grafana" "Grafana" || FAILED=$((FAILED + 1))

    log ""
    log "Checking HTTP endpoints..."

    case "$ENVIRONMENT" in
        production)
            BASE_URL="https://surveyverification.com"
            ;;
        staging)
            BASE_URL="https://staging.surveyverification.com"
            ;;
        *)
            BASE_URL="http://localhost"
            ;;
    esac

    check_url "${BASE_URL}/health" "Nginx" || FAILED=$((FAILED + 1))
    check_url "${BASE_URL}/api/health" "Backend API" || FAILED=$((FAILED + 1))
    check_url "${BASE_URL}/ai/health" "AI Engine" || FAILED=$((FAILED + 1))
fi

log ""
log "========================================="
if [ $FAILED -eq 0 ]; then
    log "All health checks PASSED"
    exit 0
else
    error "Health checks FAILED ($FAILED failures)"
    exit 1
fi
