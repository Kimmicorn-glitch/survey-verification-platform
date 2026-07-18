#!/bin/bash
# Vault Initialization Script - Survey Verification Platform
# BackOffice Pro (Pty) Ltd
# WARNING: Run this only once on first deployment

set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-https://vault.backofficepro.com:8200}"
VAULT_TOKEN="${VAULT_TOKEN:-}"
KEY_SHARES=5
KEY_THRESHOLD=3

echo "=== Survey Verification Platform - Vault Initialization ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Check if already initialized
INIT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VAULT_ADDR/v1/sys/init" 2>/dev/null || echo "000")

if [ "$INIT_STATUS" = "200" ]; then
    INITIALIZED=$(curl -s "$VAULT_ADDR/v1/sys/init" | python3 -c "import sys,json; print(json.load(sys.stdin)['initialized'])" 2>/dev/null || echo "true")
    if [ "$INITIALIZED" = "true" ]; then
        echo "Vault is already initialized. Skipping initialization."
        echo "Provide VAULT_TOKEN to continue with unsealing and configuration."
        if [ -z "$VAULT_TOKEN" ]; then
            echo "ERROR: VAULT_TOKEN is required when Vault is already initialized."
            exit 1
        fi
    fi
fi

# Step 1: Initialize Vault
echo ""
echo "Step 1: Initializing Vault (Shamir: ${KEY_THRESHOLD}/${KEY_SHARES})..."
INIT_RESPONSE=$(curl -s -X PUT "$VAULT_ADDR/v1/sys/init" \
    -d "{\"secret_shares\":${KEY_SHARES},\"secret_threshold\":${KEY_THRESHOLD}}" 2>/dev/null)

if [ -z "$INIT_RESPONSE" ]; then
    echo "ERROR: Failed to connect to Vault at $VAULT_ADDR"
    exit 1
fi

# Save initialization keys securely
VAULT_KEYS_FILE="/vault/config/vault-init-keys.json"
echo "$INIT_RESPONSE" > "$VAULT_KEYS_FILE"
chmod 600 "$VAULT_KEYS_FILE"

echo "Initialization keys saved to: $VAULT_KEYS_FILE"
echo "WARNING: Store these keys securely and delete this file after backing up!"

# Extract keys for unsealing
UNSEAL_KEY_1=$(echo "$INIT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['keys'][0])")
UNSEAL_KEY_2=$(echo "$INIT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['keys'][1])")
UNSEAL_KEY_3=$(echo "$INIT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['keys'][2])")
VAULT_ROOT_TOKEN=$(echo "$INIT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['root_token'])")

# Step 2: Unseal Vault
echo ""
echo "Step 2: Unsealing Vault..."
curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" -d "{\"key\":\"${UNSEAL_KEY_1}\"}" > /dev/null
curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" -d "{\"key\":\"${UNSEAL_KEY_2}\"}" > /dev/null
curl -s -X PUT "$VAULT_ADDR/v1/sys/unseal" -d "{\"key\":\"${UNSEAL_KEY_3}\"}" > /dev/null
echo "Vault unsealed successfully."

# Set token for subsequent operations
export VAULT_TOKEN="$VAULT_ROOT_TOKEN"

# Step 3: Enable KV v2 Secrets Engine
echo ""
echo "Step 3: Enabling KV v2 Secrets Engine..."
curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/secret" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{"type":"kv","options":{"version":"2"}}' > /dev/null
echo "KV v2 mounted at secret/"

# Step 4: Enable Database Secrets Engine
echo ""
echo "Step 4: Enabling Database Secrets Engine..."
curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/database" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{"type":"database"}' > /dev/null
echo "Database secrets engine mounted."

# Step 5: Configure PostgreSQL Connection
echo ""
echo "Step 5: Configuring PostgreSQL connection..."
curl -s -X POST "$VAULT_ADDR/v1/database/config/survey-platform" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "plugin_name": "postgresql-database-plugin",
        "connection_url": "postgresql://{{username}}:{{password}}@postgres:5432/survey_platform?sslmode=disable",
        "allowed_roles": ["svp-readonly","svp-readwrite"],
        "username": "vault_admin",
        "password": "'"${POSTGRES_VAULT_PASSWORD}"'"
    }' > /dev/null
echo "PostgreSQL connection configured."

# Step 6: Create Database Roles
echo ""
echo "Step 6: Creating database roles..."

# Read-only role
curl -s -X POST "$VAULT_ADDR/v1/database/roles/svp-readonly" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "db_name": "survey-platform",
        "default_ttl": "1h",
        "max_ttl": "24h",
        "creation_statements": [
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD \"{{password}}\" VALID UNTIL \"{{expiration}}\";",
            "GRANT SELECT ON ALL TABLES IN SCHEMA survey TO \"{{name}}\";",
            "GRANT SELECT ON ALL TABLES IN SCHEMA verification TO \"{{name}}\";",
            "GRANT SELECT ON ALL TABLES IN SCHEMA nft TO \"{{name}}\";",
            "GRANT SELECT ON ALL TABLES IN SCHEMA payment TO \"{{name}}\";",
            "GRANT SELECT ON ALL TABLES IN SCHEMA audit TO \"{{name}}\";",
            "GRANT USAGE ON SCHEMA survey, verification, nft, payment, audit TO \"{{name}}\";"
        ],
        "revocation_statements": [
            "REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA survey, verification, nft, payment, audit FROM \"{{name}}\";",
            "DROP ROLE IF EXISTS \"{{name}}\";"
        ]
    }' > /dev/null
