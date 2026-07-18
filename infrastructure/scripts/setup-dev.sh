#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

log "========================================="
log "Survey Verification Platform - Dev Setup"
log "========================================="

log "Checking prerequisites..."

check_command() {
    if command -v "$1" &>/dev/null; then
        log "$1: $(command -v "$1")"
        return 0
    else
        error "$1: NOT FOUND. Please install $1."
        return 1
    fi
}

check_command docker
check_command node
check_command npm
check_command java
check_command mvn
check_command cargo

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ required, found $(node -v)"
fi
log "Node.js version: $(node -v) ✓"

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 21 ]; then
    error "Java 21+ required, found $JAVA_VERSION"
fi
log "Java version: $JAVA_VERSION ✓"

RUST_VERSION=$(rustc --version 2>/dev/null | awk '{print $2}' || echo "unknown")
log "Rust version: $RUST_VERSION"

log ""
log "Setting up Frontend..."
cd "$PROJECT_ROOT/frontend"
if [ -f "package.json" ]; then
    npm ci
    npx prisma generate
    log "Frontend dependencies installed"
else
    warn "Frontend package.json not found, skipping"
fi

log ""
log "Setting up Backend..."
cd "$PROJECT_ROOT/backend"
if [ -f "pom.xml" ]; then
    mvn dependency:resolve -q
    mvn compile -q
    log "Backend dependencies resolved"
else
    warn "Backend pom.xml not found, skipping"
fi

log ""
log "Setting up AI Engine..."
cd "$PROJECT_ROOT/ai-engine"
if [ -f "Cargo.toml" ]; then
    cargo fetch
    cargo build
    log "AI Engine dependencies fetched and built"
else
    warn "AI Engine Cargo.toml not found, skipping"
fi

cd "$PROJECT_ROOT"

log ""
log "Starting development environment..."

docker compose up -d postgres redis

log "Waiting for PostgreSQL to be ready..."
RETRIES=0
MAX_RETRIES=30
until docker compose exec -T postgres pg_isready -U svp_user -d survey_verification 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
        error "PostgreSQL failed to start within $MAX_RETRIES attempts"
    fi
    sleep 2
done
log "PostgreSQL is ready"

log "Waiting for Redis to be ready..."
RETRIES=0
until docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
        error "Redis failed to start within $MAX_RETRIES attempts"
    fi
    sleep 2
done
log "Redis is ready"

log ""
log "Starting all services..."
docker compose up -d

log "Waiting for all services to be healthy..."
sleep 20

log ""
log "========================================="
log "Development environment is ready!"
log "========================================="
log ""
log "Services:"
log "  Frontend:    http://localhost:3000"
log "  Backend API: http://localhost:8080"
log "  AI Engine:   http://localhost:3001"
log "  Nginx:       http://localhost"
log "  PostgreSQL:  localhost:5432"
log "  Redis:       localhost:6379"
log ""
log "Monitoring:"
log "  Prometheus:  http://localhost:9090"
log "  Grafana:     http://localhost:3002 (admin/admin_dev_password)"
log "  Loki:        http://localhost:3100"
log "  Tempo:       http://localhost:3200"
log ""
log "Useful commands:"
log "  docker compose logs -f [service]    - View logs"
log "  docker compose restart [service]    - Restart a service"
log "  docker compose down                 - Stop all services"
log "  docker compose up -d --build        - Rebuild and start"
log ""
