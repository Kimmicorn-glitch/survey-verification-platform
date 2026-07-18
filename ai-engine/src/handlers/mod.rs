use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use uuid::Uuid;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};
use crate::handlers::AppState;
use crate::middleware::AuthContext;
use crate::models::*;
use crate::repository::DatabasePool;
use crate::services::behaviour_analysis::BehaviourAnalyser;
use crate::services::confidence_scoring::ConfidenceScorer;
use crate::services::duplicate_detection::DuplicateDetector;
use crate::services::fraud_detection::FraudDetector;
use crate::services::gps_verification::GpsVerifier;
use crate::services::nft_approval::NftApprover;
use crate::services::trust_score::TrustScoreCalculator;

/// Shared application state accessible by all handlers.
pub struct AppState {
    pub config: AppConfig,
    pub db: DatabasePool,
}

/// Health check endpoint.
pub async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_secs: {
            static START: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();
            let start = START.get_or_init(std::time::Instant::now);
            start.elapsed().as_secs()
        },
    })
}

/// Main survey verification endpoint.
pub async fn verify_survey(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SurveyVerificationRequest>,
) -> AppResult<Json<VerificationResponse>> {
    let timeout_result = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        verify_survey_inner(state, request),
    )
    .await;

    match timeout_result {
        Ok(result) => result,
        Err(_) => {
            tracing::error!("Survey verification timed out after 30 seconds");
            Err(AppError::Timeout)
        }
    }
}

