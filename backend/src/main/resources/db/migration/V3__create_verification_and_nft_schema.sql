CREATE TABLE verification.verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL,
    respondent_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    confidence_score DECIMAL(5,4),
    trust_score DECIMAL(5,4),
    fraud_score DECIMAL(5,4),
    ai_analysis JSONB,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    gps_geohash VARCHAR(12),
    device_fingerprint VARCHAR(500),
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    verification_hash VARCHAR(500),
    blockchain_tx_hash VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE verification.verification_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES verification.verification_requests(id),
    flag_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description VARCHAR(1000),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE nft.nft_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL,
    respondent_id VARCHAR(255) NOT NULL,
    token_id BIGINT,
    contract_address VARCHAR(100),
    network VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRE_MINT',
    metadata_uri VARCHAR(500),
    metadata JSONB,
    trust_tier VARCHAR(20),
    minted_at TIMESTAMP,
    transferred_at TIMESTAMP,
    owner_address VARCHAR(100),
    tx_hash VARCHAR(100),
    gas_used BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_verification_survey ON verification.verification_requests(survey_id);
CREATE INDEX idx_verification_respondent ON verification.verification_requests(respondent_id);
CREATE INDEX idx_verification_status ON verification.verification_requests(status) WHERE deleted = FALSE;
CREATE INDEX idx_verification_flags_verification ON verification.verification_flags(verification_id);
CREATE INDEX idx_nft_tokens_respondent ON nft.nft_tokens(respondent_id);
CREATE INDEX idx_nft_tokens_status ON nft.nft_tokens(status) WHERE deleted = FALSE;
CREATE INDEX idx_nft_tokens_contract ON nft.nft_tokens(contract_address, token_id);
