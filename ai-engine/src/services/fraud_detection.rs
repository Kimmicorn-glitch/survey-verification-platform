use crate::error::AppResult;
use crate::models::{
    Anomaly, AnomalyType, DeviceIndicators, FraudAnalysis, GpsCoordinate, IpIndicators,
    StatisticalDeviation, SurveyVerificationRequest,
};

/// Weight factors for the composite fraud risk score.
const WEIGHT_TIMING: f64 = 0.25;
const WEIGHT_GPS: f64 = 0.20;
const WEIGHT_PATTERN: f64 = 0.20;
const WEIGHT_DEVICE: f64 = 0.15;
const WEIGHT_IP: f64 = 0.10;
const WEIGHT_ENTROPY: f64 = 0.10;

/// Minimum response time per question in ms below which it's considered inhuman.
const MIN_HUMAN_RESPONSE_MS: f64 = 500.0;

/// Maximum reasonable response time per question in ms.
const MAX_REASONABLE_RESPONSE_MS: f64 = 600000.0;

/// Z-score threshold for statistical outlier detection.
const OUTLIER_Z_THRESHOLD: f64 = 3.0;

/// Minimum number of responses needed for statistical analysis.
const MIN_STATISTICAL_SAMPLE: usize = 5;

/// Core fraud detection service. Analyses survey responses for signs of fraud
/// using statistical methods, pattern recognition, and multi-factor heuristics.
pub struct FraudDetector;

