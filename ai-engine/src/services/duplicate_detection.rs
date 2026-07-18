use std::collections::HashMap;

use uuid::Uuid;

use crate::error::AppResult;
use crate::models::{DuplicateDetection, SurveyVerificationRequest};

/// Minimum similarity score to consider a match.
const SIMILARITY_THRESHOLD: f64 = 0.85;

/// Weight of exact field matches in similarity scoring.
const EXACT_MATCH_WEIGHT: f64 = 0.4;

/// Weight of fingerprint similarity.
const FINGERPRINT_WEIGHT: f64 = 0.3;

/// Weight of response content similarity.
const CONTENT_WEIGHT: f64 = 0.3;

/// Duplicate detection service. Uses fingerprinting, content similarity,
/// and metadata comparison to identify duplicate or near-duplicate surveys.
pub struct DuplicateDetector;

impl DuplicateDetector {
    /// Check a request against known surveys for duplicates.
    pub async fn detect(
        request: &SurveyVerificationRequest,
        known_fingerprints: &[(Uuid, String, serde_json::Value)],
    ) -> AppResult<DuplicateDetection> {
        let mut best_match: Option<(Uuid, f64, Vec<String>)> = None;

        for (survey_id, fingerprint, response_data) in known_fingerprints {
            let (score, fields) =
                Self::calculate_similarity(request, fingerprint, response_data);

            if score > SIMILARITY_THRESHOLD {
                if best_match.as_ref().map_or(true, |b| score > b.1) {
                    best_match = Some((*survey_id, score, fields));
                }
            }
        }

        match best_match {
            Some((matched_id, score, fields)) => Ok(DuplicateDetection {
                is_duplicate: score >= 0.95,
                similarity_score: score,
                matched_survey_id: Some(matched_id),
                matched_fields: fields,
            }),
            None => Ok(DuplicateDetection {
                is_duplicate: false,
                similarity_score: 0.0,
                matched_survey_id: None,
                matched_fields: vec![],
            }),
        }
    }

    /// Calculate similarity between a request and a known survey.
    fn calculate_similarity(
        request: &SurveyVerificationRequest,
        fingerprint: &str,
        known_data: &serde_json::Value,
    ) -> (f64, Vec<String>) {
        let mut scores: Vec<(String, f64)> = Vec::new();

        // Fingerprint similarity
        let fp_score = Self::fingerprint_similarity(&request.fingerprint, fingerprint);
        scores.push(("fingerprint".to_string(), fp_score));

        // Response content similarity
        let content_score =
            Self::content_similarity(&request.response_data, known_data);
        scores.push(("content".to_string(), content_score));

        // IP address match
        if let Some(ref ip) = request.ip_address {
            if let Some(known_ip) = known_data.get("ip_address").and_then(|v| v.as_str()) {
                let ip_score = if ip == known_ip { 1.0 } else { 0.0 };
                scores.push(("ip_address".to_string(), ip_score));
            }
        }

        // GPS proximity
        if let Some(ref gps) = request.gps_coordinates {
            if let Some(known_gps) = known_data.get("gps") {
                let gps_score = Self::gps_similarity(gps, known_gps);
                scores.push(("gps".to_string(), gps_score));
            }
        }

        let mut matched_fields = Vec::new();
        let mut weighted_sum = 0.0;
        let mut total_weight = 0.0;

        for (field, score) in &scores {
            let weight = match field.as_str() {
                "fingerprint" => FINGERPRINT_WEIGHT,
                "content" => CONTENT_WEIGHT,
                "ip_address" => 0.15,
                "gps" => 0.15,
                _ => 0.1,
            };
            weighted_sum += score * weight;
            total_weight += weight;

            if *score > 0.9 {
                matched_fields.push(field.clone());
            }
        }

        let final_score = if total_weight > 0.0 {
            weighted_sum / total_weight
        } else {
            0.0
        };

        (final_score, matched_fields)
    }

