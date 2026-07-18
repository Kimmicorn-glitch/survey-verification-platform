CREATE TABLE identity.wallet_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    chain_id INTEGER NOT NULL,
    chain_name VARCHAR(100) NOT NULL,
    wallet_type VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    last_connected_at TIMESTAMP,
    connection_metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_wallet_connections_user ON identity.wallet_connections(user_id);
CREATE INDEX idx_wallet_connections_address ON identity.wallet_connections(wallet_address);
CREATE INDEX idx_wallet_connections_user_primary ON identity.wallet_connections(user_id, is_primary) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_wallet_connections_user_address_unique ON identity.wallet_connections(user_id, wallet_address) WHERE deleted = FALSE;
