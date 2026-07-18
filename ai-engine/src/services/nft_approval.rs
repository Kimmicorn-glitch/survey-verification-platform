use chrono::Utc;
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::{
    NftApproval, NftApprovalStatus, NftAttribute, NftMetadata, SurveyVerificationRequest,
    TrustScore,
};

/// Minimum trust score required for NFT approval.
const MIN_TRUST_FOR_NFT: f64 = 0.7;

/// Maximum number of NFTs a single respondent can hold.
const MAX_NFTS_PER_RESPONDENT: u32 = 50;

/// NFT approval and metadata generation service. Determines whether a
/// respondent qualifies for an on-chain verification record and generates
/// the associated token metadata.
pub struct NftApprover;

impl NftApprover {
    /// Evaluate NFT eligibility and generate metadata if approved.
    pub async fn evaluate(
        request: &SurveyVerificationRequest,
        trust_score: &TrustScore,
        existing_nft_count: u32,
        fraud_risk_score: f64,
    ) -> AppResult<NftApproval> {
        // Check trust score threshold
        if trust_score.score < MIN_TRUST_FOR_NFT {
            return Ok(NftApproval {
                eligible: false,
                status: NftApprovalStatus::Rejected,
                metadata: None,
                rejection_reason: Some(format!(
                    "Trust score {:.2} is below minimum threshold {}",
                    trust_score.score, MIN_TRUST_FOR_NFT
                )),
            });
        }

        // Check fraud risk
        if fraud_risk_score > 0.5 {
            return Ok(NftApproval {
                eligible: false,
                status: NftApprovalStatus::Rejected,
                metadata: None,
                rejection_reason: Some(format!(
                    "Fraud risk score {:.2} exceeds acceptable threshold",
                    fraud_risk_score
                )),
            });
        }

        // Check NFT count limit
        if existing_nft_count >= MAX_NFTS_PER_RESPONDENT {
            return Ok(NftApproval {
                eligible: false,
                status: NftApprovalStatus::Rejected,
                metadata: None,
                rejection_reason: Some(format!(
                    "Respondent has reached maximum NFT limit of {}",
                    MAX_NFTS_PER_RESPONDENT
                )),
            });
        }

        // Check GPS validation
        if !trust_score.meets_threshold {
            return Ok(NftApproval {
                eligible: false,
                status: NftApprovalStatus::Pending,
                metadata: None,
                rejection_reason: Some("Trust score does not meet threshold requirements".to_string()),
            });
        }

        // Generate NFT metadata
        let metadata = Self::generate_metadata(request, trust_score, fraud_risk_score);

        Ok(NftApproval {
            eligible: true,
            status: NftApprovalStatus::Approved,
            metadata: Some(metadata),
            rejection_reason: None,
        })
    }

    /// Generate NFT token metadata for an approved survey verification.
    fn generate_metadata(
        request: &SurveyVerificationRequest,
        trust_score: &TrustScore,
        fraud_risk_score: f64,
    ) -> NftMetadata {
        let trust_tier = Self::trust_tier(trust_score.score);

        let attributes = vec![
            NftAttribute {
                trait_type: "survey_id".to_string(),
                value: serde_json::Value::String(request.survey_id.to_string()),
            },
            NftAttribute {
                trait_type: "respondent_id".to_string(),
                value: serde_json::Value::String(request.respondent_id.to_string()),
            },
            NftAttribute {
                trait_type: "trust_score".to_string(),
                value: serde_json::json!(trust_score.score),
            },
            NftAttribute {
                trait_type: "trust_tier".to_string(),
                value: serde_json::Value::String(trust_tier),
            },
            NftAttribute {
                trait_type: "gps_trust".to_string(),
                value: serde_json::json!(trust_score.gps_component),
            },
            NftAttribute {
                trait_type: "behaviour_trust".to_string(),
                value: serde_json::json!(trust_score.behaviour_component),
            },
            NftAttribute {
                trait_type: "fraud_risk".to_string(),
                value: serde_json::json!(fraud_risk_score),
            },
            NftAttribute {
                trait_type: "verification_date".to_string(),
                value: serde_json::Value::String(Utc::now().format("%Y-%m-%d").to_string()),
            },
            NftAttribute {
                trait_type: "history_count".to_string(),
                value: serde_json::json!(trust_score.history_count),
            },
        ];

        NftMetadata {
            name: format!(
                "Survey Verification #{} - {}",
                request.survey_id.to_string().split('-').next().unwrap_or("unknown"),
                trust_tier
            ),
            description: format!(
                "On-chain proof of verified survey completion. Trust score: {:.2}, Tier: {}",
                trust_score.score, trust_tier
            ),
            attributes,
            image: format!(
                "ipfs://verification/{}/metadata.json",
                request.survey_id
            ),
        }
    }

