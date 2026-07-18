# Rust AI Engine Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Service Architecture](#service-architecture)
- [Fraud Detection Algorithms](#fraud-detection-algorithms)
- [GPS Verification](#gps-verification)
- [Trust Score Calculation](#trust-score-calculation)
- [Performance Characteristics](#performance-characteristics)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)

---

## Service Architecture

### Overview

The AI Engine is a high-performance Rust service responsible for real-time fraud detection, GPS verification, and trust score calculation. It processes survey data with sub-100ms latency requirements.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI ENGINE (Rust)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Axum HTTP  │  │   gRPC       │  │   Kafka      │         │
│  │   Server     │  │   Server     │  │   Consumer   │         │
│  │   Port:9090  │  │   Port:9091  │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Processing Pipeline                     │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ Input    │─▶│ Feature  │─▶│ Model    │              │   │
│  │  │ Parser   │  │ Extractor│  │ Inference│              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  │                                        │                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────▼──────┐         │   │
│  │  │ Result   │◀─│ Post     │◀─│ Ensemble     │         │   │
│  │  │ Formatter│  │ Processor│  │ Classifier   │         │   │
│  │  └──────────┘  └──────────┘  └──────────────┘         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Model Storage                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ ONNX     │  │ TensorFlow│  │ Custom   │              │   │
│  │  │ Models   │  │ Lite     │  │ Models   │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Caching Layer                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ LRU      │  │ Redis    │  │ Feature  │              │   │
│  │  │ Cache    │  │ Client   │  │ Store    │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Rust | 1.70+ |
| HTTP Framework | Axum | 0.7 |
| Async Runtime | Tokio | 1.35 |
| gRPC | Tonic | 0.10 |
| ML Inference | Candle / Burn | Latest |
| Serialization | Serde + serde_json | 1.0 |
| HTTP Client | Reqwest | 0.12 |
| Redis | Redis-rs | 0.24 |
| Metrics | Prometheus | 0.13 |
| Tracing | Tracing + OpenTelemetry | Latest |

---

## Fraud Detection Algorithms

### Algorithm Suite

The AI Engine employs an ensemble of fraud detection algorithms:

#### 1. Random Forest Classifier
- **Purpose**: Primary fraud detection
- **Features**: 47 input features
- **Accuracy**: 96.2%
- **Latency**: <10ms

#### 2. Neural Network (MLP)
- **Purpose**: Complex pattern detection
- **Architecture**: Input(47) → Dense(128) → Dense(64) → Dense(32) → Output(1)
- **Activation**: ReLU (hidden), Sigmoid (output)
- **Accuracy**: 94.8%

#### 3. Isolation Forest
- **Purpose**: Anomaly detection
- **Trees**: 100
- **Contamination**: 0.05
- **Latency**: <5ms

#### 4. Statistical Outlier Detection
- **Purpose**: Response pattern analysis
- **Method**: Modified Z-score + IQR
- **Threshold**: 3.0 standard deviations

### Feature Engineering

```rust
pub struct FraudFeatures {
    // Response timing features
    pub avg_time_per_question: f64,
    pub total_completion_time: f64,
    pub time_variance: f64,
    pub straight_line_time: bool,
    
    // GPS features
    pub gps_accuracy: f64,
    pub speed_between_points: f64,
    pub teleport_detected: bool,
    pub location_entropy: f64,
    
    // Response pattern features
    pub answer_change_rate: f64,
    pub straight_lining_score: f64,
    pub response_consistency: f64,
    pub nps_correlation: f64,
    
    // Statistical features
    pub z_score_per_question: Vec<f64>,
    pub response_distribution_skew: f64,
    pub response_distribution_kurtosis: f64,
    
    // Behavioral features
    pub device_fingerprint_consistency: f64,
    pub ip_geolocation_match: bool,
    pub browser_fingerprint_entropy: f64,
    pub session_idle_time_variance: f64,
    
    // Network features
    pub social_network_centrality: f64,
    pub referral_chain_depth: i32,
    pub duplicate_device_count: i32,
}
```

### Detection Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Raw Survey  │────▶│  Feature     │────▶│  Model       │
│  Data        │     │  Extraction  │     │  Ensemble    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌──────────────────────────────┘
                    │
                    ▼
              ┌──────────────┐     ┌──────────────┐
              │  Score       │────▶│  Decision    │
              │  Aggregation │     │  Engine      │
              └──────────────┘     └──────┬───────┘
                                          │
                    ┌─────────────────────┐│
                    │                     ││
                    ▼                     ▼▼
              ┌──────────────┐     ┌──────────────┐
              │  Fraud       │     │  Trust Score │
              │  Report      │     │  Update      │
              └──────────────┘     └──────────────┘
```

---

## GPS Verification

### Verification Methods

#### 1. Coordinate Validation
- Validate latitude (-90 to 90) and longitude (-180 to 180)
- Check against known valid coordinate ranges
- Verify accuracy values are reasonable

#### 2. Speed Analysis
```
Speed = Distance(CurrentPos, PreviousPos) / TimeDelta

If Speed > MAX_TRAVEL_SPEED (e.g., 1000 km/h):
    Flag as potential GPS spoofing
```

#### 3. Teleportation Detection
```rust
fn detect_teleportation(
    points: &[GpsPoint],
    max_distance_km: f64,
    max_time_seconds: u64,
) -> bool {
    for window in points.windows(2) {
        let distance = haversine_distance(&window[0], &window[1]);
        let time_diff = window[1].timestamp - window[0].timestamp;
        
        let implied_speed = distance / (time_diff as f64 / 3600.0);
        
        if implied_speed > MAX_TRAVEL_SPEED_KMH {
            return true;
        }
    }
    false
}
```

#### 4. Geofence Verification
- Define expected survey area geofences
- Verify responses fall within expected boundaries
- Check for geofence boundary anomalies

#### 5. Location Entropy Analysis
- Measure randomness of GPS coordinates
- Low entropy may indicate fabricated locations
- Compare against expected location patterns

### Haversine Distance

```rust
fn haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371.0; // Earth's radius in km
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    let a = (d_lat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (d_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    r * c
}
```

---

## Trust Score Calculation

### Scoring Formula

```
TrustScore = Σ(FactorWeight × FactorScore) × TimeDecayMultiplier

Where:
- FactorWeight: Configurable weight per factor (sum = 1.0)
- FactorScore: Normalized score (0-100) per factor
- TimeDecayMultiplier: Applies time-based decay to historical data
```

### Factor Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Identity Verification | 0.25 | Government ID, email, phone verification |
| Response History | 0.30 | Past verification success rate |
| Behavioral Pattern | 0.20 | Consistency of response patterns |
| Network Analysis | 0.10 | Social graph and referral analysis |
| Compliance | 0.15 | Policy adherence and consent management |

### Time Decay Function

```rust
fn time_decay(score: f64, age_days: f64, half_life_days: f64) -> f64 {
    let decay_factor = (-0.693 * age_days / half_life_days).exp();
    score * decay_factor
}

// Half-life defaults:
// - Recent activity: 30 days
// - Historical data: 90 days
// - Identity verification: 365 days
```

### Score Ranges

| Range | Label | Description |
|-------|-------|-------------|
| 90-100 | Excellent | Highly trusted, full verification |
| 80-89 | Trusted | Reliable with minor concerns |
| 60-79 | Moderate | Acceptable with some risk factors |
| 40-59 | Low | Elevated risk, additional verification needed |
| 0-39 | Poor | High risk, manual review required |

---

## Performance Characteristics

### Benchmarks

| Operation | p50 Latency | p95 Latency | p99 Latency | Throughput |
|-----------|-------------|-------------|-------------|------------|
| Fraud Detection | 15ms | 45ms | 85ms | 10,000 req/s |
| GPS Verification | 8ms | 25ms | 50ms | 15,000 req/s |
| Trust Score Calc | 12ms | 35ms | 65ms | 12,000 req/s |
| Batch Processing | 100ms | 250ms | 450ms | 1,000 batches/s |

### Resource Usage

| Metric | Normal Load | Peak Load |
|--------|-------------|-----------|
| CPU Usage | 25% | 75% |
| Memory Usage | 2 GB | 6 GB |
| GPU Usage (inference) | 40% | 85% |
| Network I/O | 50 Mbps | 200 Mbps |

### Scaling Configuration

```toml
# config.toml
[server]
workers = 8
max_connections = 10000
request_timeout_ms = 5000

[cache]
max_entries = 100000
ttl_seconds = 300

[model]
batch_size = 32
max_batch_wait_ms = 10
model_path = "/models/fraud_detection_v3.onnx"
```

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "models_loaded": 3,
  "cache_hit_rate": 0.85
}
```

### Fraud Detection

```http
POST /api/v1/detect/fraud
Content-Type: application/json

{
  "survey_response_id": "response-uuid-789",
  "survey_id": "survey-uuid-456",
  "answers": [...],
  "metadata": {
    "device_fingerprint": "...",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "gps_data": {
      "latitude": -26.2041,
      "longitude": 28.0473,
      "accuracy": 15.0,
      "timestamp": "2026-07-16T12:00:00Z"
    },
    "completion_time_seconds": 450,
    "question_timings": [12, 8, 15, 10, 20]
  }
}
```

**Response:**
```json
{
  "response_id": "response-uuid-789",
  "fraud_score": 0.15,
  "risk_level": "LOW",
  "is_fraudulent": false,
  "confidence": 0.92,
  "indicators": [],
  "model_scores": {
    "random_forest": 0.12,
    "neural_network": 0.18,
    "isolation_forest": 0.14,
    "statistical": 0.16
  },
  "processing_time_ms": 18
}
```

### GPS Verification

```http
POST /api/v1/verify/gps
Content-Type: application/json

{
  "response_id": "response-uuid-789",
  "gps_points": [
    {
      "latitude": -26.2041,
      "longitude": 28.0473,
      "accuracy": 15.0,
      "timestamp": "2026-07-16T12:00:00Z"
    },
    {
      "latitude": -26.2045,
      "longitude": 28.0478,
      "accuracy": 12.0,
      "timestamp": "2026-07-16T12:05:00Z"
    }
  ],
  "expected_geofence": {
    "center": {"latitude": -26.2050, "longitude": 28.0470},
    "radius_km": 5.0
  }
}
```

**Response:**
```json
{
  "response_id": "response-uuid-789",
  "is_valid": true,
  "within_geofence": true,
  "max_speed_detected_kmh": 2.5,
  "teleportation_detected": false,
  "location_consistency_score": 0.95,
  "analysis": {
    "total_distance_km": 0.5,
    "avg_accuracy_meters": 13.5,
    "point_count": 2,
    "anomalies": []
  }
}
```

### Trust Score Calculation

```http
POST /api/v1/trust/calculate
Content-Type: application/json

{
  "entity_id": "user-uuid-123",
  "entity_type": "USER",
  "force_recalculate": false
}
```

**Response:**
```json
{
  "entity_id": "user-uuid-123",
  "trust_score": 87.5,
  "previous_score": 85.2,
  "factors": {
    "identity_verification": {"score": 95.0, "weight": 0.25, "contribution": 23.75},
    "response_history": {"score": 88.0, "weight": 0.30, "contribution": 26.4},
    "behavioral_pattern": {"score": 82.0, "weight": 0.20, "contribution": 16.4},
    "network_analysis": {"score": 90.0, "weight": 0.10, "contribution": 9.0},
    "compliance": {"score": 78.0, "weight": 0.15, "contribution": 11.7}
  },
  "calculation_time_ms": 12,
  "cached": false
}
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUST_LOG` | Log level | `info` |
| `SERVER_HOST` | Listen address | `0.0.0.0` |
| `SERVER_PORT` | Listen port | `9090` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `MODEL_PATH` | ML models directory | `/models` |
| `CACHE_TTL_SECONDS` | Cache time-to-live | `300` |
| `MAX_BATCH_SIZE` | Maximum batch size | `32` |
| `GPU_ENABLED` | Enable GPU inference | `false` |

### Config File

```toml
# config.toml

[server]
host = "0.0.0.0"
port = 9090
workers = 8
max_payload_size_mb = 10

[redis]
url = "redis://localhost:6379"
pool_size = 20
connect_timeout_ms = 5000

[model]
base_path = "/models"
fraud_model = "fraud_detection_v3.onnx"
trust_model = "trust_score_v2.onnx"
anomaly_model = "isolation_forest_v1.onnx"

[cache]
enabled = true
max_entries = 100000
ttl_seconds = 300
eviction_policy = "lru"

[metrics]
enabled = true
port = 9091
path = "/metrics"

[tracing]
enabled = true
endpoint = "http://jaeger-collector:14268"
service_name = "ai-engine"
sample_rate = 0.1
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
