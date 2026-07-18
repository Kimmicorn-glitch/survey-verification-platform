use crate::error::AppResult;
use crate::models::{GeoValidation, GpsCoordinate, SurveyVerificationRequest};

/// Default geohash precision for comparison.
const DEFAULT_PRECISION: u32 = 8;

/// Maximum acceptable distance in meters before GPS validation fails.
const MAX_ACCEPTABLE_DISTANCE_METERS: f64 = 500.0;

/// GPS verification service: validates coordinates, computes geohashes,
/// and measures distances from expected locations.
pub struct GpsVerifier;

impl GpsVerifier {
    /// Full GPS validation of a verification request.
    pub async fn verify(request: &SurveyVerificationRequest) -> AppResult<GeoValidation> {
        let precision = DEFAULT_PRECISION;

        let gps = match &request.gps_coordinates {
            Some(g) => g,
            None => {
                return Ok(GeoValidation {
                    passed: false,
                    reported_geohash: None,
                    expected_geohash: request.expected_geohash.clone(),
                    distance_meters: None,
                    precision,
                    coordinates_valid: false,
                    accuracy_meters: None,
                });
            }
        };

        let coordinates_valid = Self::validate_bounds(gps)?;
        if !coordinates_valid {
            return Ok(GeoValidation {
                passed: false,
                reported_geohash: None,
                expected_geohash: request.expected_geohash.clone(),
                distance_meters: None,
                precision,
                coordinates_valid: false,
                accuracy_meters: gps.accuracy,
            });
        }

        let reported_geohash = Some(
            geohash::encode(
                geo::Coord {
                    x: gps.longitude,
                    y: gps.latitude,
                },
                precision,
            )
            .map_err(|e| crate::error::AppError::GeoValidation(e.to_string()))?,
        );

        let distance_meters = if let Some(ref expected) = request.expected_geohash {
            Some(Self::calculate_distance_from_geohash(
                gps.latitude,
                gps.longitude,
                expected,
            )?)
        } else {
            None
        };

        let passed = if let Some(dist) = distance_meters {
            dist <= MAX_ACCEPTABLE_DISTANCE_METERS
        } else {
            coordinates_valid
        };

        Ok(GeoValidation {
            passed,
            reported_geohash,
            expected_geohash: request.expected_geohash.clone(),
            distance_meters,
            precision,
            coordinates_valid,
            accuracy_meters: gps.accuracy,
        })
    }

    /// Validate that GPS coordinates fall within valid world bounds.
    pub fn validate_bounds(gps: &GpsCoordinate) -> AppResult<bool> {
        let valid_lat = gps.latitude >= -90.0 && gps.latitude <= 90.0;
        let valid_lon = gps.longitude >= -180.0 && gps.longitude <= 180.0;

        if !valid_lat || !valid_lon {
            return Err(crate::error::AppError::GpsOutOfBounds {
                lat: gps.latitude,
                lon: gps.longitude,
            });
        }

        // Check for null island (0,0) - likely spoofed
        if gps.latitude.abs() < 0.001 && gps.longitude.abs() < 0.001 {
            return Ok(false);
        }

        Ok(true)
    }

    /// Generate a geohash at the specified precision for given coordinates.
    pub fn encode_geohash(lat: f64, lon: f64, precision: u32) -> AppResult<String> {
        geohash::encode(
            geo::Coord {
                x: lon,
                y: lat,
            },
            precision,
        )
        .map_err(|e| crate::error::AppError::GeoValidation(e.to_string()))
    }

    /// Decode a geohash to its center coordinate.
    pub fn decode_geohash(hash: &str) -> AppResult<(f64, f64)> {
        let (coord, _) = geohash::decode(hash)
            .map_err(|e| crate::error::AppError::GeoValidation(e.to_string()))?;
        Ok((coord.y, coord.x))
    }

    /// Calculate haversine distance in meters between a GPS point and a geohash center.
    fn calculate_distance_from_geohash(lat: f64, lon: f64, hash: &str) -> AppResult<f64> {
        let (hash_lat, hash_lon) = Self::decode_geohash(hash)?;
        Ok(Self::haversine_distance(lat, lon, hash_lat, hash_lon))
    }