    /// Compute fingerprint similarity using character-level comparison.
    fn fingerprint_similarity(fp1: &str, fp2: &str) -> f64 {
        if fp1 == fp2 {
            return 1.0;
        }

        // Normalise fingerprints to lowercase
        let fp1_lower = fp1.to_lowercase();
        let fp2_lower = fp2.to_lowercase();

        if fp1_lower == fp2_lower {
            return 1.0;
        }

        // Longest common subsequence ratio
        let lcs_len = Self::longest_common_subsequence(&fp1_lower, &fp2_lower);
        let max_len = fp1_lower.len().max(fp2_lower.len()) as f64;

        if max_len == 0.0 {
            return 0.0;
        }

        lcs_len as f64 / max_len
    }

    /// Compute the length of the longest common subsequence.
    fn longest_common_subsequence(s1: &str, s2: &str) -> usize {
        let s1: Vec<char> = s1.chars().collect();
        let s2: Vec<char> = s2.chars().collect();
        let m = s1.len();
        let n = s2.len();

        let mut dp = vec![vec![0usize; n + 1]; m + 1];

        for i in 1..=m {
            for j in 1..=n {
                if s1[i - 1] == s2[j - 1] {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
                }
            }
        }

        dp[m][n]
    }

    /// Compute content similarity between two JSON response payloads.
    fn content_similarity(data1: &serde_json::Value, data2: &serde_json::Value) -> f64 {
        match (data1.as_object(), data2.as_object()) {
            (Some(obj1), Some(obj2)) => {
                let all_keys: std::collections::HashSet<&String> =
                    obj1.keys().chain(obj2.keys()).collect();
                if all_keys.is_empty() {
                    return 1.0;
                }

                let matching = all_keys
                    .iter()
                    .filter(|key| {
                        match (obj1.get(*key), obj2.get(*key)) {
                            (Some(v1), Some(v2)) => v1 == v2,
                            _ => false,
                        }
                    })
                    .count();

                matching as f64 / all_keys.len() as f64
            }
            (Some(arr1), Some(arr2)) => {
                let len_diff = (arr1.len() as f64 - arr2.len() as f64).abs();
                let max_len = arr1.len().max(arr2.len()) as f64;
                if max_len == 0.0 {
                    return 1.0;
                }
                1.0 - (len_diff / max_len)
            }
            _ => {
                // Compare as strings
                let s1 = data1.to_string();
                let s2 = data2.to_string();
                if s1 == s2 {
                    1.0
                } else {
                    Self::jaccard_similarity(&s1, &s2)
                }
            }
        }
    }

    /// Jaccard similarity between two strings (using character-level bigrams).
    fn jaccard_similarity(s1: &str, s2: &str) -> f64 {
        let bigrams1: std::collections::HashSet<(char, char)> = s1
            .chars()
            .zip(s1.chars().skip(1))
            .collect();
        let bigrams2: std::collections::HashSet<(char, char)> = s2
            .chars()
            .zip(s2.chars().skip(1))
            .collect();

        if bigrams1.is_empty() && bigrams2.is_empty() {
            return 1.0;
        }

        let intersection = bigrams1.intersection(&bigrams2).count();
        let union = bigrams1.union(&bigrams2).count();

        if union == 0 {
            return 0.0;
        }

        intersection as f64 / union as f64
    }

    /// Compute GPS proximity similarity between two coordinate sets.
    fn gps_similarity(
        gps1: &crate::models::GpsCoordinate,
        gps2: &serde_json::Value,
    ) -> f64 {
        let lat2 = gps2.get("latitude").and_then(|v| v.as_f64());
        let lon2 = gps2.get("longitude").and_then(|v| v.as_f64());

        match (lat2, lon2) {
            (Some(lat2), Some(lon2)) => {
                let distance = crate::services::gps_verification::GpsVerifier::haversine_distance(
                    gps1.latitude, gps1.longitude, lat2, lon2,
                );
                // 100% match at 0m, 0% match at 1km+
                (1.0 - (distance / 1000.0)).max(0.0)
            }
            _ => 0.0,
        }
    }

