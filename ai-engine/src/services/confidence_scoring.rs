use crate::error::AppResult;
use crate::models::{
    BehaviourAnalysis, ConfidenceScore, DuplicateDetection, FraudAnalysis, GeoValidation,
    SurveyVerificationRequest,
};

/// Weight of each factor in the composite confidence score.
const GPS_CONFIDENCE_WEIGHT: f64 = 0.25;
const TIMING_CONFIDENCE_WEIGHT: f64 = 0.25;
const DEVICE_CONFIDENCE_WEIGHT: f64 = 0.25;
const HISTORY_CONFIDENCE_WEIGHT: f64 = 0.25;

/// Minimum data availability threshold for "sufficient data" flag.
const SUFFICIENT_DATA_THRESHOLD: f64 = 0.4;

/// Multi-factor confidence scoring service. Calculates how confident
/// the system is in its verification decision based on data availability
/// and quality across multiple dimensions.
pub struct ConfidenceScorer;

impl ConfidenceScorer {
    /// Calculate the composite confidence score from all analysis results.
    pub async fn calculate(
        request: &SurveyVerificationRequest,
        geo: &GeoValidation,
        fraud: &FraudAnalysis,
        behaviour: &BehaviourAnalysis,
        duplicate: &DuplicateDetection,
    ) -> AppResult<ConfidenceScore> {
        let gps_confidence = Self::calculate_gps_confidence(geo, &request.gps_coordinates.is_some());
        let timing_confidence = Self::calculate_timing_confidence(behaviour, fraud);
        let device_confidence = Self::calculate_device_confidence(request, duplicate);
        let history_confidence = Self::calculate_history_confidence(request);

        let composite = GPS_CONFIDENCE_WEIGHT * gps_confidence
            + TIMING_CONFIDENCE_WEIGHT * timing_confidence
            + DEVICE_CONFIDENCE_WEIGHT * device_confidence
            + HISTORY_CONFIDENCE_WEIGHT * history_confidence;

        let factor_count =
            Self::count_available_factors(geo, behaviour, request);

        let sufficient_data =
            gps_confidence.max(timing_confidence).max(device_confidence)
                > SUFFICIENT_DATA_THRESHOLD;

        Ok(ConfidenceScore {
            score: composite.min(1.0).max(0.0),
            gps_confidence,
            timing_confidence,
            device_confidence,
            history_confidence,
            factor_count,
            sufficient_data,
        })
    }

    /// Confidence derived from GPS validation data quality.
    fn calculate_gps_confidence(geo: &GeoValidation, has_gps: &bool) -> f64 {
        if !has_gps {
            return 0.1; // Very low confidence when no GPS data available
        }

        let mut confidence: f64 = 0.5; // Base for having GPS

        if geo.coordinates_valid {
            confidence += 0.2;
        }

        if geo.passed {
            confidence += 0.2;
        }

        if let Some(accuracy) = geo.accuracy_meters {
            // Higher accuracy (lower value) = higher confidence
            if accuracy < 10.0 {
                confidence += 0.1;
            } else if accuracy < 50.0 {
                confidence += 0.05;
            } else if accuracy > 500.0 {
                confidence -= 0.2;
            }
        }

        confidence.min(1.0).max(0.0)
    }

    /// Confidence derived from timing and behaviour data.
    fn calculate_timing_confidence(
        behaviour: &BehaviourAnalysis,
        fraud: &FraudAnalysis,
    ) -> f64 {
        let mut confidence: f64 = 0.3;

        // Higher confidence if timing patterns are clear
        if behaviour.timing.avg_time_per_question_ms > 0.0 {
            confidence += 0.2;
        }

        // Confidence boost if timing clearly indicates human or clearly indicates bot
        if behaviour.timing.suggests_bot {
            // Even though it's suspicious, we're confident in the detection
            confidence += 0.2;
        }

        if behaviour.timing.suggests_rushing {
            confidence += 0.15;
        }

        // Low statistical deviation = higher confidence in the data
        if fraud.statistical_deviation.is_outlier {
            confidence -= 0.1;
        }

        // Entropy indicates data richness
        if fraud.statistical_deviation.entropy > 0.5 {
            confidence += 0.1;
        }

        confidence.min(1.0).max(0.0)
    }

    /// Confidence derived from device and fingerprint data.
    fn calculate_device_confidence(
        request: &SurveyVerificationRequest,
        duplicate: &DuplicateDetection,
    ) -> f64 {
        let mut confidence: f64 = 0.2;

        // Having a non-trivial fingerprint increases confidence
        if request.fingerprint.len() >= 16 {
            confidence += 0.2;
        }

        // Having IP data increases confidence
        if request.ip_address.is_some() {
            confidence += 0.15;
        }

        // Having user agent data increases confidence
        if request.user_agent.is_some() {
            confidence += 0.1;
        }

        // Having device metadata increases confidence
        if request.device_metadata.is_some() {
            confidence += 0.15;
        }

        // No duplicate match increases confidence (clean data)
        if !duplicate.is_duplicate && duplicate.similarity_score < 0.5 {
            confidence += 0.1;
        }

        confidence.min(1.0).max(0.0)
    }

    /// Confidence derived from historical data availability.
    fn calculate_history_confidence(request: &SurveyVerificationRequest) -> f64 {
        // In production this would check the respondent's history in the database
        // For now, base confidence on available metadata
        let mut confidence: f64 = 0.3;

        if request.device_metadata.is_some() {
            confidence += 0.2;
        }

        if request.gps_coordinates.is_some() {
            confidence += 0.15;
        }

        if request.ip_address.is_some() {
            confidence += 0.15;
        }

        confidence.min(1.0).max(0.0)
    }

