use chrono::Utc;
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::{SurveyVerificationRequest, TrustScore};

/// Base trust score for new respondents with no history.
const BASE_TRUST_SCORE: f64 = 0.5;

/// Weight of GPS component in the trust score.
const GPS_WEIGHT: f64 = 0.30;

/// Weight of behaviour component.
const BEHAVIOUR_WEIGHT: f64 = 0.25;

/// Weight of history component.
const HISTORY_WEIGHT: f64 = 0.25;

/// Weight of fingerprint component.
const FINGERPRINT_WEIGHT: f64 = 0.20;

/// Minimum threshold for a trust score to be considered passing.
const MIN_TRUST_THRESHOLD: f64 = 0.6;

/// Maximum number of historical verifications considered for score decay.
const MAX_HISTORY_WINDOW: u32 = 100;

/// Trust score computation service. Maintains a weighted reputation score
/// per respondent across multiple verification dimensions.
pub struct TrustScoreCalculator;

impl TrustScoreCalculator {
    /// Compute the full trust score for a verification request.
    pub async fn calculate(
        request: &SurveyVerificationRequest,
        gps_trust: f64,
        behaviour_trust: f64,
        fingerprint_trust: f64,
        history_count: u32,
        historical_avg_trust: Option<f64>,
    ) -> AppResult<TrustScore> {
        let gps_component = Self::clamp(gps_trust);
        let behaviour_component = Self::clamp(behaviour_trust);
        let fingerprint_component = Self::clamp(fingerprint_trust);
        let history_component =
            Self::compute_history_component(history_count, historical_avg_trust);

        let composite = GPS_WEIGHT * gps_component
            + BEHAVIOUR_WEIGHT * behaviour_component
            + HISTORY_WEIGHT * history_component
            + FINGERPRINT_WEIGHT * fingerprint_component;

        // Apply a bonus for established respondents
        let adjusted = if history_count >= 10 {
            let bonus = 0.05 * (1.0 - (-history_count as f64 / 50.0).exp());
            (composite + bonus).min(1.0)
        } else {
            composite
        };

        let meets_threshold = adjusted >= MIN_TRUST_THRESHOLD;

        Ok(TrustScore {
            score: Self::clamp(adjusted),
            gps_component,
            behaviour_component,
            history_component,
            fingerprint_component,
            history_count,
            meets_threshold,
        })
    }

    /// Compute the history-based trust component.
    fn compute_history_component(history_count: u32, avg_trust: Option<f64>) -> f64 {
        if history_count == 0 {
            return BASE_TRUST_SCORE;
        }

        let base = avg_trust.unwrap_or(BASE_TRUST_SCORE);

        // Logarithmic scaling: rapid growth initially, then plateaus
        let history_factor =
            (1.0 + history_count as f64 / 10.0).ln() / (1.0 + MAX_HISTORY_WINDOW as f64 / 10.0).ln();
        let history_factor = history_factor.min(1.0);

        Self::clamp(base * 0.6 + history_factor * 0.4)
    }

    /// Update the trust score based on new verification result.
    pub fn update_score(
        previous_score: f64,
        new_result_score: f64,
        history_count: u32,
    ) -> f64 {
        // Exponential moving average with adaptive alpha
        let alpha = if history_count < 5 {
            0.3 // More weight on recent results for new respondents
        } else if history_count < 20 {
            0.2
        } else {
            0.1 // Established respondents change slowly
        };

        Self::clamp(alpha * new_result_score + (1.0 - alpha) * previous_score)
    }

    /// Calculate the penalty for a failed verification.
    pub fn failure_penalty(current_score: f64, failure_count: u32) -> f64 {
        let penalty = match failure_count {
            0 => 0.0,
            1 => 0.15,
            2 => 0.25,
            3 => 0.4,
            _ => 0.6,
        };

        Self::clamp(current_score - penalty)
    }

    /// Calculate the recovery factor for rebuilding trust after a failure.
    pub fn recovery_factor(successes_after_failure: u32) -> f64 {
        // Slow recovery: need 5+ successes to fully recover
        if successes_after_failure == 0 {
            return 0.0;
        }
        let factor = 1.0 - (-successes_after_failure as f64 / 5.0).exp();
        Self::clamp(factor * 0.4)
    }

    /// Clamp a value to the valid trust score range [0.0, 1.0].
    fn clamp(value: f64) -> f64 {
        value.max(0.0).min(1.0)
    }

    /// Calculate a trust score decay over time since last verification.
    pub fn time_decay(last_verification_age_days: f64) -> f64 {
        // Half-life of 30 days for trust score decay
        (-last_verification_age_days / 30.0_f64.ln() * 0.5_f64.ln()).exp().max(0.3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_request() -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({}),
            completed_at: Utc::now(),
            fingerprint: "test-fingerprint".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        }
    }

    #[tokio::test]
    async fn test_new_respondent_base_score() {
        let request = make_request();
        let score = TrustScoreCalculator::calculate(
            &request,
            0.8,
            0.7,
            0.9,
            0,
            None,
        )
        .await
        .unwrap();
        assert!(score.score > 0.4 && score.score < 0.7);
        assert_eq!(score.history_count, 0);
    }

    #[tokio::test]
    async fn test_established_respondent_higher_score() {
        let request = make_request();
        let score = TrustScoreCalculator::calculate(
            &request,
            0.9,
            0.85,
            0.95,
            50,
            Some(0.88),
        )
        .await
        .unwrap();
        assert!(score.score > 0.75);
        assert!(score.meets_threshold);
    }

    #[tokio::test]
    async fn test_all_low_components_low_score() {
        let request = make_request();
        let score = TrustScoreCalculator::calculate(
            &request,
            0.1,
            0.1,
            0.1,
            0,
            None,
        )
        .await
        .unwrap();
        assert!(score.score < 0.3);
        assert!(!score.meets_threshold);
    }

    #[test]
    fn test_update_score_new_respondent() {
        let updated = TrustScoreCalculator::update_score(0.5, 0.9, 2);
        assert!(updated > 0.5 && updated < 0.8);
    }

    #[test]
    fn test_update_score_established_respondent() {
        let updated = TrustScoreCalculator::update_score(0.8, 0.9, 30);
        assert!(updated > 0.78 && updated < 0.83);
    }

    #[test]
    fn test_failure_penalty() {
        let after_one = TrustScoreCalculator::failure_penalty(0.8, 1);
        assert!(after_one < 0.8 && after_one > 0.6);
        let after_many = TrustScoreCalculator::failure_penalty(0.8, 5);
        assert!(after_many < 0.3);
    }

    #[test]
    fn test_recovery_factor() {
        assert_eq!(TrustScoreCalculator::recovery_factor(0), 0.0);
        let after_one = TrustScoreCalculator::recovery_factor(1);
        let after_five = TrustScoreCalculator::recovery_factor(5);
        assert!(after_five > after_one);
        assert!(after_five <= 0.4);
    }

    #[test]
    fn test_time_decay() {
        let fresh = TrustScoreCalculator::time_decay(0.0);
        assert!(fresh >= 0.99);
        let old = TrustScoreCalculator::time_decay(365.0);
        assert!(old < 0.5);
        assert!(old >= 0.3);
    }

    #[test]
    fn test_clamp() {
        assert_eq!(TrustScoreCalculator::clamp(0.5), 0.5);
        assert_eq!(TrustScoreCalculator::clamp(-1.0), 0.0);
        assert_eq!(TrustScoreCalculator::clamp(2.0), 1.0);
    }
}
