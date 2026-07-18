use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Request payload for survey verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurveyVerificationRequest {
    /// Unique identifier for this verification request.
    pub request_id: Uuid,
    /// The survey identifier being verified.
    pub survey_id: Uuid,
    /// The respondent who completed the survey.
    pub respondent_id: Uuid,
    /// The respondent's self-reported GPS coordinates.
    pub gps_coordinates: Option<GpsCoordinate>,
    /// Raw survey response data (JSON-serializable).
    pub response_data: serde_json::Value,
    /// Timestamp when the survey was completed.
    pub completed_at: DateTime<Utc>,
    /// Fingerprint hash for duplicate detection.
    pub fingerprint: String,
    /// IP address of the respondent.
    pub ip_address: Option<String>,
    /// User agent string from the respondent's browser.
    pub user_agent: Option<String>,
    /// Expected location (geohash) for GPS validation.
    pub expected_geohash: Option<String>,
    /// Device metadata collected during the survey.
    pub device_metadata: Option<serde_json::Value>,
}

/// GPS coordinate pair.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpsCoordinate {
    pub latitude: f64,
    pub longitude: f64,
    /// Accuracy in meters.
    pub accuracy: Option<f64>,
    /// Timestamp of GPS reading.
    pub timestamp: Option<DateTime<Utc>>,
}

/// Complete verification result returned by the engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    /// Unique identifier for this result.
    pub id: Uuid,
    /// Reference to the original request.
    pub request_id: Uuid,
    /// Survey identifier.
    pub survey_id: Uuid,
    /// Respondent identifier.
    pub respondent_id: Uuid,
    /// Whether the survey passed overall verification.
    pub passed: bool,
    /// Composite trust score [0.0 - 1.0].
    pub trust_score: TrustScore,
    /// Fraud analysis details.
    pub fraud_analysis: FraudAnalysis,
    /// GPS/location validation details.
    pub geo_validation: GeoValidation,
    /// NFT eligibility and approval.
    pub nft_approval: NftApproval,
    /// Behavioural analysis results.
    pub behaviour_analysis: BehaviourAnalysis,
    /// Duplicate detection results.
    pub duplicate_detection: DuplicateDetection,
    /// Multi-factor confidence score.
    pub confidence: ConfidenceScore,
    /// Timestamp when verification completed.
    pub verified_at: DateTime<Utc>,
    /// Any flags or warnings.
    pub flags: Vec<String>,
}

/// Aggregate trust score with breakdown by factor.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustScore {
    /// Final composite score [0.0 - 1.0].
    pub score: f64,
    /// GPS-based trust component.
    pub gps_component: f64,
    /// Behaviour-based trust component.
    pub behaviour_component: f64,
    /// History-based trust component.
    pub history_component: f64,
    /// Fingerprint-based trust component.
    pub fingerprint_component: f64,
    /// Number of historical verifications for this respondent.
    pub history_count: u32,
    /// Whether the score exceeds the minimum threshold.
    pub meets_threshold: bool,
}

/// Detailed fraud analysis output.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FraudAnalysis {
    /// Overall fraud risk score [0.0 - 1.0], higher means more suspicious.
    pub risk_score: f64,
    /// Whether fraud was detected.
    pub is_fraudulent: bool,
    /// List of detected anomaly patterns.
    pub anomalies: Vec<Anomaly>,
    /// Statistical deviation from expected patterns.
    pub statistical_deviation: StatisticalDeviation,
    /// Response timing analysis.
    pub timing_score: f64,
    /// IP reputation indicators.
    pub ip_indicators: Option<IpIndicators>,
    /// Device fingerprint matching indicators.
    pub device_indicators: DeviceIndicators,
}

/// A single detected anomaly.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Anomaly {
    /// Type of anomaly detected.
    pub anomaly_type: AnomalyType,
    /// Severity score [0.0 - 1.0].
    pub severity: f64,
    /// Human-readable description.
    pub description: String,
    /// Supporting data for this anomaly.
    pub evidence: serde_json::Value,
}

/// Anomaly classification types.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum AnomalyType {
    /// GPS coordinates don't match expected location.
    GpsMismatch,
    /// Response completed faster than humanly possible.
    SuperhumanSpeed,
    /// Suspicious timing pattern (constant intervals).
    BotLikeTiming,
    /// Duplicate or near-duplicate responses.
    DuplicateResponse,
    /// Geographic impossibility (moved too fast).
    ImpossibleTravel,
    /// Statistical outlier in response patterns.
    StatisticalOutlier,
    /// Known fraudulent device fingerprint.
    FlaggedDevice,
    /// Suspicious IP address.
    SuspiciousIp,
    /// Response content appears generated or copied.
    ContentAnomaly,
    /// Session duration anomaly.
    SessionAnomaly,
}