    /// Haversine distance between two GPS points in meters.
    pub fn haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
        let coord1 = geo::Coord { x: lon1, y: lat1 };
        let coord2 = geo::Coord { x: lon2, y: lat2 };
        let haversine = geo::algorithm::Haversine;
        haversine.haversine_distance(&coord1, &coord2).meters
    }

    /// Check if two geohashes are adjacent or equal at a given precision.
    pub fn are_geohashes_compatible(hash1: &str, hash2: &str, precision: u32) -> bool {
        let h1: String = hash1.chars().take(precision as usize).collect();
        let h2: String = hash2.chars().take(precision as usize).collect();
        if h1 == h2 {
            return true;
        }

        // Check adjacency by decoding and computing distance
        if let (Ok(c1), Ok(c2)) = (Self::decode_geohash(&h1), Self::decode_geohash(&h2)) {
            let dist = Self::haversine_distance(c1.0, c1.1, c2.0, c2.1);
            // Adjacent geohashes at precision 8 are typically within ~200m
            dist < 300.0
        } else {
            false
        }
    }

    /// Compute the geohash precision that corresponds to a given accuracy in meters.
    pub fn precision_for_accuracy(accuracy_meters: f64) -> u32 {
        // Geohash precision to approximate cell size:
        // 1: ~5000km, 2: ~1250km, 3: ~156km, 4: ~39km,
        // 5: ~5km, 6: ~1.2km, 7: ~153m, 8: ~38m, 9: ~5m
        if accuracy_meters > 5_000_000.0 {
            1
        } else if accuracy_meters > 1_000_000.0 {
            2
        } else if accuracy_meters > 100_000.0 {
            3
        } else if accuracy_meters > 10_000.0 {
            4
        } else if accuracy_meters > 1_000.0 {
            5
        } else if accuracy_meters > 500.0 {
            6
        } else if accuracy_meters > 100.0 {
            7
        } else if accuracy_meters > 30.0 {
            8
        } else {
            9
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::GpsCoordinate;

    fn make_request(lat: f64, lon: f64, expected: Option<&str>) -> SurveyVerificationRequest {
        SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: Some(GpsCoordinate {
                latitude: lat,
                longitude: lon,
                accuracy: Some(10.0),
                timestamp: Some(chrono::Utc::now()),
            }),
            response_data: serde_json::json!({}),
            completed_at: chrono::Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: expected.map(|s| s.to_string()),
            device_metadata: None,
        }
    }

    #[tokio::test]
    async fn test_valid_gps_passes() {
        let request = make_request(-26.2041, 28.0473, None);
        let result = GpsVerifier::verify(&request).await.unwrap();
        assert!(result.passed);
        assert!(result.coordinates_valid);
        assert!(result.reported_geohash.is_some());
    }

    #[tokio::test]
    async fn test_out_of_bounds_fails() {
        let request = make_request(999.0, 28.0473, None);
        let result = GpsVerifier::verify(&request).await.unwrap();
        assert!(!result.passed);
        assert!(!result.coordinates_valid);
    }

    #[tokio::test]
    async fn test_null_island_fails() {
        let request = make_request(0.0, 0.0, None);
        let result = GpsVerifier::verify(&request).await.unwrap();
        assert!(!result.passed);
    }

    #[tokio::test]
    async fn test_matching_geohash_passes() {
        let hash = GpsVerifier::encode_geohash(-26.2041, 28.0473, 6).unwrap();
        let request = make_request(-26.2041, 28.0473, Some(&hash));
        let result = GpsVerifier::verify(&request).await.unwrap();
        assert!(result.passed);
    }

    #[test]
    fn test_encode_decode_geohash_roundtrip() {
        let hash = GpsVerifier::encode_geohash(-26.2041, 28.0473, 8).unwrap();
        let (lat, lon) = GpsVerifier::decode_geohash(&hash).unwrap();
        assert!((lat - (-26.2041)).abs() < 0.001);
        assert!((lon - 28.0473).abs() < 0.001);
    }

    #[test]
    fn test_haversine_distance() {
        let dist = GpsVerifier::haversine_distance(-26.2041, 28.0473, -26.2041, 28.0473);
        assert!(dist < 1.0);
    }

    #[test]
    fn test_haversine_distance_known_value() {
        // Roughly 100km between these two points
        let dist = GpsVerifier::haversine_distance(-26.2, 28.0, -25.3, 28.0);
        assert!(dist > 50_000.0 && dist < 150_000.0);
    }

    #[test]
    fn test_precision_for_accuracy() {
        assert_eq!(GpsVerifier::precision_for_accuracy(10.0), 9);
        assert_eq!(GpsVerifier::precision_for_accuracy(5000.0), 5);
        assert_eq!(GpsVerifier::precision_for_accuracy(100_000.0), 3);
    }

    #[test]
    fn test_geohash_compatibility() {
        let h = GpsVerifier::encode_geohash(-26.2041, 28.0473, 8).unwrap();
        assert!(GpsVerifier::are_geohashes_compatible(&h, &h, 8));
    }

    #[test]
    fn test_no_gps_fails() {
        let request = SurveyVerificationRequest {
            request_id: uuid::Uuid::new_v4(),
            survey_id: uuid::Uuid::new_v4(),
            respondent_id: uuid::Uuid::new_v4(),
            gps_coordinates: None,
            response_data: serde_json::json!({}),
            completed_at: chrono::Utc::now(),
            fingerprint: "test".to_string(),
            ip_address: None,
            user_agent: None,
            expected_geohash: None,
            device_metadata: None,
        };
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let result = GpsVerifier::verify(&request).await.unwrap();
            assert!(!result.passed);
        });
    }
}
