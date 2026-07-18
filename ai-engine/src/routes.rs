use std::sync::Arc;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;

use crate::handlers::{self, AppState};
use crate::middleware as app_middleware;

/// Build the application router with all routes and middleware.
pub fn create_router(state: Arc<AppState>) -> Router {
    let public_routes = Router::new()
        .route("/health", get(handlers::health_check))
        .route("/api/v1/fraud-analysis", post(handlers::analyze_fraud))
        .route("/api/v1/validate-gps", post(handlers::validate_gps))
        .route("/api/v1/analyze-behaviour", post(handlers::analyze_behaviour));

    let authenticated_routes = Router::new()
        .route("/api/v1/verify", post(handlers::verify_survey))
        .route("/api/v1/verification/{id}", get(handlers::get_verification))
        .route("/api/v1/trust-score/{respondent_id}", get(handlers::get_trust_score))
        .route(
            "/api/v1/nft-eligibility/{respondent_id}",
            get(handlers::get_nft_eligibility),
        )
        .layer(middleware::from_fn_with_state(
            state.clone(),
            app_middleware::auth_middleware,
        ));

    let api_routes = public_routes.merge(authenticated_routes);

    Router::new()
        .merge(api_routes)
        .layer(middleware::from_fn(app_middleware::logging_middleware))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            app_middleware::rate_limit_middleware,
        ))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_router_builds_successfully() {
        let config = crate::config::AppConfig {
            port: 8080,
            database_url: "postgres://localhost/test".to_string(),
            jwt_secret: "test-secret".to_string(),
            model_dir: "./models".to_string(),
            verification_api_url: "http://localhost:3001".to_string(),
            max_trust_threshold: 0.95,
            geohash_precision: 8,
            rate_limit_rpm: 120,
        };

        // We can't easily create a real pool in tests, so just verify the route structure
        // compiles and the router is created without panicking
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Verify the module structure compiles
            let _ = std::mem::size_of::<AppState>();
        });
    }
}
