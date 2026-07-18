use chrono::{DateTime, Utc};
use sqlx::postgres::{PgPool, PgPoolOptions};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::VerificationResult;

/// Database connection pool wrapper.
#[derive(Clone)]
pub struct DatabasePool {
    pool: PgPool,
}

impl DatabasePool {
    /// Create a new database pool from a connection string.
    pub async fn connect(database_url: &str) -> AppResult<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(20)
            .min_connections(2)
            .acquire_timeout(std::time::Duration::from_secs(10))
            .idle_timeout(std::time::Duration::from_secs(300))
            .connect(database_url)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        tracing::info!("Database pool connected successfully");

        Ok(Self { pool })
    }

    /// Save a verification result to the database.
    pub async fn save_verification_result(&self, result: &VerificationResult) -> AppResult<()> {
        let result_json = serde_json::to_value(result)
            .map_err(|e| AppError::Database(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO verification_results (
                id, request_id, survey_id, respondent_id, passed,
                trust_score, fraud_analysis, geo_validation,
                nft_approval, behaviour_analysis, duplicate_detection,
                confidence, verified_at, flags
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            ON CONFLICT (id) DO NOTHING
            "#,
        )
        .bind(result.id)
        .bind(result.request_id)
        .bind(result.survey_id)
        .bind(result.respondent_id)
        .bind(result.passed)
        .bind(result.trust_score.score)
        .bind(serde_json::to_value(&result.fraud_analysis).unwrap_or_default())
        .bind(serde_json::to_value(&result.geo_validation).unwrap_or_default())
        .bind(serde_json::to_value(&result.nft_approval).unwrap_or_default())
        .bind(serde_json::to_value(&result.behaviour_analysis).unwrap_or_default())
        .bind(serde_json::to_value(&result.duplicate_detection).unwrap_or_default())
        .bind(serde_json::to_value(&result.confidence).unwrap_or_default())
        .bind(result.verified_at)
        .bind(&result.flags)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        tracing::debug!(result_id = %result.id, "Verification result saved");
        Ok(())
    }

    /// Retrieve a verification result by its ID.
    pub async fn get_verification_by_id(&self, id: &Uuid) -> AppResult<VerificationResult> {
        let row = sqlx::query_as::<_, VerificationRow>(
            "SELECT * FROM verification_results WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound(format!("Verification {} not found", id)))?;

        row.try_into()
    }

    /// Get known fingerprints for a survey, excluding the given one.
    pub async fn get_known_fingerprints(
        &self,
        survey_id: &Uuid,
        exclude_fingerprint: &str,
    ) -> AppResult<Vec<(Uuid, String, serde_json::Value)>> {
        let rows = sqlx::query_as::<_, FingerprintRow>(
            r#"
            SELECT DISTINCT respondent_id, fingerprint, response_data
            FROM verification_requests
            WHERE survey_id = $1 AND fingerprint != $2
            "#,
        )
        .bind(survey_id)
        .bind(exclude_fingerprint)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(rows
            .into_iter()
            .map(|r| (r.respondent_id, r.fingerprint, r.response_data))
            .collect())
    }

    /// Get the respondent's verification history.
    pub async fn get_respondent_history(
        &self,
        respondent_id: &Uuid,
    ) -> AppResult<(u32, Option<f64>)> {
        let row = sqlx::query_as::<_, HistoryRow>(
            r#"
            SELECT
                COUNT(*)::INT4 as count,
                AVG(trust_score) as avg_score
            FROM verification_results
            WHERE respondent_id = $1 AND verified_at > NOW() - INTERVAL '90 days'
            "#,
        )
        .bind(respondent_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        match row {
            Some(r) => Ok((r.count as u32, r.avg_score)),
            None => Ok((0, None)),
        }
    }

    /// Get the number of NFTs owned by a respondent.
    pub async fn get_respondent_nft_count(&self, respondent_id: &Uuid) -> AppResult<u32> {
        let row = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*) FROM nft_tokens
            WHERE respondent_id = $1 AND status = 'approved'
            "#,
        )
        .bind(respondent_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(row.unwrap_or(0) as u32)
    }
}

#[derive(sqlx::FromRow)]
struct VerificationRow {
    id: Uuid,
    request_id: Uuid,
    survey_id: Uuid,
    respondent_id: Uuid,
    passed: bool,
    trust_score: f64,
    fraud_analysis: serde_json::Value,
    geo_validation: serde_json::Value,
    nft_approval: serde_json::Value,
    behaviour_analysis: serde_json::Value,
    duplicate_detection: serde_json::Value,
    confidence: serde_json::Value,
    verified_at: DateTime<Utc>,
    flags: Vec<String>,
}

#[derive(sqlx::FromRow)]
struct FingerprintRow {
    respondent_id: Uuid,
    fingerprint: String,
    response_data: serde_json::Value,
}

#[derive(sqlx::FromRow)]
struct HistoryRow {
    count: i64,
    avg_score: Option<f64>,
}

impl TryInto<crate::models::VerificationResult> for VerificationRow {
    type Error = AppError;

    fn try_into(self) -> AppResult<crate::models::VerificationResult> {
        let trust_score: crate::models::TrustScore =
            serde_json::from_value(self.fraud_analysis.clone())
                .unwrap_or(crate::models::TrustScore {
                    score: self.trust_score,
                    gps_component: 0.5,
                    behaviour_component: 0.5,
                    history_component: 0.5,
                    fingerprint_component: 0.5,
                    history_count: 0,
                    meets_threshold: self.trust_score >= 0.6,
                });

        let fraud_analysis: crate::models::FraudAnalysis =
            serde_json::from_value(self.fraud_analysis.clone())
                .unwrap_or(crate::models::FraudAnalysis {
                    risk_score: 0.0,
                    is_fraudulent: false,
                    anomalies: vec![],
                    statistical_deviation: crate::models::StatisticalDeviation {
                        timing_z_score: 0.0,
                        pattern_z_score: 0.0,
                        chi_squared: 0.0,
                        entropy: 0.0,
                        is_outlier: false,
                    },
                    timing_score: 0.0,
                    ip_indicators: None,
                    device_indicators: crate::models::DeviceIndicators {
                        is_known_device: false,
                        survey_count: 0,
                        is_consistent: true,
                        risk_score: 0.0,
                    },
                });

        let geo_validation: crate::models::GeoValidation =
            serde_json::from_value(self.geo_validation).unwrap_or(crate::models::GeoValidation {
                passed: false,
                reported_geohash: None,
                expected_geohash: None,
                distance_meters: None,
                precision: 8,
                coordinates_valid: false,
                accuracy_meters: None,
            });

        let nft_approval: crate::models::NftApproval =
            serde_json::from_value(self.nft_approval).unwrap_or(crate::models::NftApproval {
                eligible: false,
                status: crate::models::NftApprovalStatus::Pending,
                metadata: None,
                rejection_reason: None,
            });

        let behaviour_analysis: crate::models::BehaviourAnalysis =
            serde_json::from_value(self.behaviour_analysis)
                .unwrap_or(crate::models::BehaviourAnalysis {
                    is_normal: true,
                    timing: crate::models::TimingAnalysis {
                        avg_time_per_question_ms: 0.0,
                        std_dev_ms: 0.0,
                        min_time_ms: 0.0,
                        max_time_ms: 0.0,
                        coefficient_of_variation: 0.0,
                        suggests_bot: false,
                        suggests_rushing: false,
                    },
                    pattern: crate::models::PatternAnalysis {
                        entropy: 0.0,
                        straight_line_detected: false,
                        acquiescence_bias: 0.0,
                        sequence_complexity: 0.0,
                        human_like: true,
                    },
                    session: crate::models::SessionAnalysis {
                        total_duration_secs: 0.0,
                        tab_switches: 0,
                        pause_count: 0,
                        avg_inter_question_gap_ms: 0.0,
                        is_consistent: true,
                    },
                    risk_score: 0.0,
                });

        let duplicate_detection: crate::models::DuplicateDetection =
            serde_json::from_value(self.duplicate_detection)
                .unwrap_or(crate::models::DuplicateDetection {
                    is_duplicate: false,
                    similarity_score: 0.0,
                    matched_survey_id: None,
                    matched_fields: vec![],
                });

        let confidence: crate::models::ConfidenceScore =
            serde_json::from_value(self.confidence).unwrap_or(crate::models::ConfidenceScore {
                score: 0.0,
                gps_confidence: 0.0,
                timing_confidence: 0.0,
                device_confidence: 0.0,
                history_confidence: 0.0,
                factor_count: 0,
                sufficient_data: false,
            });

        Ok(crate::models::VerificationResult {
            id: self.id,
            request_id: self.request_id,
            survey_id: self.survey_id,
            respondent_id: self.respondent_id,
            passed: self.passed,
            trust_score,
            fraud_analysis,
            geo_validation,
            nft_approval,
            behaviour_analysis,
            duplicate_detection,
            confidence,
            verified_at: self.verified_at,
            flags: self.flags,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_pool_clone() {
        // Just verify the type is cloneable at compile time
        fn assert_clone<T: Clone>() {}
        assert_clone::<DatabasePool>();
    }

    #[test]
    fn test_verification_row_conversion() {
        let row = VerificationRow {
            id: Uuid::new_v4(),
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            passed: true,
            trust_score: 0.85,
            fraud_analysis: serde_json::json!({}),
            geo_validation: serde_json::json!({}),
            nft_approval: serde_json::json!({}),
            behaviour_analysis: serde_json::json!({}),
            duplicate_detection: serde_json::json!({}),
            confidence: serde_json::json!({}),
            verified_at: Utc::now(),
            flags: vec!["TEST".to_string()],
        };

        let result: crate::models::VerificationResult = row.try_into().unwrap();
        assert!(result.passed);
        assert_eq!(result.flags, vec!["TEST".to_string()]);
    }
}
