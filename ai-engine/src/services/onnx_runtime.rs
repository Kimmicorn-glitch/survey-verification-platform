use ort::{Session, SessionBuilder, Value};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

use crate::error::{AppError, AppResult};
use crate::config::AppConfig;

/// Supported ONNX model types for survey verification ML inference.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ModelType {
    /// Fraud detection model (response patterns, timing anomalies).
    FraudDetection,
    /// Trust score prediction model (multi-factor scoring).
    TrustScore,
    /// Response quality model (text/choice quality assessment).
    ResponseQuality,
    /// NFT eligibility model (approval scoring).
    NftEligibility,
}

impl ModelType {
    pub fn filename(&self) -> &str {
        match self {
            ModelType::FraudDetection => "fraud_detection.onnx",
            ModelType::TrustScore => "trust_score.onnx",
            ModelType::ResponseQuality => "response_quality.onnx",
            ModelType::NftEligibility => "nft_eligibility.onnx",
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            ModelType::FraudDetection => "fraud_detection",
            ModelType::TrustScore => "trust_score",
            ModelType::ResponseQuality => "response_quality",
            ModelType::NftEligibility => "nft_eligibility",
        }
    }
}

/// Input tensor for model inference.
#[derive(Debug, Clone)]
pub struct ModelInput {
    /// Feature vector (flat array of floats).
    pub features: Vec<f32>,
    /// Expected input dimension.
    pub expected_dim: usize,
}

/// Output from model inference.
#[derive(Debug, Clone)]
pub struct ModelOutput {
    /// Raw prediction scores (one per output class/dimension).
    pub scores: Vec<f32>,
    /// Confidence of the prediction (0.0 to 1.0).
    pub confidence: f32,
    /// Inference time in milliseconds.
    pub inference_time_ms: f64,
}

/// ONNX Runtime model manager.
///
/// Handles loading, caching, and running inference on ONNX models.
/// Models are loaded lazily on first use and cached for subsequent calls.
pub struct OnnxModelManager {
    model_dir: PathBuf,
    sessions: Arc<RwLock<std::collections::HashMap<ModelType, Arc<Session>>>>,
}