/// Statistical deviation metrics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatisticalDeviation {
    /// Z-score for response time deviation.
    pub timing_z_score: f64,
    /// Z-score for answer pattern deviation.
    pub pattern_z_score: f64,
    /// Chi-squared goodness of fit against expected distribution.
    pub chi_squared: f64,
    /// Entropy of the response distribution.
    pub entropy: f64,
    /// Whether the response is a statistical outlier (beyond 3 sigma).
    pub is_outlier: bool,
}

/// IP-based risk indicators.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpIndicators {
    /// Whether the IP is from a known proxy or VPN.
    pub is_proxy: bool,
    /// Whether the IP is from a known datacenter.
    pub is_datacenter: bool,
    /// Country code of the IP.
    pub country_code: Option<String>,
    /// Number of other surveys from this IP in the last 24h.
    pub frequency_24h: u32,
    /// Risk score [0.0 - 1.0].
    pub risk_score: f64,
}

/// Device fingerprint indicators.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceIndicators {
    /// Whether this device fingerprint has been seen before.
    pub is_known_device: bool,
    /// Number of unique surveys completed with this device.
    pub survey_count: u32,
    /// Whether the device fingerprint is consistent.
    pub is_consistent: bool,
    /// Risk score [0.0 - 1.0].
    pub risk_score: f64,
}

/// GPS and geolocation validation result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoValidation {
    /// Whether GPS validation passed.
    pub passed: bool,
    /// Geohash of the reported coordinates (if provided).
    pub reported_geohash: Option<String>,
    /// Expected geohash.
    pub expected_geohash: Option<String>,
    /// Distance from expected location in meters.
    pub distance_meters: Option<f64>,
    /// Geohash precision level used.
    pub precision: u32,
    /// Whether the coordinates are within valid world bounds.
    pub coordinates_valid: bool,
    /// GPS accuracy (from device, if provided).
    pub accuracy_meters: Option<f64>,
}

/// NFT approval status for on-chain verification record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftApproval {
    /// Whether the respondent is eligible for NFT minting.
    pub eligible: bool,
    /// Approval status.
    pub status: NftApprovalStatus,
    /// Token metadata for the NFT (if eligible).
    pub metadata: Option<NftMetadata>,
    /// Reason for rejection (if not eligible).
    pub rejection_reason: Option<String>,
}

/// NFT approval status enum.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum NftApprovalStatus {
    Approved,
    Pending,
    Rejected,
}

/// NFT token metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftMetadata {
    /// Token name.
    pub name: String,
    /// Token description.
    pub description: String,
    /// Attribute list.
    pub attributes: Vec<NftAttribute>,
    /// Image URI.
    pub image: String,
}

/// A single NFT attribute.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftAttribute {
    pub trait_type: String,
    pub value: serde_json::Value,
}

/// Behavioural analysis of survey completion patterns.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviourAnalysis {
    /// Whether behavioural patterns are normal.
    pub is_normal: bool,
    /// Response timing analysis.
    pub timing: TimingAnalysis,
    /// Answer pattern analysis.
    pub pattern: PatternAnalysis,
    /// Session flow analysis.
    pub session: SessionAnalysis,
    /// Overall behaviour risk score [0.0 - 1.0].
    pub risk_score: f64,
}

/// Response timing analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingAnalysis {
    /// Average time per question in milliseconds.
    pub avg_time_per_question_ms: f64,
    /// Standard deviation of response times.
    pub std_dev_ms: f64,
    /// Minimum response time (fastest question).
    pub min_time_ms: f64,
    /// Maximum response time (slowest question).
    pub max_time_ms: f64,
    /// Coefficient of variation (std_dev / mean).
    pub coefficient_of_variation: f64,
    /// Whether timing suggests bot activity.
    pub suggests_bot: bool,
    /// Whether timing suggests rushing.
    pub suggests_rushing: bool,
}

/// Answer pattern analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternAnalysis {
    /// Entropy of answer distribution (higher = more random).
    pub entropy: f64,
    /// Whether the pattern matches known straight-lining.
    pub straight_line_detected: bool,
    /// Whether answers show excessive acquiescence bias.
    pub acquiescence_bias: f64,
    /// Sequence complexity score [0.0 - 1.0].
    pub sequence_complexity: f64,
    /// Whether the pattern is consistent with human responses.
    pub human_like: bool,
}

/// Session flow analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionAnalysis {
    /// Total session duration in seconds.
    pub total_duration_secs: f64,
    /// Number of tab switches detected.
    pub tab_switches: u32,
    /// Number of times the survey was paused.
    pub pause_count: u32,
    /// Average time between questions.
    pub avg_inter_question_gap_ms: f64,
    /// Whether the session flow is consistent.
    pub is_consistent: bool,
}

/// Duplicate detection result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateDetection {
    /// Whether a duplicate was found.
    pub is_duplicate: bool,
    /// Similarity score against the closest match [0.0 - 1.0].
    pub similarity_score: f64,
    /// ID of the matched survey (if found).
    pub matched_survey_id: Option<Uuid>,
    /// Which fields matched.
    pub matched_fields: Vec<String>,
}