    /// Count how many analysis factors had sufficient data.
    fn count_available_factors(
        geo: &GeoValidation,
        behaviour: &BehaviourAnalysis,
        request: &SurveyVerificationRequest,
    ) -> u32 {
        let mut count = 0u32;

        if geo.coordinates_valid || geo.reported_geohash.is_some() {
            count += 1;
        }
        if behaviour.timing.avg_time_per_question_ms > 0.0 {
            count += 1;
        }
        if request.fingerprint.len() >= 8 {
            count += 1;
        }
        if request.ip_address.is_some() {
            count += 1;
        }
        if request.device_metadata.is_some() {
            count += 1;
        }

        count
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        DeviceIndicators, FraudAnalysis, GpsCoordinate, PatternAnalysis, SessionAnalysis,
        StatisticalDeviation, TimingAnalysis,
    };

    fn make_request() -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: Some(GpsCoordinate {
                latitude: -26.2041,
                longitude: 28.0473,
                accuracy: Some(10.0),
                timestamp: None,
            }),
            response_data: serde_json::json!({}),
            completed_at: chrono::Utc::now(),
            fingerprint: "abc123def456ghi789jkl".to_string(),
            ip_address: Some("192.168.1.1".to_string()),
            user_agent: Some("Mozilla/5.0".to_string()),
            expected_geohash: None,
            device_metadata: Some(serde_json::json!({"tab_switches": 1})),
        }
    }

    fn make_geo(passed: bool, valid: bool) -> GeoValidation {
        GeoValidation {
            passed,
            reported_geohash: Some("kdqc6p".to_string()),
            expected_geohash: None,
            distance_meters: Some(50.0),
            precision: 6,
            coordinates_valid: valid,
            accuracy_meters: Some(10.0),
        }
    }

    fn make_fraud() -> FraudAnalysis {
        FraudAnalysis {
            risk_score: 0.1,
            is_fraudulent: false,
            anomalies: vec![],
            statistical_deviation: StatisticalDeviation {
                timing_z_score: 0.5,
                pattern_z_score: 0.3,
                chi_squared: 1.2,
                entropy: 3.5,
                is_outlier: false,
            },
            timing_score: 0.9,
            ip_indicators: None,
            device_indicators: DeviceIndicators {
                is_known_device: true,
                survey_count: 5,
                is_consistent: true,
                risk_score: 0.1,
            },
        }
    }

    fn make_behaviour() -> BehaviourAnalysis {
        BehaviourAnalysis {
            is_normal: true,
            timing: TimingAnalysis {
                avg_time_per_question_ms: 5000.0,
                std_dev_ms: 2000.0,
                min_time_ms: 1000.0,
                max_time_ms: 10000.0,
                coefficient_of_variation: 0.4,
                suggests_bot: false,
                suggests_rushing: false,
            },
            pattern: PatternAnalysis {
                entropy: 0.8,
                straight_line_detected: false,
                acquiescence_bias: 0.3,
                sequence_complexity: 0.7,
                human_like: true,
            },
            session: SessionAnalysis {
                total_duration_secs: 300.0,
                tab_switches: 1,
                pause_count: 0,
                avg_inter_question_gap_ms: 2000.0,
                is_consistent: true,
            },
            risk_score: 0.1,
        }
    }

    #[tokio::test]
    async fn test_high_confidence_with_full_data() {
        let request = make_request();
        let geo = make_geo(true, true);
        let fraud = make_fraud();
        let behaviour = make_behaviour();
        let dup = DuplicateDetection {
            is_duplicate: false,
            similarity_score: 0.0,
            matched_survey_id: None,
            matched_fields: vec![],
        };

        let score = ConfidenceScorer::calculate(&request, &geo, &fraud, &behaviour, &dup)
            .await
            .unwrap();
        assert!(score.score > 0.5);
        assert!(score.sufficient_data);
        assert!(score.factor_count >= 3);
    }

    #[tokio::test]
    async fn test_low_confidence_without_data() {
        let request = SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({}),
            completed_at: chrono::Utc::now(),
            fingerprint: "short".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        };
        let geo = make_geo(false, false);
        let fraud = make_fraud();
        let behaviour = make_behaviour();
        let dup = DuplicateDetection {
            is_duplicate: false,
            similarity_score: 0.0,
            matched_survey_id: None,
            matched_fields: vec![],
        };

        let score = ConfidenceScorer::calculate(&request, &geo, &fraud, &behaviour, &dup)
            .await
            .unwrap();
        assert!(score.score < 0.5);
        assert!(!score.sufficient_data);
    }

    #[test]
    fn test_gps_confidence_no_gps() {
        let geo = make_geo(false, false);
        let conf = ConfidenceScorer::calculate_gps_confidence(&geo, &false);
        assert!(conf < 0.2);
    }

    #[test]
    fn test_gps_confidence_with_good_gps() {
        let geo = make_geo(true, true);
        let conf = ConfidenceScorer::calculate_gps_confidence(&geo, &true);
        assert!(conf > 0.7);
    }

    #[test]
    fn test_factor_count_with_metadata() {
        let request = make_request();
        let geo = make_geo(true, true);
        let behaviour = make_behaviour();
        let count = ConfidenceScorer::count_available_factors(&geo, &behaviour, &request);
        assert!(count >= 4);
    }
}
