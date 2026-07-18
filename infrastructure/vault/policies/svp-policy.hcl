# SVP Application Policy - Survey Verification Platform
# Grants least-privilege access for the application services

# KV Secrets Engine - Application Secrets
path "secret/data/svp/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/svp/*" {
  capabilities = ["read", "list"]
}

# Database Secrets Engine - Read-only credentials
path "database/creds/svp-readonly" {
  capabilities = ["read"]
}

# Database Secrets Engine - Read-write credentials
path "database/creds/svp-readwrite" {
  capabilities = ["read"]
}

# Transit Secrets Engine - Encryption
path "transit/encrypt/svp-*" {
  capabilities = ["update"]
}

# Transit Secrets Engine - Decryption
path "transit/decrypt/svp-*" {
  capabilities = ["update"]
}

# Transit - Key management
path "transit/keys/svp-*" {
  capabilities = ["read", "list"]
}

# PKI - Certificate issuance (for mTLS)
path "pki/issue/svp" {
  capabilities = ["create", "update"]
}

path "pki/cert/ca" {
  capabilities = ["read"]
}

# Identity - Entity lookups
path "identity/entity/id/*" {
  capabilities = ["read", "list"]
}

# Lease management
path "sys/leases/revoke" {
  capabilities = ["create", "update"]
}

# Audit log access (read-only)
path "sys/audit" {
  capabilities = ["read", "list"]
}
