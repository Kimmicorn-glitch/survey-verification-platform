use thiserror::Error;

/// Application configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// Server port.
    pub port: u16,
    /// PostgreSQL connection string.
    pub database_url: String,
    /// JWT secret for token signing.
    pub jwt_secret: String,
    /// ONNX model directory path.
    pub model_dir: String,
    /// External verification API base URL.
    pub verification_api_url: String,
    /// Maximum allowed trust score threshold.
    pub max_trust_threshold: f64,
    /// Geohash precision level for GPS validation.
    pub geohash_precision: u32,
    /// Rate limit requests per minute.
    pub rate_limit_rpm: u32,
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("Missing required environment variable: {0}")]
    MissingVar(String),

    #[error("Invalid configuration value for {key}: {reason}")]
    InvalidValue { key: String, reason: String },

    #[error("Failed to parse integer: {0}")]
    ParseInt(#[from] std::num::ParseIntError),

    #[error("Failed to parse float: {0}")]
    ParseFloat(#[from] std::num::ParseFloatError),
}

impl AppConfig {
    /// Build configuration from environment variables.
    pub fn from_env() -> Result<Self, ConfigError> {
        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()?;

        let database_url = std::env::var("DATABASE_URL")
            .map_err(|_| ConfigError::MissingVar("DATABASE_URL".to_string()))?;

        let jwt_secret = match std::env::var("JWT_SECRET") {
            Ok(val) if !val.is_empty() => val,
            Ok(_) | Err(_) => {
                if cfg!(debug_assertions) {
                    tracing::warn!(
                        "JWT_SECRET not set; using insecure default for development only"
                    );
                    "default-dev-secret-change-in-production".to_string()
                } else {
                    return Err(ConfigError::MissingVar(
                        "JWT_SECRET must be set in production".to_string(),
                    ));
                }
            }
        };

        let model_dir = std::env::var("MODEL_DIR").unwrap_or_else(|_| "./models".to_string());

        let verification_api_url = std::env::var("VERIFICATION_API_URL")
            .unwrap_or_else(|_| "http://localhost:3001".to_string());

        let max_trust_threshold = std::env::var("MAX_TRUST_THRESHOLD")
            .unwrap_or_else(|_| "0.95".to_string())
            .parse::<f64>()
            .map_err(|e| ConfigError::InvalidValue {
                key: "MAX_TRUST_THRESHOLD".to_string(),
                reason: e.to_string(),
            })?;
        if !(0.0..=1.0).contains(&max_trust_threshold) {
            return Err(ConfigError::InvalidValue {
                key: "MAX_TRUST_THRESHOLD".to_string(),
                reason: format!("must be between 0.0 and 1.0, got {}", max_trust_threshold),
            });
        }

        let geohash_precision = std::env::var("GEOHASH_PRECISION")
            .unwrap_or_else(|_| "8".to_string())
            .parse::<u32>()?;
        if geohash_precision < 1 || geohash_precision > 12 {
            return Err(ConfigError::InvalidValue {
                key: "GEOHASH_PRECISION".to_string(),
                reason: format!("must be between 1 and 12, got {}", geohash_precision),
            });
        }

        let rate_limit_rpm = std::env::var("RATE_LIMIT_RPM")
            .unwrap_or_else(|_| "120".to_string())
            .parse::<u32>()?;
        if rate_limit_rpm == 0 {
            return Err(ConfigError::InvalidValue {
                key: "RATE_LIMIT_RPM".to_string(),
                reason: "must be greater than 0".to_string(),
            });
        }

        Ok(AppConfig {
            port,
            database_url,
            jwt_secret,
            model_dir,
            verification_api_url,
            max_trust_threshold,
            geohash_precision,
            rate_limit_rpm,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_from_env_defaults() {
        let temp_dir = tempfile::tempdir().ok();
        let result = AppConfig::from_env();
        if result.is_ok() {
            let config = result.unwrap();
            assert!(config.port > 0);
            assert!(!config.jwt_secret.is_empty());
        }
    }

    #[test]
    fn test_missing_database_url() {
        let original = std::env::var("DATABASE_URL");
        std::env::remove_var("DATABASE_URL");
        let result = AppConfig::from_env();
        assert!(result.is_err());
        if let Ok(val) = original {
            std::env::set_var("DATABASE_URL", val);
        }
    }

    #[test]
    fn test_config_clone() {
        let config = AppConfig {
            port: 8080,
            database_url: "postgres://localhost/test".to_string(),
            jwt_secret: "secret".to_string(),
            model_dir: "./models".to_string(),
            verification_api_url: "http://localhost:3001".to_string(),
            max_trust_threshold: 0.95,
            geohash_precision: 8,
            rate_limit_rpm: 120,
        };
        let cloned = config.clone();
        assert_eq!(cloned.port, 8080);
        assert_eq!(cloned.geohash_precision, 8);
    }
}