    /// Determine the trust tier based on the score.
    fn trust_tier(score: f64) -> String {
        if score >= 0.95 {
            "Platinum".to_string()
        } else if score >= 0.85 {
            "Gold".to_string()
        } else if score >= 0.75 {
            "Silver".to_string()
        } else if score >= 0.65 {
            "Bronze".to_string()
        } else {
            "Standard".to_string()
        }
    }

    /// Generate a unique token ID from request data.
    pub fn generate_token_id(
        survey_id: &Uuid,
        respondent_id: &Uuid,
    ) -> String {
        use sha2::{Digest, Sha256};
        let input = format!("{}:{}", survey_id, respondent_id);
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        let result = hasher.finalize();
        hex::encode(&result[..16])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::TrustScore;

    fn make_request() -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({}),
            completed_at: Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        }
    }

    fn make_trust_score(score: f64, meets: bool) -> TrustScore {
        TrustScore {
            score,
            gps_component: score,
            behaviour_component: score,
            history_component: score,
            fingerprint_component: score,
            history_count: 10,
            meets_threshold: meets,
        }
    }

    #[tokio::test]
    async fn test_high_trust_approved() {
        let request = make_request();
        let trust = make_trust_score(0.9, true);
        let result = NftApprover::evaluate(&request, &trust, 5, 0.1)
            .await
            .unwrap();
        assert!(result.eligible);
        assert_eq!(result.status, NftApprovalStatus::Approved);
        assert!(result.metadata.is_some());
    }

    #[tokio::test]
    async fn test_low_trust_rejected() {
        let request = make_request();
        let trust = make_trust_score(0.4, false);
        let result = NftApprover::evaluate(&request, &trust, 0, 0.1)
            .await
            .unwrap();
        assert!(!result.eligible);
        assert_eq!(result.status, NftApprovalStatus::Rejected);
    }

    #[tokio::test]
    async fn test_high_fraud_rejected() {
        let request = make_request();
        let trust = make_trust_score(0.9, true);
        let result = NftApprover::evaluate(&request, &trust, 0, 0.8)
            .await
            .unwrap();
        assert!(!result.eligible);
        assert_eq!(result.status, NftApprovalStatus::Rejected);
    }

    #[tokio::test]
    async fn test_max_nfts_rejected() {
        let request = make_request();
        let trust = make_trust_score(0.9, true);
        let result = NftApprover::evaluate(&request, &trust, MAX_NFTS_PER_RESPONDENT, 0.1)
            .await
            .unwrap();
        assert!(!result.eligible);
    }

    #[tokio::test]
    async fn test_pending_status() {
        let request = make_request();
        let trust = make_trust_score(0.8, false);
        let result = NftApprover::evaluate(&request, &trust, 0, 0.1)
            .await
            .unwrap();
        assert!(!result.eligible);
        assert_eq!(result.status, NftApprovalStatus::Pending);
    }

    #[test]
    fn test_trust_tier() {
        assert_eq!(NftApprover::trust_tier(0.98), "Platinum");
        assert_eq!(NftApprover::trust_tier(0.90), "Gold");
        assert_eq!(NftApprover::trust_tier(0.80), "Silver");
        assert_eq!(NftApprover::trust_tier(0.70), "Bronze");
        assert_eq!(NftApprover::trust_tier(0.50), "Standard");
    }

    #[test]
    fn test_token_id_deterministic() {
        let s = Uuid::new_v4();
        let r = Uuid::new_v4();
        let id1 = NftApprover::generate_token_id(&s, &r);
        let id2 = NftApprover::generate_token_id(&s, &r);
        assert_eq!(id1, id2);
    }

    #[test]
    fn test_token_id_unique() {
        let s = Uuid::new_v4();
        let r1 = Uuid::new_v4();
        let r2 = Uuid::new_v4();
        let id1 = NftApprover::generate_token_id(&s, &r1);
        let id2 = NftApprover::generate_token_id(&s, &r2);
        assert_ne!(id1, id2);
    }
}
