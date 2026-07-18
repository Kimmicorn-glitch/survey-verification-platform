use crate::error::AppResult;
use crate::models::{
    BehaviourAnalysis, PatternAnalysis, SessionAnalysis, SurveyVerificationRequest,
    TimingAnalysis,
};

/// Minimum number of questions needed for reliable timing analysis.
const MIN_QUESTIONS_FOR_TIMING: usize = 3;

/// Threshold for detecting straight-lining behaviour (all same answers).
const STRAIGHT_LINE_THRESHOLD: f64 = 0.85;

/// Threshold for detecting acquiescence bias.
const ACQUIESCENCE_BIAS_THRESHOLD: f64 = 0.8;

/// Minimum acceptable response entropy.
const MIN_ENTROPY: f64 = 0.3;

/// Maximum coefficient of variation to flag as bot-like.
const BOT_CV_THRESHOLD: f64 = 0.05;

/// Behaviour analysis service. Detects human vs automated responses
/// by analysing timing patterns, answer distributions, and session flow.
pub struct BehaviourAnalyser;

impl BehaviourAnalyser {
    /// Perform complete behavioural analysis on a verification request.
    pub async fn analyze(request: &SurveyVerificationRequest) -> AppResult<BehaviourAnalysis> {
        let timing = Self::analyze_timing(request)?;
        let pattern = Self::analyze_patterns(request)?;
        let session = Self::analyze_session(request)?;

        let risk_score = Self::compute_behaviour_risk(&timing, &pattern, &session);
        let is_normal = risk_score < 0.5;

        Ok(BehaviourAnalysis {
            is_normal,
            timing,
            pattern,
            session,
            risk_score,
        })
    }

    /// Analyse response timing characteristics.
    fn analyze_timing(request: &SurveyVerificationRequest) -> AppResult<TimingAnalysis> {
        let timings = Self::extract_question_timings(request);

        if timings.is_empty() {
            return Ok(TimingAnalysis {
                avg_time_per_question_ms: 0.0,
                std_dev_ms: 0.0,
                min_time_ms: 0.0,
                max_time_ms: 0.0,
                coefficient_of_variation: 0.0,
                suggests_bot: false,
                suggests_rushing: false,
            });
        }

        let count = timings.len() as f64;
        let avg = timings.iter().sum::<f64>() / count;
        let variance = timings.iter().map(|t| (t - avg).powi(2)).sum::<f64>() / count;
        let std_dev = variance.sqrt();
        let min_time = timings.iter().cloned().fold(f64::INFINITY, f64::min);
        let max_time = timings.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let cv = if avg > 0.0 { std_dev / avg } else { 0.0 };

        let suggests_bot = cv < BOT_CV_THRESHOLD && timings.len() >= MIN_QUESTIONS_FOR_TIMING;

        let suggests_rushing = avg < 2000.0 && timings.len() >= MIN_QUESTIONS_FOR_TIMING;

        Ok(TimingAnalysis {
            avg_time_per_question_ms: avg,
            std_dev_ms: std_dev,
            min_time_ms: min_time,
            max_time_ms: max_time,
            coefficient_of_variation: cv,
            suggests_bot,
            suggests_rushing,
        })
    }

    /// Analyse response patterns for anomalies.
    fn analyze_patterns(request: &SurveyVerificationRequest) -> AppResult<PatternAnalysis> {
        let answers = Self::extract_answers(request);

        if answers.is_empty() {
            return Ok(PatternAnalysis {
                entropy: 0.0,
                straight_line_detected: false,
                acquiescence_bias: 0.0,
                sequence_complexity: 0.0,
                human_like: true,
            });
        }

        let entropy = Self::calculate_entropy(&answers);
        let straight_line = Self::detect_straight_lining(&answers);
        let acquiescence = Self::calculate_acquiescence_bias(&answers);
        let complexity = Self::calculate_sequence_complexity(&answers);

        let human_like = !straight_line
            && entropy > MIN_ENTROPY
            && acquiescence < ACQUIESCENCE_BIAS_THRESHOLD;

        Ok(PatternAnalysis {
            entropy,
            straight_line_detected: straight_line,
            acquiescence_bias: acquiescence,
            sequence_complexity: complexity,
            human_like,
        })
    }

    /// Analyse the session flow and metadata.
    fn analyze_session(request: &SurveyVerificationRequest) -> AppResult<SessionAnalysis> {
        let total_duration = Self::calculate_session_duration(request);
        let tab_switches = Self::extract_tab_switches(request);
        let pause_count = Self::extract_pause_count(request);
        let avg_gap = Self::calculate_avg_inter_question_gap(request);

        let is_consistent = total_duration > 30.0 && total_duration < 3600.0;

        Ok(SessionAnalysis {
            total_duration_secs: total_duration,
            tab_switches,
            pause_count,
            avg_inter_question_gap_ms: avg_gap,
            is_consistent,
        })
    }

