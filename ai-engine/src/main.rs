use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use axum::http::HeaderValue;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use survey_verification_ai_engine::config::AppConfig;
use survey_verification_ai_engine::repository::DatabasePool;
use survey_verification_ai_engine::routes::create_router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,survey_verification_ai_engine=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    tracing::info!("Starting Survey Verification AI Engine");

    let config = AppConfig::from_env()?;
    let db_pool = DatabasePool::connect(&config.database_url).await?;

    let state = Arc::new(survey_verification_ai_engine::handlers::AppState {
        config: config.clone(),
        db: db_pool,
    });

    let rate_limiter = survey_verification_ai_engine::middleware::get_rate_limiter(config.rate_limit_rpm);
    survey_verification_ai_engine::middleware::spawn_rate_limiter_cleanup(rate_limiter);

    let cors_origins: Vec<HeaderValue> = std::env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000".to_string())
        .split(',')
        .filter_map(|s| HeaderValue::from_str(s.trim()).ok())
        .collect();
    let cors = CorsLayer::new()
        .allow_origin(cors_origins)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024));

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Server shut down gracefully");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received, starting graceful shutdown");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shutdown_signal_compiles() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let handle = tokio::spawn(shutdown_signal());
            drop(handle);
        });
    }
}
