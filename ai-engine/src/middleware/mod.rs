use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::body::Body;
use axum::extract::{ConnectInfo, Request, State};
use axum::http::header::AUTHORIZATION;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::error::AppError;
use crate::handlers::AppState;

use std::sync::OnceLock;

static RATE_LIMITER: OnceLock<Arc<RateLimiter>> = OnceLock::new();

/// Get or initialize the global rate limiter instance.
pub fn get_rate_limiter(rate_limit_rpm: u32) -> Arc<RateLimiter> {
    RATE_LIMITER
        .get_or_init(|| Arc::new(RateLimiter::new(rate_limit_rpm, 60)))
        .clone()
}

/// Spawn a periodic cleanup task for the rate limiter to prevent memory leaks.
pub fn spawn_rate_limiter_cleanup(limiter: Arc<RateLimiter>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            limiter.cleanup().await;
            tracing::debug!("Rate limiter cleanup completed");
        }
    });
}

/// Claims structure for JWT tokens.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: u64,
    pub iat: u64,
    pub role: Option<String>,
}

/// Authentication context extracted from middleware.
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: String,
    pub role: Option<String>,
}

/// Simple in-memory rate limiter per IP.
pub struct RateLimiter {
    requests: RwLock<HashMap<String, (u32, Instant)>>,
    max_requests: u32,
    window: Duration,
}

impl RateLimiter {
    /// Create a new rate limiter.
    pub fn new(max_requests: u32, window_secs: u64) -> Self {
        Self {
            requests: RwLock::new(HashMap::new()),
            max_requests,
            window: Duration::from_secs(window_secs),
        }
    }

    /// Check if a request is allowed for the given key.
    pub async fn check(&self, key: &str) -> Result<(), u64> {
        let mut map = self.requests.write().await;
        let now = Instant::now();

        let entry = map.entry(key.to_string()).or_insert((0, now));

        if now.duration_since(entry.1) > self.window {
            entry.0 = 1;
            entry.1 = now;
            return Ok(());
        }

        if entry.0 >= self.max_requests {
            let remaining = self.window.as_secs()
                - now.duration_since(entry.1).as_secs();
            return Err(remaining);
        }

        entry.0 += 1;
        Ok(())
    }

    /// Remove expired entries to prevent memory growth.
    pub async fn cleanup(&self) {
        let mut map = self.requests.write().await;
        let now = Instant::now();
        map.retain(|_, (_, last)| now.duration_since(*last) <= self.window);
    }
}

/// JWT authentication middleware.
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization format".to_string()))?;

    let mut validation = Validation::default();
    validation.set_validate_aud(false);

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|e| AppError::Jwt(format!("Invalid token: {}", e)))?;

    let mut req = request;
    req.extensions_mut().insert(AuthContext {
        user_id: token_data.claims.sub,
        role: token_data.claims.role,
    });

    Ok(next.run(req).await)
}

/// Request logging middleware.
pub async fn logging_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start = Instant::now();

    let response = next.run(request).await;

    let duration = start.elapsed();
    let status = response.status();

    tracing::info!(
        method = %method,
        uri = %uri,
        status = %status.as_u16(),
        duration_ms = %duration.as_millis(),
        "Request processed"
    );

    response
}

/// Rate limiting middleware.
pub async fn rate_limit_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let limiter = get_rate_limiter(state.config.rate_limit_rpm);

    let client_ip = request
        .headers()
        .get("X-Forwarded-For")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    match limiter.check(&client_ip).await {
        Ok(()) => {
            let mut response = next.run(request).await;
            let headers = response.headers_mut();
            headers.insert(
                "X-RateLimit-Limit",
                state.config.rate_limit_rpm.to_string().parse().unwrap(),
            );
            Ok(response)
        }
        Err(retry_after) => {
            tracing::warn!(client_ip = %client_ip, "Rate limit exceeded");
            Err(AppError::RateLimitExceeded {
                retry_after_secs: retry_after,
            })
        }
    }
}

/// Extract auth context from request extensions.
pub fn extract_auth(request: &Request) -> Option<AuthContext> {
    request.extensions().get::<AuthContext>().cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_allows_within_limit() {
        let limiter = RateLimiter::new(5, 60);
        for i in 0..5 {
            assert!(limiter.check("test-ip").await.is_ok());
        }
    }

    #[tokio::test]
    async fn test_rate_limiter_blocks_over_limit() {
        let limiter = RateLimiter::new(3, 60);
        let _ = limiter.check("test-ip-2").await;
        let _ = limiter.check("test-ip-2").await;
        let _ = limiter.check("test-ip-2").await;
        let result = limiter.check("test-ip-2").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_rate_limiter_separate_keys() {
        let limiter = RateLimiter::new(1, 60);
        let _ = limiter.check("ip-a").await;
        let result_b = limiter.check("ip-b").await;
        assert!(result_b.is_ok());
    }

    #[test]
    fn test_claims_serialization() {
        let claims = Claims {
            sub: "user-123".to_string(),
            exp: 1700000000,
            iat: 1699996400,
            role: Some("admin".to_string()),
        };
        let json = serde_json::to_string(&claims).unwrap();
        assert!(json.contains("user-123"));
        let decoded: Claims = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded.sub, "user-123");
    }

    #[tokio::test]
    async fn test_rate_limiter_cleanup() {
        let limiter = RateLimiter::new(10, 0);
        let _ = limiter.check("test-cleanup").await;
        // With 0-second window, cleanup should clear everything
        tokio::time::sleep(Duration::from_millis(10)).await;
        limiter.cleanup().await;
        let map = limiter.requests.read().await;
        assert!(map.is_empty());
    }
}