    /// Compute overall behaviour risk score.
    fn compute_behaviour_risk(
        timing: &TimingAnalysis,
        pattern: &PatternAnalysis,
        session: &SessionAnalysis,
    ) -> f64 {
        let mut risk: f64 = 0.0;

        if timing.suggests_bot {
            risk += 0.4;
        }
        if timing.suggests_rushing {
            risk += 0.25;
        }
        if pattern.straight_line_detected {
            risk += 0.3;
        }
        if pattern.acquiescence_bias > ACQUIESCENCE_BIAS_THRESHOLD {
            risk += 0.2;
        }
        if !pattern.human_like {
            risk += 0.15;
        }
        if !session.is_consistent {
            risk += 0.1;
        }

        // Low entropy bonus risk
        if pattern.entropy < MIN_ENTROPY {
            risk += 0.2;
        }

        risk.min(1.0)
    }

    /// Extract per-question timings from the request.
    fn extract_question_timings(request: &SurveyVerificationRequest) -> Vec<f64> {
        if let Some(timings) = request.response_data.get("timings") {
            if let Some(arr) = timings.as_array() {
                return arr.iter().filter_map(|v| v.as_f64()).collect();
            }
        }

        let mut timings = Vec::new();
        if let Some(obj) = request.response_data.as_object() {
            for (key, val) in obj {
                if key.ends_with("_time_ms") || key.ends_with("_duration") {
                    if let Some(t) = val.as_f64() {
                        timings.push(t);
                    }
                }
            }
        }
        timings
    }

    /// Extract answer values for pattern analysis.
    fn extract_answers(request: &SurveyVerificationRequest) -> Vec<String> {
        let mut answers = Vec::new();
        if let Some(obj) = request.response_data.as_object() {
            for (key, val) in obj {
                if !key.ends_with("_time_ms")
                    && !key.ends_with("_duration")
                    && key != "timings"
                    && key != "metadata"
                    && key != "device"
                {
                    answers.push(val.to_string());
                }
            }
        }
        answers
    }

    /// Calculate Shannon entropy of an answer distribution.
    fn calculate_entropy(answers: &[String]) -> f64 {
        if answers.is_empty() {
            return 0.0;
        }

        let mut counts = std::collections::HashMap::new();
        for answer in answers {
            *counts.entry(answer.clone()).or_insert(0u64) += 1;
        }

        let total = answers.len() as f64;
        let entropy: f64 = counts
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

        let max_entropy = (counts.len() as f64).log2();
        if max_entropy > 0.0 {
            entropy / max_entropy
        } else {
            0.0
        }
    }

    /// Detect straight-lining (all or nearly all same answers).
    fn detect_straight_lining(answers: &[String]) -> bool {
        if answers.len() < 5 {
            return false;
        }

        let mut counts = std::collections::HashMap::new();
        for answer in answers {
            *counts.entry(answer.clone()).or_insert(0u64) += 1;
        }

        let max_count = counts.values().max().unwrap_or(&0);
        let ratio = *max_count as f64 / answers.len() as f64;
        ratio >= STRAIGHT_LINE_THRESHOLD
    }

    /// Calculate acquiescence bias (tendency to agree/answer "yes").
    fn calculate_acquiescence_bias(answers: &[String]) -> f64 {
        if answers.is_empty() {
            return 0.0;
        }

        let agree_values = ["yes", "true", "1", "agree", "strongly agree", "always"];
        let agree_count = answers
            .iter()
            .filter(|a| {
                let lower = a.to_lowercase();
                agree_values.iter().any(|&v| lower.contains(v))
            })
            .count();

        agree_count as f64 / answers.len() as f64
    }

    /// Calculate sequence complexity using autocorrelation.
    fn calculate_sequence_complexity(answers: &[String]) -> f64 {
        if answers.len() < 4 {
            return 0.5;
        }

        // Convert answers to numeric representation for autocorrelation
        let mut label_map = std::collections::HashMap::new();
        let numeric: Vec<f64> = answers
            .iter()
            .map(|a| {
                let len = label_map.len() as f64;
                *label_map.entry(a.clone()).or_insert(len)
            })
            .collect();

        let mean = numeric.iter().sum::<f64>() / numeric.len() as f60;
        let variance = numeric.iter().map(|v| (v - mean).powi(2)).sum::<f64>();
        if variance < f64::EPSILON {
            return 0.0;
        }

        // Lag-1 autocorrelation
        let n = numeric.len();
        let autocorr: f64 = numeric
            .windows(2)
            .map(|w| (w[0] - mean) * (w[1] - mean))
            .sum::<f64>()
            / variance;

        // High autocorrelation (near 1.0 or -1.0) = low complexity
        (1.0 - autocorr.abs()).max(0.0)
    }

