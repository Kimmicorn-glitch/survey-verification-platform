#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[BACKUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

ENVIRONMENT="${1:-development}"
BACKUP_DIR="/opt/backups/svp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="svp_${ENVIRONMENT}_${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

log "Starting database backup for $ENVIRONMENT..."

if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "staging" ]]; then
    if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
        log "Backing up PostgreSQL via Kubernetes..."
        kubectl exec -n survey-verification-platform \
            deployment/postgres -- \
            pg_dump -U svp_user -d survey_verification \
            --format=custom --compress=9 \
            > "$BACKUP_DIR/${BACKUP_NAME}.dump"

        kubectl exec -n survey-verification-platform \
            deployment/postgres -- \
            pg_dump -U svp_user -d survey_verification \
            --format=plain \
            > "$BACKUP_DIR/${BACKUP_NAME}.sql"

        log "Backing up Redis..."
        kubectl exec -n survey-verification-platform \
            deployment/redis -- \
            redis-cli BGSAVE

        sleep 5

        kubectl cp "survey-verification-platform/$(kubectl get pod -n survey-verification-platform -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb" \
            "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" 2>/dev/null || warn "Redis backup skipped"
    fi
else
    log "Backing up PostgreSQL via Docker Compose..."

    docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
        pg_dump -U svp_user -d survey_verification \
        --format=custom --compress=9 \
        > "$BACKUP_DIR/${BACKUP_NAME}.dump"

    docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
        pg_dump -U svp_user -d survey_verification \
        --format=plain \
        > "$BACKUP_DIR/${BACKUP_NAME}.sql"

    log "Backing up Redis..."
    docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T redis redis-cli BGSAVE
    sleep 5

    docker cp "svp-redis:/data/dump.rdb" "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb" 2>/dev/null || warn "Redis backup skipped"
fi

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/${BACKUP_NAME}".* 2>/dev/null | awk '{print $1}')
log "Backup completed: $BACKUP_NAME ($BACKUP_SIZE)"

log "Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -name "svp_${ENVIRONMENT}_*" -mtime +30 -delete 2>/dev/null || true

BACKUP_COUNT=$(find "$BACKUP_DIR" -name "svp_${ENVIRONMENT}_*" | wc -l)
log "Total $ENVIRONMENT backups: $BACKUP_COUNT"

if [[ "$ENVIRONMENT" == "production" ]]; then
    log "Syncing backups to S3..."
    if command -v aws &>/dev/null; then
        aws s3 sync "$BACKUP_DIR" "s3://svp-backups/${ENVIRONMENT}/" \
            --exclude "*.tmp" \
            --storage-class STANDARD_IA || warn "S3 sync failed"
        log "S3 sync completed"
    else
        warn "AWS CLI not found, skipping S3 sync"
    fi
fi

log "Backup process finished."