async fn verify_survey_inner(
    state: Arc<AppState>,
    request: SurveyVerificationRequest,
) -> AppResult<Json<VerificationResponse>> {
    tracing::info!(
        request_id = %request.request_id,
        survey_id = %request.survey_id,
        "Processing survey verification"
    );

    let req_clone = request.clone();
    let geo_result = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(GpsVerifier::verify(&req_clone))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;
    let gps_trust = if geo_result.passed { 0.9 } else { 0.3 };

    let req_clone = request.clone();
    let fraud_result = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(FraudDetector::analyze(&req_clone))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let req_clone = request.clone();
    let behaviour_result = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(BehaviourAnalyser::analyze(&req_clone))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let behaviour_trust = if behaviour_result.is_normal {
        0.85
    } else {
        1.0 - behaviour_result.risk_score
    };

    let known_fingerprints = state
        .db
        .get_known_fingerprints(&request.survey_id, &request.fingerprint)
        .await
        .unwrap_or_default();
    let req_clone = request.clone();
    let fp_clone = known_fingerprints;
    let dup_result = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current()
            .block_on(DuplicateDetector::detect(&req_clone, &fp_clone))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let fingerprint_trust = if dup_result.is_duplicate {
        0.1
    } else {
        0.9
    };

    let (history_count, historical_avg) = state
        .db
        .get_respondent_history(&request.respondent_id)
        .await
        .unwrap_or((0, None));

    let req_clone = request.clone();
    let trust_score = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(TrustScoreCalculator::calculate(
            &req_clone,
            gps_trust,
            behaviour_trust,
            fingerprint_trust,
            history_count,
            historical_avg,
        ))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let existing_nft_count = state
        .db
        .get_respondent_nft_count(&request.respondent_id)
        .await
        .unwrap_or(0);

    let trust_clone = trust_score.clone();
    let req_clone = request.clone();
    let fraud_risk = fraud_result.risk_score;
    let nft_result = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(NftApprover::evaluate(
            &req_clone,
            &trust_clone,
            existing_nft_count,
            fraud_risk,
        ))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let geo_clone = geo_result.clone();
    let fraud_clone = fraud_result.clone();
    let beh_clone = behaviour_result.clone();
    let dup_clone = dup_result.clone();
    let req_clone = request.clone();
    let confidence = tokio::task::spawn_blocking(move || {
        tokio::runtime::Handle::current().block_on(ConfidenceScorer::calculate(
            &req_clone,
            &geo_clone,
            &fraud_clone,
            &beh_clone,
            &dup_clone,
        ))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    let mut flags = Vec::new();
    if fraud_result.is_fraudulent {
        flags.push("FRAUD_DETECTED".to_string());
    }
    if dup_result.is_duplicate {
        flags.push("DUPLICATE_FOUND".to_string());
    }
    if behaviour_result.timing.suggests_bot {
        flags.push("BOT_TIMING".to_string());
    }
    if !geo_result.passed && request.gps_coordinates.is_some() {
        flags.push("GPS_MISMATCH".to_string());
    }
    if confidence.score < 0.4 {
        flags.push("LOW_CONFIDENCE".to_string());
    }

    let passed = trust_score.meets_threshold
        && !fraud_result.is_fraudulent
        && !dup_result.is_duplicate
        && confidence.sufficient_data;

    let result = VerificationResult {
        id: Uuid::new_v4(),
        request_id: request.request_id,
        survey_id: request.survey_id,
        respondent_id: request.respondent_id,
        passed,
        trust_score: trust_score.clone(),
        fraud_analysis: fraud_result,
        geo_validation: geo_result,
        nft_approval: nft_result,
        behaviour_analysis: behaviour_result,
        duplicate_detection: dup_result,
        confidence,
        verified_at: Utc::now(),
        flags,
    };

    if let Err(e) = state.db.save_verification_result(&result).await {
        tracing::error!(error = %e, "Failed to save verification result");
    }

    tracing::info!(
        request_id = %request.request_id,
        passed = passed,
        trust_score = trust_score.score,
        "Verification complete"
    );

    Ok(Json(VerificationResponse {
        success: true,
        result,
    }))
}

/// Get verification result by ID.
pub async fn get_verification(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<VerificationResult>> {
    let result = state.db.get_verification_by_id(&id).await?;
    Ok(Json(result))
}

/// Get trust score for a respondent.
pub async fn get_trust_score(
    State(state): State<Arc<AppState>>,
    Path(respondent_id): Path<Uuid>,
) -> AppResult<Json<TrustScore>> {
    let (count, avg) = state
        .db
        .get_respondent_history(&respondent_id)
        .await
        .unwrap_or((0, None));

    let (gps_trust, behaviour_trust, fingerprint_trust) = if count > 0 {
        let avg_trust = avg.unwrap_or(0.5);
        let gps_component = avg_trust * 0.95;
        let behaviour_component = avg_trust * 0.90;
        let fingerprint_component = avg_trust * 0.85;
        (gps_component, behaviour_component, fingerprint_component)
    } else {
        (0.5, 0.5, 0.5)
    };

    let request_placeholder = SurveyVerificationRequest {
        request_id: Uuid::new_v4(),
        survey_id: Uuid::new_v4(),
        respondent_id,
        gps_coordinates: None,
        response_data: serde_json::json!({}),
        completed_at: Utc::now(),
        fingerprint: String::new(),
        ip_address: None,
        user_agent: None,
        expected_geohash: None,
        device_metadata: None,
    };

    let score = TrustScoreCalculator::calculate(
        &request_placeholder,
        gps_trust,
        behaviour_trust,
        fingerprint_trust,
        count,
        avg,
    )
    .await?;

    Ok(Json(score))
}

/// Run fraud analysis on a request without full verification.
pub async fn analyze_fraud(
    Json(request): Json<SurveyVerificationRequest>,
) -> AppResult<Json<FraudAnalysis>> {
    let result = FraudDetector::analyze(&request).await?;
    Ok(Json(result))
}

/// Run GPS validation on a request.
pub async fn validate_gps(
    Json(request): Json<SurveyVerificationRequest>,
) -> AppResult<Json<GeoValidation>> {
    let result = GpsVerifier::verify(&request).await?;
    Ok(Json(result))
}

/// Run behavioural analysis on a request.
pub async fn analyze_behaviour(
    Json(request): Json<SurveyVerificationRequest>,
) -> AppResult<Json<BehaviourAnalysis>> {
    let result = BehaviourAnalyser::analyze(&request).await?;
    Ok(Json(result))
}

/// Get NFT eligibility for a respondent.
pub async fn get_nft_eligibility(
    State(state): State<Arc<AppState>>,
    Path(respondent_id): Path<Uuid>,
) -> AppResult<Json<NftApproval>> {
    let (count, avg) = state
        .db
        .get_respondent_history(&respondent_id)
        .await
        .unwrap_or((0, None));

    let (gps_trust, behaviour_trust, fingerprint_trust) = if count > 0 {
        let avg_trust = avg.unwrap_or(0.5);
        let gps_component = avg_trust * 0.95;
        let behaviour_component = avg_trust * 0.90;
        let fingerprint_component = avg_trust * 0.85;
        (gps_component, behaviour_component, fingerprint_component)
    } else {
        (0.5, 0.5, 0.5)
    };

    let request_placeholder = SurveyVerificationRequest {
        request_id: Uuid::new_v4(),
        survey_id: Uuid::new_v4(),
        respondent_id,
        gps_coordinates: None,
        response_data: serde_json::json!({}),
        completed_at: Utc::now(),
        fingerprint: String::new(),
        ip_address: None,
        user_agent: None,
        expected_geohash: None,
        device_metadata: None,
    };

    let trust = TrustScoreCalculator::calculate(&request_placeholder, gps_trust, behaviour_trust, fingerprint_trust, count, avg)
        .await?;

    let nft_count = state.db.get_respondent_nft_count(&respondent_id).await.unwrap_or(0);

    let fraud_risk = if trust.score < 0.4 { 0.5 } else if trust.score < 0.7 { 0.2 } else { 0.1 };
    let result = NftApprover::evaluate(&request_placeholder, &trust, nft_count, fraud_risk).await?;
    Ok(Json(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_health_check() {
        let resp = health_check().await;
        assert_eq!(resp.0.status, "ok");
    }

    #[tokio::test]
    async fn test_fraud_analysis_endpoint() {
        let request = SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({"q1": "yes"}),
            completed_at: Utc::now(),
            fingerprint: "test-fingerprint-abc".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        };

        let result = analyze_fraud(Json(request)).await.unwrap();
        assert!(result.0.risk_score >= 0.0);
        assert!(result.0.risk_score <= 1.0);
    }

    #[tokio::test]
    async fn test_gps_validation_endpoint() {
        let request = SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: Some(GpsCoordinate {
                latitude: -26.2041,
                longitude: 28.0473,
                accuracy: Some(10.0),
                timestamp: None,
            }),
            response_data: serde_json::json!({}),
            completed_at: Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        };

        let result = validate_gps(Json(request)).await.unwrap();
        assert!(result.0.passed);
        assert!(result.0.coordinates_valid);
    }

    #[tokio::test]
    async fn test_behaviour_analysis_endpoint() {
        let request = SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({"q1": "yes", "q2": "no"}),
            completed_at: Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        };

        let result = analyze_behaviour(Json(request)).await.unwrap();
        assert!(result.0.risk_score >= 0.0);
    }
}