echo "  - svp-readonly role created."

# Read-write role
curl -s -X POST "$VAULT_ADDR/v1/database/roles/svp-readwrite" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "db_name": "survey-platform",
        "default_ttl": "1h",
        "max_ttl": "24h",
        "creation_statements": [
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD \"{{password}}\" VALID UNTIL \"{{expiration}}\";",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA survey TO \"{{name}}\";",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA verification TO \"{{name}}\";",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nft TO \"{{name}}\";",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payment TO \"{{name}}\";",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA audit TO \"{{name}}\";",
            "GRANT USAGE ON SCHEMA survey, verification, nft, payment, audit TO \"{{name}}\";",
            "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA survey, verification, nft, payment, audit TO \"{{name}}\";"
        ],
        "revocation_statements": [
            "REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA survey, verification, nft, payment, audit FROM \"{{name}}\";",
            "REVOKE USAGE ON ALL SEQUENCES IN SCHEMA survey, verification, nft, payment, audit FROM \"{{name}}\";",
            "DROP ROLE IF EXISTS \"{{name}}\";"
        ]
    }' > /dev/null
echo "  - svp-readwrite role created."

# Step 7: Store Application Secrets
echo ""
echo "Step 7: Storing application secrets..."
curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/database" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "host": "postgres",
            "port": "5432",
            "database": "survey_platform",
            "username": "svp_app",
            "password": "'"${POSTGRES_PASSWORD:-changeme}"'",
            "ssl_mode": "disable"
        }
    }' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/jwt" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "secret": "'"${JWT_SECRET:-$(openssl rand -hex 32)}"'",
            "expiry": "86400000",
            "refresh_expiry": "604800000",
            "issuer": "survey-platform"
        }
    }' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/stripe" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "secret_key": "'"${STRIPE_SECRET_KEY:-sk_test_placeholder}"'",
            "webhook_secret": "'"${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}"'",
            "publishable_key": "'"${STRIPE_PUBLISHABLE_KEY:-pk_test_placeholder}"'"
        }
    }' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/redis" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "host": "redis",
            "port": "6379",
            "password": "'"${REDIS_PASSWORD:-changeme}"'"
        }
    }' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/blockchain" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "private_key": "'"${BLOCKCHAIN_PRIVATE_KEY:-placeholder}"'",
            "rpc_url_ethereum": "'"${ETH_RPC_URL:-https://rpc.sepolia.org}"'",
            "rpc_url_polygon": "'"${MATIC_RPC_URL:-https://rpc-amoy.polygon.technology}"'",
            "contract_address_survey_nft": "'"${SURVEY_NFT_CONTRACT:-}"'",
            "contract_address_verification": "'"${VERIFICATION_REGISTRY_CONTRACT:-}"'"
        }
    }' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/secret/data/svp/ai-engine" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{
        "data": {
            "api_key": "'"${AI_API_KEY:-placeholder}"'",
            "model_path": "/models/fraud-detection-v1.onnx"
        }
    }' > /dev/null

echo "Application secrets stored."

# Step 8: Enable Transit Secrets Engine
echo ""
echo "Step 8: Enabling Transit Secrets Engine..."
curl -s -X POST "$VAULT_ADDR/v1/sys/mounts/transit" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{"type":"transit"}' > /dev/null

curl -s -X POST "$VAULT_ADDR/v1/transit/keys/svp-encryption" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d '{"type":"aes256-gcm96","exportable":false,"allow_plaintext_backup":false}' > /dev/null
echo "Transit engine configured with svp-encryption key."

# Step 9: Write SVP Policy
echo ""
echo "Step 9: Writing SVP policy..."
POLICY=$(cat "$(dirname "$0")/../policies/svp-policy.hcl")
curl -s -X PUT "$VAULT_ADDR/v1/sys/policies/acl/svp-application" \
    -H "X-Vault-Token: $VAULT_TOKEN" \
    -d "{\"policy\":\"$(echo "$POLICY" | sed 's/"/\\"/g' | tr '\n' ' ')\"}" > /dev/null
echo "SVP policy written."

echo ""
echo "=== Vault Initialization Complete ==="
echo "Root Token: $VAULT_ROOT_TOKEN"
echo "Unseal Keys: See $VAULT_KEYS_FILE"
echo ""
echo "Next steps:"
echo "1. Distribute unseal keys to key holders"
echo "2. Backup the root token securely"
echo "3. Delete $VAULT_KEYS_FILE after backup"
echo "4. Enable audit logging: vault audit enable file file_path=/vault/logs/audit.log"
