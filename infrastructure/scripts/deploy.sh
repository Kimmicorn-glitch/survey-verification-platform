#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"
NAMESPACE="survey-verification-platform"

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'."
fi

log "Deploying to $ENVIRONMENT with image tag: $IMAGE_TAG"

if [[ "$ENVIRONMENT" == "production" ]]; then
    log "Creating pre-deploy backup..."
    bash "$SCRIPT_DIR/backup.sh" production || warn "Backup failed, continuing deployment"
fi

log "Building Docker images..."
cd "$PROJECT_ROOT"

export IMAGE_TAG
docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" build

log "Pushing images to registry..."
docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" push

if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
    log "Deploying to Kubernetes..."

    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/namespace.yaml"

    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/configmap.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/secrets.yaml"

    kubectl set image deployment/backend \
        backend="ghcr.io/backofficepro/survey-verification-platform/backend:${IMAGE_TAG}" \
        -n "$NAMESPACE"

    kubectl set image deployment/ai-engine \
        ai-engine="ghcr.io/backofficepro/survey-verification-platform/ai-engine:${IMAGE_TAG}" \
        -n "$NAMESPACE"

    kubectl set image deployment/frontend \
        frontend="ghcr.io/backofficepro/survey-verification-platform/frontend:${IMAGE_TAG}" \
        -n "$NAMESPACE"

    log "Waiting for rollout to complete..."
    kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/ai-engine -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s

    log "Running health checks..."
    bash "$SCRIPT_DIR/health-check.sh" "$ENVIRONMENT"
else
    log "Kubernetes not available, deploying with Docker Compose..."
    docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" up -d --remove-orphans

    log "Waiting for services to be healthy..."
    sleep 30

    docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" ps
fi

log "Deployment to $ENVIRONMENT completed successfully!"