    /// Calculate session duration in seconds.
    fn calculate_session_duration(request: &SurveyVerificationRequest) -> f64 {
        if let Some(dur) = request.response_data.get("session_duration_secs") {
            if let Some(d) = dur.as_f64() {
                return d;
            }
        }

        // Fallback: use difference between completion time and first timing
        let timings = Self::extract_question_timings(request);
        let total_time_ms: f64 = timings.iter().sum();
        total_time_ms / 1000.0
    }

    /// Extract number of tab switches from device metadata.
    fn extract_tab_switches(request: &SurveyVerificationRequest) -> u32 {
        request
            .device_metadata
            .as_ref()
            .and_then(|m| m.get("tab_switches"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32
    }

    /// Extract pause count from device metadata.
    fn extract_pause_count(request: &SurveyVerificationRequest) -> u32 {
        request
            .device_metadata
            .as_ref()
            .and_then(|m| m.get("pause_count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32
    }

    /// Calculate average time gap between questions.
    fn calculate_avg_inter_question_gap(request: &SurveyVerificationRequest) -> f64 {
        if let Some(gap) = request.response_data.get("avg_inter_question_gap_ms") {
            if let Some(g) = gap.as_f64() {
                return g;
            }
        }

        let timings = Self::extract_question_timings(request);
        if timings.len() < 2 {
            return 0.0;
        }

        // Estimate gaps from timing variance
        let mean = timings.iter().sum::<f64>() / timings.len() as f64;
        mean * 0.3 // Approximate gap as 30% of average question time
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::GpsCoordinate;
    use serde_json::json;

    fn make_request(data: serde_json::Value) -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: None,
            response_data: data,
            completed_at: chrono::Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        }
    }

    #[tokio::test]
    async fn test_normal_behaviour() {
        let data = json!({
            "q1": "yes",
            "q2": "no",
            "q3": "maybe",
            "q4": "yes",
            "q5": "no",
            "q6": "maybe",
            "timings": [5000.0, 6000.0, 4000.0, 7000.0, 5500.0, 6500.0]
        });
        let request = make_request(data);
        let result = BehaviourAnalyser::analyze(&request).await.unwrap();
        assert!(result.is_normal);
        assert!(result.risk_score < 0.5);
    }

    #[tokio::test]
    async fn test_bot_like_timing() {
        let data = json!({
            "q1": "yes",
            "q2": "yes",
            "q3": "yes",
            "q4": "yes",
            "q5": "yes",
            "timings": [1000.0, 1000.0, 1000.0, 1000.0, 1000.0, 1000.0]
        });
        let request = make_request(data);
        let result = BehaviourAnalyser::analyze(&request).await.unwrap();
        assert!(result.timing.suggests_bot);
        assert!(result.risk_score > 0.3);
    }

    #[tokio::test]
    async fn test_straight_lining() {
        let data = json!({
            "q1": "yes",
            "q2": "yes",
            "q3": "yes",
            "q4": "yes",
            "q5": "yes",
            "q6": "yes",
            "q7": "yes",
            "q8": "yes",
            "q9": "yes"
        });
        let request = make_request(data);
        let result = BehaviourAnalyser::analyze(&request).await.unwrap();
        assert!(result.pattern.straight_line_detected);
    }

    #[test]
    fn test_entropy_high_for_diverse_answers() {
        let answers = vec!["a".into(), "b".into(), "c".into(), "d".into()];
        let entropy = BehaviourAnalyser::calculate_entropy(&answers);
        assert!(entropy > 0.9);
    }

    #[test]
    fn test_entropy_low_for_same_answers() {
        let answers: Vec<String> = vec!["a".into(); 10];
        let entropy = BehaviourAnalyser::calculate_entropy(&answers);
        assert!(entropy < 0.1);
    }

    #[test]
    fn test_straight_lining_detection() {
        let answers: Vec<String> = vec!["yes".into(); 10];
        assert!(BehaviourAnalyser::detect_straight_lining(&answers));
    }

    #[test]
    fn test_no_straight_lining() {
        let answers = vec![
            "yes".into(), "no".into(), "yes".into(), "maybe".into(), "no".into(),
        ];
        assert!(!BehaviourAnalyser::detect_straight_lining(&answers));
    }

    #[test]
    fn test_acquiescence_bias() {
        let answers = vec!["yes".into(), "true".into(), "agree".into(), "no".into()];
        let bias = BehaviourAnalyser::calculate_acquiescence_bias(&answers);
        assert!(bias > 0.7);
    }

    #[test]
    fn test_sequence_complexity_low_for_repetitive() {
        let answers: Vec<String> = (0..10).map(|i| format!("v{}", i % 2)).collect();
        let complexity = BehaviourAnalyser::calculate_sequence_complexity(&answers);
        assert!(complexity < 0.5);
    }

    #[test]
    fn test_sequence_complexity_high_for_diverse() {
        let answers: Vec<String> = vec![
            "a".into(), "d".into(), "b".into(), "e".into(), "c".into(), "f".into(),
        ];
        let complexity = BehaviourAnalyser::calculate_sequence_complexity(&answers);
        assert!(complexity > 0.3);
    }
}