impl OnnxModelManager {
    /// Create a new model manager pointing to the given model directory.
    pub fn new(config: &AppConfig) -> Self {
        let model_dir = PathBuf::from(&config.model_dir);
        info!(model_dir = %model_dir.display(), "Initializing ONNX model manager");

        Self {
            model_dir,
            sessions: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Check if a model file exists on disk.
    pub fn model_exists(&self, model_type: ModelType) -> bool {
        self.model_dir.join(model_type.filename()).exists()
    }

    /// List all available models in the model directory.
    pub fn list_available_models(&self) -> Vec<ModelType> {
        let mut available = Vec::new();
        for model_type in &[
            ModelType::FraudDetection,
            ModelType::TrustScore,
            ModelType::ResponseQuality,
            ModelType::NftEligibility,
        ] {
            if self.model_exists(*model_type) {
                available.push(*model_type);
            }
        }
        available
    }

    /// Load a model into memory. Returns cached session if already loaded.
    pub async fn load_model(&self, model_type: ModelType) -> AppResult<Arc<Session>> {
        {
            let sessions = self.sessions.read().await;
            if let Some(session) = sessions.get(&model_type) {
                return Ok(Arc::clone(session));
            }
        }

        let model_path = self.model_dir.join(model_type.filename());
        if !model_path.exists() {
            warn!(
                model = model_type.as_str(),
                path = %model_path.display(),
                "Model file not found, using fallback heuristic"
            );
            return Err(AppError::Configuration(format!(
                "Model file not found: {}",
                model_path.display()
            )));
        }

        info!(
            model = model_type.as_str(),
            path = %model_path.display(),
            "Loading ONNX model"
        );

        let session = SessionBuilder::new()
            .map_err(|e| AppError::ModelInference(format!("Failed to create session builder: {}", e)))?
            .commit_from_file(&model_path)
            .map_err(|e| {
                error!(model = model_type.as_str(), error = %e, "Failed to load ONNX model");
                AppError::ModelInference(format!("Failed to load model {}: {}", model_type.as_str(), e))
            })?;

        let session = Arc::new(session);

        {
            let mut sessions = self.sessions.write().await;
            sessions.insert(model_type, Arc::clone(&session));
        }

        info!(model = model_type.as_str(), "ONNX model loaded successfully");
        Ok(session)
    }

    /// Run inference on a loaded model with the given input features.
    pub async fn infer(
        &self,
        model_type: ModelType,
        input: ModelInput,
    ) -> AppResult<ModelOutput> {
        let start = std::time::Instant::now();

        let session = self.load_model(model_type).await?;

        if input.features.len() != input.expected_dim {
            return Err(AppError::ModelInference(format!(
                "Expected {} features, got {}",
                input.expected_dim,
                input.features.len()
            )));
        }

        let input_tensor = Value::from_array((1, input.expected_dim), &input.features)
            .map_err(|e| AppError::ModelInference(format!("Failed to create input tensor: {}", e)))?;

        let outputs = session.run(ort::inputs![input_tensor].map_err(|e| {
            AppError::ModelInference(format!("Failed to prepare inputs: {}", e))
        })?)
        .map_err(|e| {
            error!(model = model_type.as_str(), error = %e, "Inference failed");
            AppError::ModelInference(format!("Inference failed: {}", e))
        })?;

        let inference_time = start.elapsed().as_secs_f64() * 1000.0;

        let scores = if let Some(output) = outputs.first() {
            output.try_extract_tensor::<f32>()
                .map_err(|e| AppError::ModelInference(format!("Failed to extract output: {}", e)))?
                .as_slice()
                .unwrap_or(&[])
                .to_vec()
        } else {
            return Err(AppError::ModelInference("No output from model".to_string()));
        };

        let confidence = scores.iter().cloned().fold(f32::NEG_INFINITY, f32::max);

        Ok(ModelOutput {
            scores,
            confidence,
            inference_time_ms: inference_time,
        })
    }

    /// Run inference with fallback to a heuristic score if the model is unavailable.
    pub async fn infer_with_fallback(
        &self,
        model_type: ModelType,
        input: ModelInput,
        fallback_score: f32,
    ) -> ModelOutput {
        match self.infer(model_type, input).await {
            Ok(output) => output,
            Err(e) => {
                warn!(
                    model = model_type.as_str(),
                    error = %e,
                    fallback_score,
                    "Model unavailable, using fallback heuristic"
                );
                ModelOutput {
                    scores: vec![fallback_score],
                    confidence: 0.0,
                    inference_time_ms: 0.0,
                }
            }
        }
    }

    /// Unload a model from memory.
    pub async fn unload_model(&self, model_type: ModelType) {
        let mut sessions = self.sessions.write().await;
        if sessions.remove(&model_type).is_some() {
            info!(model = model_type.as_str(), "Model unloaded from memory");
        }
    }

    /// Unload all models from memory.
    pub async fn unload_all(&self) {
        let mut sessions = self.sessions.write().await;
        let count = sessions.len();
        sessions.clear();
        info!(count, "All models unloaded from memory");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AppConfig;

    fn test_config() -> AppConfig {
        AppConfig {
            port: 8080,
            database_url: "postgres://localhost/test".to_string(),
            jwt_secret: "test-secret".to_string(),
            model_dir: "/tmp/test-models".to_string(),
            verification_api_url: "http://localhost:3001".to_string(),
            max_trust_threshold: 0.95,
            geohash_precision: 8,
            rate_limit_rpm: 120,
        }
    }

    #[test]
    fn test_model_type_filename() {
        assert_eq!(ModelType::FraudDetection.filename(), "fraud_detection.onnx");
        assert_eq!(ModelType::TrustScore.filename(), "trust_score.onnx");
        assert_eq!(ModelType::ResponseQuality.filename(), "response_quality.onnx");
        assert_eq!(ModelType::NftEligibility.filename(), "nft_eligibility.onnx");
    }

    #[test]
    fn test_model_type_as_str() {
        assert_eq!(ModelType::FraudDetection.as_str(), "fraud_detection");
        assert_eq!(ModelType::TrustScore.as_str(), "trust_score");
        assert_eq!(ModelType::ResponseQuality.as_str(), "response_quality");
        assert_eq!(ModelType::NftEligibility.as_str(), "nft_eligibility");
    }

    #[tokio::test]
    async fn test_model_manager_creation() {
        let config = test_config();
        let manager = OnnxModelManager::new(&config);
        assert!(!manager.model_exists(ModelType::FraudDetection));
    }

    #[tokio::test]
    async fn test_list_available_models_empty_dir() {
        let config = test_config();
        let manager = OnnxModelManager::new(&config);
        let models = manager.list_available_models();
        assert!(models.is_empty());
    }

    #[tokio::test]
    async fn test_load_model_not_found() {
        let config = test_config();
        let manager = OnnxModelManager::new(&config);
        let result = manager.load_model(ModelType::FraudDetection).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_infer_with_fallback_uses_fallback() {
        let config = test_config();
        let manager = OnnxModelManager::new(&config);
        let input = ModelInput {
            features: vec![1.0, 2.0, 3.0],
            expected_dim: 3,
        };
        let output = manager.infer_with_fallback(ModelType::FraudDetection, input, 0.5).await;
        assert_eq!(output.scores, vec![0.5]);
        assert_eq!(output.confidence, 0.0);
        assert_eq!(output.inference_time_ms, 0.0);
    }

    #[tokio::test]
    async fn test_unload_all() {
        let config = test_config();
        let manager = OnnxModelManager::new(&config);
        manager.unload_all().await;
        let sessions = manager.sessions.read().await;
        assert!(sessions.is_empty());
    }

    #[test]
    fn test_input_dimension_mismatch() {
        let input = ModelInput {
            features: vec![1.0, 2.0],
            expected_dim: 5,
        };
        assert_ne!(input.features.len(), input.expected_dim);
    }
}