    /// Generate a fingerprint hash from survey response data.
    pub fn generate_fingerprint(
        response_data: &serde_json::Value,
        respondent_id: &uuid::Uuid,
        survey_id: &uuid::Uuid,
    ) -> String {
        use sha2::{Digest, Sha256};

        let payload = format!(
            "{}:{}:{}",
            respondent_id,
            survey_id,
            response_data.to_string()
        );

        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_request_with_data(
        data: serde_json::Value,
        fingerprint: &str,
        ip: Option<&str>,
    ) -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: Uuid::new_v4(),
            survey_id: Uuid::new_v4(),
            respondent_id: Uuid::new_v4(),
            gps_coordinates: None,
            response_data: data,
            completed_at: chrono::Utc::now(),
            fingerprint: fingerprint.to_string(),
            ip_address: ip.map(|s| s.to_string()),
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        }
    }

    #[tokio::test]
    async fn test_exact_duplicate_detected() {
        let data = json!({"q1": "yes", "q2": "no"});
        let fp = "abc123def456";
        let request = make_request_with_data(data.clone(), fp, None);
        let known = vec![
            (Uuid::new_v4(), fp.to_string(), json!({"q1": "yes", "q2": "no"})),
        ];
        let result = DuplicateDetector::detect(&request, &known).await.unwrap();
        assert!(result.is_duplicate || result.similarity_score > 0.9);
    }

    #[tokio::test]
    async fn test_no_duplicate_found() {
        let data = json!({"q1": "yes", "q2": "no"});
        let request = make_request_with_data(data, "abc123", None);
        let known = vec![
            (Uuid::new_v4(), "xyz789".to_string(), json!({"q1": "no", "q2": "yes"})),
        ];
        let result = DuplicateDetector::detect(&request, &known).await.unwrap();
        assert!(!result.is_duplicate);
    }

    #[tokio::test]
    async fn test_empty_known_list() {
        let data = json!({"q1": "yes"});
        let request = make_request_with_data(data, "abc", None);
        let result = DuplicateDetector::detect(&request, &[]).await.unwrap();
        assert!(!result.is_duplicate);
        assert_eq!(result.similarity_score, 0.0);
    }

    #[test]
    fn test_exact_fingerprint_match() {
        let score = DuplicateDetector::fingerprint_similarity("abc123", "abc123");
        assert_eq!(score, 1.0);
    }

    #[test]
    fn test_similar_fingerprint() {
        let score = DuplicateDetector::fingerprint_similarity("abc123", "abc124");
        assert!(score > 0.7);
    }

    #[test]
    fn test_content_identical() {
        let data = json!({"q1": "yes"});
        let score = DuplicateDetector::content_similarity(&data, &data);
        assert_eq!(score, 1.0);
    }

    #[test]
    fn test_content_different() {
        let d1 = json!({"q1": "yes"});
        let d2 = json!({"q1": "no"});
        let score = DuplicateDetector::content_similarity(&d1, &d2);
        assert!(score < 1.0);
    }

    #[test]
    fn test_jaccard_similar() {
        let score = DuplicateDetector::jaccard_similarity("hello world", "hello world!");
        assert!(score > 0.7);
    }

    #[test]
    fn test_jaccard_different() {
        let score = DuplicateDetector::jaccard_similarity("aaa", "zzz");
        assert_eq!(score, 0.0);
    }

    #[test]
    fn test_generate_fingerprint_deterministic() {
        let data = json!({"q1": "yes"});
        let id = Uuid::new_v4();
        let survey = Uuid::new_v4();
        let fp1 = DuplicateDetector::generate_fingerprint(&data, &id, &survey);
        let fp2 = DuplicateDetector::generate_fingerprint(&data, &id, &survey);
        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_generate_fingerprint_unique_per_respondent() {
        let data = json!({"q1": "yes"});
        let id1 = Uuid::new_v4();
        let id2 = Uuid::new_v4();
        let survey = Uuid::new_v4();
        let fp1 = DuplicateDetector::generate_fingerprint(&data, &id1, &survey);
        let fp2 = DuplicateDetector::generate_fingerprint(&data, &id2, &survey);
        assert_ne!(fp1, fp2);
    }

    #[test]
    fn test_lcs_basic() {
        let lcs = DuplicateDetector::longest_common_subsequence("abc", "abd");
        assert_eq!(lcs, 2);
    }

    #[test]
    fn test_lcs_identical() {
        let lcs = DuplicateDetector::longest_common_subsequence("abc", "abc");
        assert_eq!(lcs, 3);
    }
}