/// Multi-factor confidence score.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceScore {
    /// Overall confidence [0.0 - 1.0].
    pub score: f64,
    /// Confidence in the GPS data.
    pub gps_confidence: f64,
    /// Confidence in the timing data.
    pub timing_confidence: f64,
    /// Confidence in the device data.
    pub device_confidence: f64,
    /// Confidence in the historical data.
    pub history_confidence: f64,
    /// Number of factors that contributed to the score.
    pub factor_count: u32,
    /// Whether sufficient data was available for a reliable assessment.
    pub sufficient_data: bool,
}

/// Response to the verify endpoint.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResponse {
    pub success: bool,
    pub result: VerificationResult,
}

/// Health check response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub uptime_secs: u64,
}

/// Rate limit info embedded in responses.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub limit: u32,
    pub remaining: u32,
    pub reset_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_request() -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: Some(GpsCoordinate {
                latitude: -26.2041,
                longitude: 28.0473,
                accuracy: Some(10.0),
                timestamp: Some(Utc::now()),
            }),
            response_data: serde_json::json!({"q1": "yes", "q2": "no"}),
            completed_at: Utc::now(),
            fingerprint: "abc123def456".to_string(),
            ip_address: Some("192.168.1.1".to_string()),
            user_agent: Some("Mozilla/5.0".to_string()),
            expected_geohash: Some("kdqc6p".to_string()),
            device_metadata: None,
        }
    }

    fn make_test_result() -> VerificationResult {
        VerificationResult {
            id: Uuid::new_v4(),
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            passed: true,
            trust_score: TrustScore {
                score: 0.85,
                gps_component: 0.9,
                behaviour_component: 0.8,
                history_component: 0.85,
                fingerprint_component: 0.9,
                history_count: 10,
                meets_threshold: true,
            },
            fraud_analysis: FraudAnalysis {
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
            },
            geo_validation: GeoValidation {
                passed: true,
                reported_geohash: Some("kdqc6p".to_string()),
                expected_geohash: Some("kdqc6p".to_string()),
                distance_meters: Some(50.0),
                precision: 6,
                coordinates_valid: true,
                accuracy_meters: Some(10.0),
            },
            nft_approval: NftApproval {
                eligible: true,
                status: NftApprovalStatus::Approved,
                metadata: None,
                rejection_reason: None,
            },
            behaviour_analysis: BehaviourAnalysis {
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
                    entropy: 3.0,
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
            },
            duplicate_detection: DuplicateDetection {
                is_duplicate: false,
                similarity_score: 0.0,
                matched_survey_id: None,
                matched_fields: vec![],
            },
            confidence: ConfidenceScore {
                score: 0.82,
                gps_confidence: 0.9,
                timing_confidence: 0.8,
                device_confidence: 0.85,
                history_confidence: 0.75,
                factor_count: 4,
                sufficient_data: true,
            },
            verified_at: Utc::now(),
            flags: vec![],
        }
    }

    #[test]
    fn test_request_serialization_roundtrip() {
        let req = make_test_request();
        let json = serde_json::to_string(&req).unwrap();
        let decoded: SurveyVerificationRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(req.request_id, decoded.request_id);
        assert_eq!(req.fingerprint, decoded.fingerprint);
    }

    #[test]
    fn test_result_serialization_roundtrip() {
        let result = make_test_result();
        let json = serde_json::to_string(&result).unwrap();
        let decoded: VerificationResult = serde_json::from_str(&json).unwrap();
        assert!(decoded.passed);
        assert_eq!(decoded.trust_score.score, 0.85);
        assert!(!decoded.fraud_analysis.is_fraudulent);
    }

    #[test]
    fn test_anomaly_type_equality() {
        assert_eq!(AnomalyType::GpsMismatch, AnomalyType::GpsMismatch);
        assert_ne!(AnomalyType::BotLikeTiming, AnomalyType::SuperhumanSpeed);
    }

    #[test]
    fn test_nft_status_equality() {
        assert_eq!(NftApprovalStatus::Approved, NftApprovalStatus::Approved);
        assert_ne!(NftApprovalStatus::Approved, NftApprovalStatus::Rejected);
    }

    #[test]
    fn test_gps_coordinate_bounds() {
        let coord = GpsCoordinate {
            latitude: -90.0,
            longitude: -180.0,
            accuracy: None,
            timestamp: None,
        };
        assert!(coord.latitude >= -90.0 && coord.latitude <= 90.0);
        assert!(coord.longitude >= -180.0 && coord.longitude <= 180.0);
    }

    #[test]
    fn test_health_response() {
        let health = HealthResponse {
            status: "ok".to_string(),
            version: "1.0.0".to_string(),
            uptime_secs: 12345,
        };
        let json = serde_json::to_string(&health).unwrap();
        assert!(json.contains("ok"));
    }
}