impl FraudDetector {
    /// Run the full fraud analysis pipeline on a verification request.
    ///
    /// Combines timing analysis, GPS consistency checks, pattern detection,
    /// IP indicators, and device fingerprint signals into a single risk score.
    pub async fn analyze(request: &SurveyVerificationRequest) -> AppResult<FraudAnalysis> {
        let mut anomalies: Vec<Anomaly> = Vec::new();

        let timing_result = Self::analyze_timing(&request.response_data)?;
        anomalies.extend(timing_result.0);
        let timing_score = timing_result.1;

        let gps_result = Self::analyze_gps_consistency(&request.gps_coordinates, &request.expected_geohash)?;
        anomalies.extend(gps_result.0);
        let gps_risk = gps_result.1;

        let pattern_result = Self::analyze_response_patterns(&request.response_data)?;
        anomalies.extend(pattern_result.0);
        let pattern_risk = pattern_result.1;

        let device_indicators = Self::analyze_device_fingerprint(request);
        if device_indicators.risk_score > 0.5 {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::FlaggedDevice,
                severity: device_indicators.risk_score,
                description: "Device fingerprint associated with suspicious activity".to_string(),
                evidence: serde_json::json!({
                    "survey_count": device_indicators.survey_count,
                    "is_known": device_indicators.is_known_device,
                }),
            });
        }

        let ip_indicators = Self::analyze_ip_indicators(request);
        let ip_risk = ip_indicators
            .as_ref()
            .map(|i| i.risk_score)
            .unwrap_or(0.0);
        if let Some(ref ip) = ip_indicators {
            if ip.is_proxy || ip.is_datacenter {
                anomalies.push(Anomaly {
                    anomaly_type: AnomalyType::SuspiciousIp,
                    severity: ip.risk_score,
                    description: format!(
                        "IP indicators: proxy={}, datacenter={}",
                        ip.is_proxy, ip.is_datacenter
                    ),
                    evidence: serde_json::json!({
                        "country_code": ip.country_code,
                        "frequency_24h": ip.frequency_24h,
                    }),
                });
            }
        }

        let entropy = Self::calculate_response_entropy(&request.response_data);
        let entropy_risk = Self::entropy_to_risk(entropy);
        if entropy < 0.5 && Self::count_responses(&request.response_data) > 5 {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::StatisticalOutlier,
                severity: 1.0 - entropy,
                description: "Response entropy is unusually low, suggesting non-random answers"
                    .to_string(),
                evidence: serde_json::json!({ "entropy": entropy }),
            });
        }

        let statistical_deviation = Self::calculate_statistical_deviation(&request.response_data);
        if statistical_deviation.is_outlier {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::StatisticalOutlier,
                severity: statistical_deviation.timing_z_score.abs() / OUTLIER_Z_THRESHOLD,
                description: format!(
                    "Statistical outlier detected: timing z={}, pattern z={}",
                    statistical_deviation.timing_z_score, statistical_deviation.pattern_z_score
                ),
                evidence: serde_json::json!({
                    "timing_z_score": statistical_deviation.timing_z_score,
                    "pattern_z_score": statistical_deviation.pattern_z_score,
                    "chi_squared": statistical_deviation.chi_squared,
                }),
            });
        }

        let composite_risk = Self::calculate_composite_risk(
            timing_score,
            gps_risk,
            pattern_risk,
            device_indicators.risk_score,
            ip_risk,
            entropy_risk,
        );

        Ok(FraudAnalysis {
            risk_score: composite_risk,
            is_fraudulent: composite_risk > 0.7,
            anomalies,
            statistical_deviation,
            timing_score,
            ip_indicators,
            device_indicators,
        })
    }

    /// Analyse response timing for signs of bot behaviour or rushing.
    ///
    /// Returns (anomalies, risk_score).
    fn analyze_timing(
        response_data: &serde_json::Value,
    ) -> AppResult<(Vec<Anomaly>, f64)> {
        let mut anomalies = Vec::new();
        let mut risk: f64 = 0.0;

        let timings = Self::extract_timings(response_data);
        if timings.is_empty() {
            return Ok((anomalies, risk));
        }

        let total_time: f64 = timings.iter().sum();
        let avg_time = total_time / timings.len() as f64;

        // Check for superhuman speed
        if avg_time < MIN_HUMAN_RESPONSE_MS && timings.len() >= MIN_STATISTICAL_SAMPLE {
            let severity = ((MIN_HUMAN_RESPONSE_MS - avg_time) / MIN_HUMAN_RESPONSE_MS).min(1.0);
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::SuperhumanSpeed,
                severity,
                description: format!(
                    "Average response time {:.0}ms is below human minimum ({:.0}ms)",
                    avg_time, MIN_HUMAN_RESPONSE_MS
                ),
                evidence: serde_json::json!({
                    "avg_time_ms": avg_time,
                    "min_human_ms": MIN_HUMAN_RESPONSE_MS,
                    "question_count": timings.len(),
                }),
            });
            risk += severity * 0.5;
        }

        // Check for bot-like constant timing (low coefficient of variation)
        if timings.len() >= MIN_STATISTICAL_SAMPLE {
            let mean = avg_time;
            let variance: f64 = timings
                .iter()
                .map(|t| (t - mean).powi(2))
                .sum::<f64>()
                / timings.len() as f64;
            let std_dev = variance.sqrt();
            let cv = if mean > 0.0 { std_dev / mean } else { 0.0 };

            if cv < 0.05 && mean > 100.0 {
                let severity = (0.05 - cv) / 0.05;
                anomalies.push(Anomaly {
                    anomaly_type: AnomalyType::BotLikeTiming,
                    severity: severity * 0.8,
                    description: format!(
                        "Response timing is suspiciously consistent (CV={:.4}), suggesting automated responses",
                        cv
                    ),
                    evidence: serde_json::json!({
                        "coefficient_of_variation": cv,
                        "std_dev_ms": std_dev,
                        "mean_ms": mean,
                    }),
                });
                risk += severity * 0.4;
            }
        }

        // Check for extremely fast individual responses
        let fast_count = timings.iter().filter(|&&t| t < MIN_HUMAN_RESPONSE_MS).count();
        if fast_count > 0 && timings.len() >= MIN_STATISTICAL_SAMPLE {
            let fast_ratio = fast_count as f64 / timings.len() as f64;
            if fast_ratio > 0.3 {
                anomalies.push(Anomaly {
                    anomaly_type: AnomalyType::SuperhumanSpeed,
                    severity: fast_ratio,
                    description: format!(
                        "{:.0}% of responses are faster than human minimum",
                        fast_ratio * 100.0
                    ),
                    evidence: serde_json::json!({
                        "fast_count": fast_count,
                        "total_count": timings.len(),
                        "fast_ratio": fast_ratio,
                    }),
                });
                risk += fast_ratio * 0.3;
            }
        }

        // Check for impossibly long responses (suggesting abandonment or automation)
        let long_count = timings
            .iter()
            .filter(|&&t| t > MAX_REASONABLE_RESPONSE_MS)
            .count();
        if long_count > 2 {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::SessionAnomaly,
                severity: 0.4,
                description: format!(
                    "{} responses exceed maximum reasonable time, suggesting session abandonment",
                    long_count
                ),
                evidence: serde_json::json!({
                    "long_count": long_count,
                    "max_time_ms": timings.iter().cloned().fold(f64::MIN, f64::max),
                }),
            });
            risk += 0.2;
        }

        Ok((anomalies, risk.min(1.0)))
    }

    /// Check GPS coordinates for consistency and plausibility.
    fn analyze_gps_consistency(
        gps: &Option<GpsCoordinate>,
        expected_geohash: &Option<String>,
    ) -> AppResult<(Vec<Anomaly>, f64)> {
        let mut anomalies = Vec::new();
        let mut risk: f64 = 0.0;

        let coord = match gps {
            Some(c) => c,
            None => {
                risk += 0.15;
                return Ok((anomalies, risk));
            }
        };

        // Validate coordinate bounds
        if coord.latitude < -90.0
            || coord.latitude > 90.0
            || coord.longitude < -180.0
            || coord.longitude > 180.0
        {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::GpsMismatch,
                severity: 1.0,
                description: "GPS coordinates are outside valid world bounds".to_string(),
                evidence: serde_json::json!({
                    "latitude": coord.latitude,
                    "longitude": coord.longitude,
                }),
            });
            return Ok((anomalies, 1.0));
        }

        // Null Island check (0,0) - commonly returned by spoofed GPS
        if coord.latitude.abs() < 0.001 && coord.longitude.abs() < 0.001 {
            anomalies.push(Anomaly {
                anomaly_type: AnomalyType::GpsMismatch,
                severity: 0.9,
                description: "GPS coordinates are at Null Island (0,0), likely spoofed".to_string(),
                evidence: serde_json::json!({ "coordinates": "0,0" }),
            });
            risk += 0.9;
        }

        // Compare with expected geohash
        if let Some(ref expected) = expected_geohash {
            let reported_geohash = geohash::encode(
                geo::Coord {
                    x: coord.longitude,
                    y: coord.latitude,
                },
                expected.len(),
            )
            .map_err(|e| crate::error::AppError::GeoValidation(e.to_string()))?;

            if reported_geohash != *expected {
                let distance = Self::calculate_distance(
                    coord.latitude,
                    coord.longitude,
                    Self::decode_geohash_center(expected)?,
                );
                let severity = (distance / 1000.0).min(1.0);
                anomalies.push(Anomaly {
                    anomaly_type: AnomalyType::GpsMismatch,
                    severity,
                    description: format!(
                        "GPS mismatch: reported geohash {} differs from expected {} (distance: {:.0}m)",
                        reported_geohash, expected, distance
                    ),
                    evidence: serde_json::json!({
                        "reported_geohash": reported_geohash,
                        "expected_geohash": expected,
                        "distance_meters": distance,
                    }),
                });
                risk += severity * 0.6;
            }
        }

        // GPS accuracy check
        if let Some(accuracy) = coord.accuracy {
            if accuracy > 500.0 {
                anomalies.push(Anomaly {
                    anomaly_type: AnomalyType::GpsMismatch,
                    severity: 0.3,
                    description: format!("GPS accuracy is very low: {:.0}m", accuracy),
                    evidence: serde_json::json!({ "accuracy_meters": accuracy }),
                });
                risk += 0.15;
            }
        }

        Ok((anomalies, risk.min(1.0)))
    }

    /// Analyse response data for suspicious patterns.
    fn analyze_response_patterns(
        response_data: &serde_json::Value,
    ) -> AppResult<(Vec<Anomaly>, f64)> {
        let mut anomalies = Vec::new();
        let mut risk: f64 = 0.0;

        if let Some(obj) = response_data.as_object() {
            if obj.is_empty() {
                return Ok((anomalies, 0.0));
            }

            // Detect straight-lining (all same answers)
            let values: Vec<&serde_json::Value> = obj.values().collect();
            if values.len() >= 5 {
                let first = &values[0];
                let same_count = values.iter().filter(|v| v == &first).count();
                let same_ratio = same_count as f64 / values.len() as f64;

                if same_ratio > 0.9 {
                    let severity = (same_ratio - 0.9) / 0.1;
                    anomalies.push(Anomaly {
                        anomaly_type: AnomalyType::ContentAnomaly,
                        severity: severity * 0.7,
                        description: format!(
                            "Straight-lining detected: {:.0}% of answers are identical",
                            same_ratio * 100.0
                        ),
                        evidence: serde_json::json!({
                            "same_ratio": same_ratio,
                            "sample_value": first,
                        }),
                    });
                    risk += severity * 0.4;
                }
            }

            // Detect sequential patterns (e.g., 1,2,3,4,5,1,2,3,4,5)
            let numeric_values: Vec<f64> = values
                .iter()
                .filter_map(|v| v.as_f64())
                .collect();
            if numeric_values.len() >= 6 {
                let seq_score = Self::detect_sequential_pattern(&numeric_values);
                if seq_score > 0.8 {
                    anomalies.push(Anomaly {
                        anomaly_type: AnomalyType::ContentAnomaly,
                        severity: seq_score * 0.6,
                        description: "Sequential answer pattern detected".to_string(),
                        evidence: serde_json::json!({
                            "sequence_score": seq_score,
                            "pattern": "sequential",
                        }),
                    });
                    risk += seq_score * 0.3;
                }
            }
        }

        Ok((anomalies, risk.min(1.0)))
    }

    /// Analyse device fingerprint for suspicious indicators.
    fn analyze_device_fingerprint(request: &SurveyVerificationRequest) -> DeviceIndicators {
        // In production this would query a device fingerprint database.
        // For now, we analyse what we have from the request.
        let fingerprint_len = request.fingerprint.len();
        let is_short = fingerprint_len < 8;
        let has_suspicious_pattern = request
            .fingerprint
            .chars()
            .all(|c| c == request.fingerprint.chars().next().unwrap_or('a'));

        let risk = if is_short {
            0.4
        } else if has_suspicious_pattern {
            0.6
        } else {
            0.05
        };

        DeviceIndicators {
            is_known_device: false,
            survey_count: 1,
            is_consistent: !is_short && !has_suspicious_pattern,
            risk_score: risk,
        }
    }

    /// Analyse IP address indicators for risk.
    fn analyze_ip_indicators(request: &SurveyVerificationRequest) -> Option<IpIndicators> {
        let ip = request.ip_address.as_ref()?;

        // Check for localhost/private IPs submitting surveys (unusual in production)
        let is_private = ip.starts_with("10.")
            || ip.starts_with("192.168.")
            || ip.starts_with("172.")
            || ip == "127.0.0.1"
            || ip == "::1";

        // Placeholder: real implementation would query IP reputation databases
        let risk = if is_private { 0.3 } else { 0.05 };

        Some(IpIndicators {
            is_proxy: false,
            is_datacenter: false,
            country_code: None,
            frequency_24h: 1,
            risk_score: risk,
        })
    }

    /// Calculate Shannon entropy of the response distribution.
    fn calculate_response_entropy(response_data: &serde_json::Value) -> f64 {
        let values = match response_data.as_object() {
            Some(obj) if !obj.is_empty() => {
                let mut counts = std::collections::HashMap::new();
                for val in obj.values() {
                    let key = val.to_string();
                    *counts.entry(key).or_insert(0u64) += 1;
                }
                counts
            }
            _ => return 0.0,
        };

        let total: f64 = values.values().sum::<u64>() as f64;
        if total == 0.0 {
            return 0.0;
        }

        let entropy: f64 = values
            .values()
            .map(|&count| {
                let p = count as f64 / total;
                if p > 0.0 {
                    -p * p.log2()
                } else {
                    0.0
                }
            })
            .sum();

        // Normalise by max possible entropy
        let max_entropy = (values.len() as f64).log2();
        if max_entropy > 0.0 {
            entropy / max_entropy
        } else {
            0.0
        }
    }

    /// Convert entropy to a risk score (low entropy = higher risk).
    fn entropy_to_risk(entropy: f64) -> f64 {
        if entropy < 0.3 {
            0.5
        } else if entropy < 0.5 {
            0.3
        } else {
            0.0
        }
    }

    /// Count the number of responses in the data.
    fn count_responses(response_data: &serde_json::Value) -> usize {
        match response_data {
            serde_json::Value::Object(map) => map.len(),
            serde_json::Value::Array(arr) => arr.len(),
            _ => 0,
        }
    }

    /// Extract timing values from response data.
    fn extract_timings(response_data: &serde_json::Value) -> Vec<f64> {
        if let Some(obj) = response_data.get("timings") {
            if let Some(arr) = obj.as_array() {
                return arr
                    .iter()
                    .filter_map(|v| v.as_f64())
                    .collect();
            }
        }

        // Fallback: look for timing keys in the response data
        if let Some(obj) = response_data.as_object() {
            let mut timings = Vec::new();
            for (key, val) in obj {
                if key.ends_with("_time_ms") || key.ends_with("_duration") {
                    if let Some(t) = val.as_f64() {
                        timings.push(t);
                    }
                }
            }
            return timings;
        }

        Vec::new()
    }

    /// Detect sequential patterns in numeric values (e.g., 1,2,3,4,5 repeated).
    fn detect_sequential_pattern(values: &[f64]) -> f64 {
        if values.len() < 4 {
            return 0.0;
        }

        // Compute first differences
        let diffs: Vec<f64> = values
            .windows(2)
            .map(|w| w[1] - w[0])
            .collect();

        if diffs.is_empty() {
            return 0.0;
        }

        // Check if all differences are the same (perfect sequence)
        let first_diff = diffs[0];
        if first_diff.abs() < f64::EPSILON {
            return 0.0;
        }

        let consistent_count = diffs
            .iter()
            .filter(|&&d| (d - first_diff).abs() < f64::EPSILON)
            .count();

        consistent_count as f64 / diffs.len() as f64
    }

    /// Calculate the composite fraud risk from individual component scores.
    fn calculate_composite_risk(
        timing: f64,
        gps: f64,
        pattern: f64,
        device: f64,
        ip: f64,
        entropy: f64,
    ) -> f64 {
        let raw = WEIGHT_TIMING * timing
            + WEIGHT_GPS * gps
            + WEIGHT_PATTERN * pattern
            + WEIGHT_DEVICE * device
            + WEIGHT_IP * ip
            + WEIGHT_ENTROPY * entropy;

        // Apply a sigmoid-like clamping: amplify high scores, compress low scores
        let amplified = if raw > 0.5 {
            raw + (raw - 0.5) * 0.3
        } else {
            raw * 0.8
        };

        amplified.min(1.0).max(0.0)
    }

    /// Calculate statistical deviation metrics for the response data.
    fn calculate_statistical_deviation(response_data: &serde_json::Value) -> StatisticalDeviation {
        let timings = Self::extract_timings(response_data);
        let numeric_values: Vec<f64> = response_data
            .as_object()
            .map(|obj| {
                obj.values()
                    .filter_map(|v| v.as_f64())
                    .collect()
            })
            .unwrap_or_default();

        let timing_z = if timings.len() >= MIN_STATISTICAL_SAMPLE {
            let mean = timings.iter().sum::<f64>() / timings.len() as f64;
            let variance = timings.iter().map(|t| (t - mean).powi(2)).sum::<f64>()
                / timings.len() as f64;
            let std_dev = variance.sqrt();
            if std_dev > 0.0 {
                let deviations: Vec<f64> = timings.iter().map(|t| (t - mean).abs()).collect();
                let max_deviation = deviations.iter().cloned().fold(f64::MIN, f64::max);
                max_deviation / std_dev
            } else {
                0.0
            }
        } else {
            0.0
        };

        let pattern_z = Self::calculate_pattern_z_score(&numeric_values);
        let chi_squared = Self::calculate_chi_squared(&numeric_values);
        let entropy = Self::calculate_response_entropy(response_data);
        let is_outlier = timing_z > OUTLIER_Z_THRESHOLD || pattern_z > OUTLIER_Z_THRESHOLD;

        StatisticalDeviation {
            timing_z_score: timing_z,
            pattern_z_score: pattern_z,
            chi_squared,
            entropy,
            is_outlier,
        }
    }

    /// Calculate z-score for response pattern deviation from uniform distribution.
    fn calculate_pattern_z_score(values: &[f64]) -> f64 {
        if values.len() < MIN_STATISTICAL_SAMPLE {
            return 0.0;
        }

        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let variance = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>()
            / values.len() as f64;
        let std_dev = variance.sqrt();

        if std_dev < f64::EPSILON {
            return if mean > 0.0 { f64::INFINITY } else { 0.0 };
        }

        // Use range-based deviation
        let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let range = max - min;

        range / std_dev
    }

    /// Chi-squared test for uniformity of numeric responses.
    fn calculate_chi_squared(values: &[f64]) -> f64 {
        if values.len() < 4 {
            return 0.0;
        }

        // Bin values into quintiles
        let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let range = max - min;

        if range < f64::EPSILON {
            return 0.0;
        }

        let bin_count = 5;
        let mut bins = vec![0u64; bin_count];
        let expected = values.len() as f64 / bin_count as f64;

        for &v in values {
            let normalized = (v - min) / range;
            let bin = ((normalized * (bin_count - 1) as f64) as usize).min(bin_count - 1);
            bins[bin] += 1;
        }

        bins.iter()
            .map(|&observed| {
                let o = observed as f64;
                (o - expected).powi(2) / expected
            })
            .sum()
    }

    /// Calculate haversine distance between two GPS points in meters.
    fn calculate_distance(lat1: f64, lon1: f64, point2: geo::Coord) -> f64 {
        let coord1 = geo::Coord {
            x: lon1,
            y: lat1,
        };
        let coord2 = point2;

        let haversine = geo::algorithm::Haversine;
        haversine.haversine_distance(&coord1, &coord2).meters
    }

    /// Decode a geohash to its center coordinate.
    fn decode_geohash_center(hash: &str) -> AppResult<geo::Coord> {
        let decoded = geohash::decode(hash)
            .map_err(|e| crate::error::AppError::GeoValidation(e.to_string()))?;
        Ok(decoded.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::GpsCoordinate;
    use serde_json::json;

    fn make_request(timings: Vec<f64>, gps: Option<GpsCoordinate>) -> SurveyVerificationRequest {
        let mut data = json!({
            "q1": "yes",
            "q2": "no",
            "q3": "yes",
            "q4": "no",
            "q5": "yes",
        });
        if !timings.is_empty() {
            data["timings"] = json!(timings);
        }

        SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: gps,
            response_data: data,
            completed_at: chrono::Utc::now(),
            fingerprint: "abc123def456ghi789".to_string(),
            ip_address: Some("192.168.1.1".to_string()),
            user_agent: Some("Mozilla/5.0".to_string()),
            expected_geohash: None,
            device_metadata: None,
        }
    }

    #[tokio::test]
    async fn test_normal_request_low_risk() {
        let timings = vec![5000.0, 4500.0, 5500.0, 6000.0, 4800.0, 5200.0];
        let gps = Some(GpsCoordinate {
            latitude: -26.2041,
            longitude: 28.0473,
            accuracy: Some(10.0),
            timestamp: Some(chrono::Utc::now()),
        });
        let request = make_request(timings, gps);
        let result = FraudDetector::analyze(&request).await.unwrap();
        assert!(result.risk_score < 0.5);
        assert!(!result.is_fraudulent);
    }

    #[tokio::test]
    async fn test_superhuman_speed_detected() {
        let timings = vec![50.0, 30.0, 40.0, 20.0, 60.0, 35.0, 45.0, 25.0, 55.0, 15.0];
        let request = make_request(timings, None);
        let result = FraudDetector::analyze(&request).await.unwrap();
        assert!(result.risk_score > 0.3);
        assert!(result
            .anomalies
            .iter()
            .any(|a| a.anomaly_type == AnomalyType::SuperhumanSpeed));
    }

    #[tokio::test]
    async fn test_bot_like_timing_detected() {
        // All exactly the same timing
        let timings = vec![1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0];
        let request = make_request(timings, None);
        let result = FraudDetector::analyze(&request).await.unwrap();
        assert!(result
            .anomalies
            .iter()
            .any(|a| a.anomaly_type == AnomalyType::BotLikeTiming));
    }

    #[tokio::test]
    async fn test_null_island_gps_detected() {
        let gps = Some(GpsCoordinate {
            latitude: 0.0,
            longitude: 0.0,
            accuracy: Some(10.0),
            timestamp: None,
        });
        let request = make_request(vec![5000.0, 5000.0, 5000.0, 5000.0, 5000.0], gps);
        let result = FraudDetector::analyze(&request).await.unwrap();
        assert!(result
            .anomalies
            .iter()
            .any(|a| a.anomaly_type == AnomalyType::GpsMismatch));
    }

    #[tokio::test]
    async fn test_out_of_bounds_gps() {
        let gps = Some(GpsCoordinate {
            latitude: 999.0,
            longitude: 999.0,
            accuracy: None,
            timestamp: None,
        });
        let request = make_request(vec![], gps);
        let result = FraudDetector::analyze(&request).await.unwrap();
        assert!(result
            .anomalies
            .iter()
            .any(|a| a.anomaly_type == AnomalyType::GpsMismatch));
        assert!(result.risk_score > 0.5);
    }

    #[test]
    fn test_entropy_calculation() {
        let data = json!({"a": 1, "b": 2, "c": 3, "d": 4});
        let entropy = FraudDetector::calculate_response_entropy(&data);
        assert!(entropy > 0.9); // Near-max entropy for 4 unique values
    }

    #[test]
    fn test_entropy_low_for_uniform() {
        let data = json!({"a": 1, "b": 1, "c": 1, "d": 1, "e": 1});
        let entropy = FraudDetector::calculate_response_entropy(&data);
        assert!(entropy < 0.1); // Near-zero entropy
    }

    #[test]
    fn test_chi_squared_uniform() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0, 1.0, 2.0, 3.0, 4.0, 5.0];
        let chi = FraudDetector::calculate_chi_squared(&values);
        assert!(chi < 5.0); // Low chi-squared for uniform-ish distribution
    }

    #[test]
    fn test_sequential_detection() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0, 1.0, 2.0, 3.0, 4.0, 5.0];
        let score = FraudDetector::detect_sequential_pattern(&values);
        assert!(score > 0.8);
    }

    #[test]
    fn test_no_sequential_pattern() {
        let values = vec![3.0, 1.0, 4.0, 1.0, 5.0, 9.0, 2.0, 6.0];
        let score = FraudDetector::detect_sequential_pattern(&values);
        assert!(score < 0.5);
    }

    #[test]
    fn test_composite_risk_clamping() {
        let risk = FraudDetector::calculate_composite_risk(1.0, 1.0, 1.0, 1.0, 1.0, 1.0);
        assert!(risk <= 1.0);
        let risk = FraudDetector::calculate_composite_risk(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        assert!(risk >= 0.0);
    }

    #[test]
    fn test_extract_timings_from_data() {
        let data = json!({"timings": [100.0, 200.0, 300.0]});
        let timings = FraudDetector::extract_timings(&data);
        assert_eq!(timings, vec![100.0, 200.0, 300.0]);
    }

    #[test]
    fn test_extract_timings_from_duration_keys() {
        let data = json!({"q1_time_ms": 100.0, "q2_time_ms": 200.0, "other": "skip"});
        let timings = FraudDetector::extract_timings(&data);
        assert_eq!(timings.len(), 2);
    }
}
