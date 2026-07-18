# Vault Configuration - Survey Verification Platform
# BackOffice Pro (Pty) Ltd

# Storage Backend
storage "file" {
  path = "/vault/data"
}

# Storage Backend (Production - Consul)
# storage "consul" {
#   address = "consul.internal:8500"
#   path    = "vault/"
#   scheme  = "https"
# }

# TCP Listener
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/certs/vault.crt"
  tls_key_file  = "/vault/certs/vault.key"
  tls_min_version = "tls12"
  tls_cipher_suites = [
    "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
    "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
    "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384"
  ]
  tls_prefer_server_cipher_suites = true
}

# API and Cluster
api_addr     = "https://vault.backofficepro.com:8200"
cluster_addr = "https://vault.backofficepro.com:8201"

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}

# Default Lease TTL
default_lease_ttl = "24h"
max_lease_ttl     = "720h"

# UI
ui = true

# Log
log_level = "info"
log_format = "json"
