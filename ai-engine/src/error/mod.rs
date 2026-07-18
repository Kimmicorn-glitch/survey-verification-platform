use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

/// Unified application error type.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Rate limit exceeded, retry after {retry_after_secs}s")]
    RateLimitExceeded { retry_after_secs: u64 },

    #[error("Model inference error: {0}")]
    ModelInference(String),

    #[error("Geo validation error: {0}")]
    GeoValidation(String),

    #[error("GPS coordinates out of bounds: lat={lat}, lon={lon}")]
    GpsOutOfBounds { lat: f64, lon: f64 },

    #[error("Fraud detected: {reason}")]
    FraudDetected { reason: String },

    #[error("NFT approval failed: {0}")]
    NftApprovalFailed(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),

    #[error("Request timeout")]
    Timeout,

    #[error("Deserialization error: {0}")]
    Deserialization(String),

    #[error("JWT error: {0}")]
    Jwt(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Resource not found".to_string()),
            _ => AppError::Database(err.to_string()),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Deserialization(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AppError::Jwt(err.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self {
            AppError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "DATABASE_ERROR",
                "An internal database error occurred".to_string(),
            ),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg.clone()),
            AppError::RateLimitExceeded { retry_after_secs } => (
                StatusCode::TOO_MANY_REQUESTS,
                "RATE_LIMIT_EXCEEDED",
                format!("Retry after {} seconds", retry_after_secs),
            ),
            AppError::ModelInference(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "MODEL_INFERENCE_ERROR",
                "An internal model inference error occurred".to_string(),
            ),
            AppError::GeoValidation(msg) => (
                StatusCode::BAD_REQUEST,
                "GEO_VALIDATION_ERROR",
                msg.clone(),
            ),
            AppError::GpsOutOfBounds { lat, lon } => (
                StatusCode::BAD_REQUEST,
                "GPS_OUT_OF_BOUNDS",
                format!("Coordinates ({}, {}) are out of valid range", lat, lon),
            ),
            AppError::FraudDetected { reason } => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "FRAUD_DETECTED",
                reason.clone(),
            ),
            AppError::NftApprovalFailed(msg) => (
                StatusCode::FAILED_DEPENDENCY,
                "NFT_APPROVAL_FAILED",
                "NFT approval evaluation failed".to_string(),
            ),
            AppError::Configuration(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "CONFIGURATION_ERROR",
                "An internal configuration error occurred".to_string(),
            ),
            AppError::Internal(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An internal server error occurred".to_string(),
            ),
            AppError::ServiceUnavailable(_) => (
                StatusCode::SERVICE_UNAVAILABLE,
                "SERVICE_UNAVAILABLE",
                "The service is temporarily unavailable".to_string(),
            ),
            AppError::Timeout => (
                StatusCode::GATEWAY_TIMEOUT,
                "TIMEOUT",
                "Request timed out".to_string(),
            ),
            AppError::Deserialization(msg) => (
                StatusCode::BAD_REQUEST,
                "DESERIALIZATION_ERROR",
                msg.clone(),
            ),
            AppError::Jwt(_) => (
                StatusCode::UNAUTHORIZED,
                "JWT_ERROR",
                "Invalid or expired token".to_string(),
            ),
        };

        match &self {
            AppError::RateLimitExceeded { .. } => {
                tracing::warn!(error_code = %error_code, message = %message, "Rate limit exceeded");
            }
            AppError::Validation(_) => {
                tracing::info!(error_code = %error_code, message = %message, "Validation error");
            }
            _ => {
                tracing::error!(error_code = %error_code, message = %message, "Request error");
            }
        }

        let body = json!({
            "error": {
                "code": error_code,
                "message": message,
            }
        });

        (status, axum::Json(body)).into_response()
    }
}

/// Convenience alias for results using AppError.
pub type AppResult<T> = Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;

    #[test]
    fn test_error_not_found_status() {
        let err = AppError::NotFound("test".to_string());
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_error_validation_status() {
        let err = AppError::Validation("bad input".to_string());
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn test_error_unauthorized_status() {
        let err = AppError::Unauthorized("no token".to_string());
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_error_rate_limit_status() {
        let err = AppError::RateLimitExceeded {
            retry_after_secs: 60,
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    }

    #[test]
    fn test_error_fraud_detected_status() {
        let err = AppError::FraudDetected {
            reason: "suspicious pattern".to_string(),
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[test]
    fn test_error_gps_out_of_bounds_status() {
        let err = AppError::GpsOutOfBounds {
            lat: 999.0,
            lon: 999.0,
        };
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn test_error_timeout_status() {
        let err = AppError::Timeout;
        let resp = err.into_response();
        assert_eq!(resp.status(), StatusCode::GATEWAY_TIMEOUT);
    }

    #[test]
    fn test_error_display() {
        let err = AppError::Database("connection refused".to_string());
        assert_eq!(err.to_string(), "Database error: connection refused");
    }

    #[test]
    fn test_from_sqlx_row_not_found() {
        let err: AppError = sqlx::Error::RowNotFound.into();
        assert!(matches!(err, AppError::NotFound(_)));
    }

    #[test]
    fn test_from_serde_json_error() {
        let err = serde_json::from_str::<serde_json::Value>("invalid");
        assert!(err.is_err());
        let app_err: AppError = err.unwrap_err().into();
        assert!(matches!(app_err, AppError::Deserialization(_)));
    }
}
