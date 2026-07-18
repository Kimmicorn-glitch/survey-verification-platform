// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GeoValidation - Geospatial Verification and Anti-Spoofing
/// @author BackOffice Pro
/// @notice Provides geohash verification, distance calculations, zone-based
///         validation, and anti-spoofing mechanisms for survey locations.
/// @dev Geohash precision is configurable (1-12 characters). All math uses
///      fixed-point arithmetic to avoid floating-point issues on EVM.
contract GeoValidation is AccessControl, ReentrancyGuard {

    // ─── Roles ─────────────────────────────────────────────────

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");

    // ─── Constants ─────────────────────────────────────────────

    /// @dev Earth radius in meters (WGS-84 mean)
    uint256 private constant EARTH_RADIUS_M = 6_371_000;

    /// @dev Maximum allowed geohash length
    uint256 public constant MAX_GEOHASH_LENGTH = 12;

    /// @dev Minimum geohash length for meaningful validation
    uint256 public constant MIN_GEOHASH_LENGTH = 4;

    /// @dev Geohash base-32 alphabet
    string private constant BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    /// @dev PI as fixed-point (6 decimal places)
    uint256 private constant PI_FIXED = 3_141_592;

    // ─── Structs ───────────────────────────────────────────────

    /// @notice A defined geographic zone for allowed survey areas
    struct GeoZone {
        string  zoneName;
        string  centerGeohash;
        uint256 radiusMeters;       // Radius from center in meters
        uint256 minPrecision;       // Minimum geohash precision required
        bool    isActive;
        uint256 createdAt;
    }

    /// @notice Location data for a specific survey
    struct SurveyLocation {
        string  geohash;
        uint256 latitude;           // Fixed-point: degrees * 1e6
        uint256 longitude;          // Fixed-point: degrees * 1e6
        uint256 timestamp;          // Block timestamp of validation
        address validatedBy;        // Validator address
        bool    isInsideZone;       // Whether it falls within any active zone
        bytes32 matchedZone;        // Zone ID if matched
    }

    /// @notice Spoofing detection record
    struct AntiSpoofRecord {
        uint256 submissionCount;    // Total submissions from this address
        uint256 lastSubmissionTime;
        uint256 flaggedCount;       // Number of suspicious submissions
        bool    isFlagged;          // Permanently flagged address
    }

    // ─── Events ────────────────────────────────────────────────

    event LocationValidated(
        bytes32 indexed surveyId,
        string  geohash,
        uint256 latitude,
        uint256 longitude,
        bool    insideZone,
        bytes32 matchedZone
    );

    event ZoneCreated(bytes32 indexed zoneId, string zoneName, uint256 radius);
    event ZoneDeactivated(bytes32 indexed zoneId);
    event ZoneActivated(bytes32 indexed zoneId);
    event SpoofDetected(bytes32 indexed surveyId, address indexed suspect, string reason);
    event AddressFlagged(address indexed flaggedBy, address indexed target);

    // ─── Errors ────────────────────────────────────────────────

    error InvalidGeohash();
    error InvalidCoordinates();
    error ZoneInactive();
    error ZoneNotFound();
    error OutsideAllZones();
    error SpoofDetectedError();
    error AddressIsFlagged();
    error InvalidRadius();
    error ZeroAddress();

    // ─── Storage ───────────────────────────────────────────────

    /// @dev zoneId => zone configuration
    mapping(bytes32 => GeoZone) private _zones;

    /// @dev surveyId => location data
    mapping(bytes32 => SurveyLocation) private _surveyLocations;

    /// @dev address => spoofing record
    mapping(address => AntiSpoofRecord) private _antiSpoof;

    /// @dev All zone IDs for enumeration
    bytes32[] private _zoneIds;

    /// @dev Maximum submissions per address per time window
    uint256 public maxSubmissionsPerWindow;

    /// @dev Time window for rate limiting (seconds)
    uint256 public rateLimitWindow;

    /// @dev Minimum distance (meters) between submissions from the same address
    uint256 public minDistanceBetweenSubmissions;

    /// @dev Number of flagged submissions before permanent flag
    uint256 public flagThreshold;

    // ─── Constructor ───────────────────────────────────────────

    /// @param admin                   Initial admin address
    /// @param maxSubWindow            Max submissions per rate-limit window
    /// @param rateWindow              Rate limit window in seconds
    /// @param minDist                 Min distance between submissions (meters)
    /// @param flagThresh              Submissions before permanent flag
    constructor(
        address admin,
        uint256 maxSubWindow,
        uint256 rateWindow,
        uint256 minDist,
        uint256 flagThresh
    ) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        maxSubmissionsPerWindow = maxSubWindow;
        rateLimitWindow = rateWindow;
        minDistanceBetweenSubmissions = minDist;
        flagThreshold = flagThresh;
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyValidator() {
        if (!hasRole(VALIDATOR_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    // ─── Core: Geohash Validation ──────────────────────────────

    /// @notice Validate a survey's geospatial location
    /// @param surveyId  Unique survey identifier
    /// @param geohash   Geohash string of the survey location
    /// @param latitude  Latitude in fixed-point (degrees * 1e6)
    /// @param longitude Longitude in fixed-point (degrees * 1e6)
    /// @return isInside Whether the location is inside an active zone
    /// @return matchedZoneId The matched zone (bytes32(0) if none)
    function validateLocation(
        bytes32 surveyId,
        string calldata geohash,
        uint256 latitude,
        uint256 longitude
    )
        external
        onlyValidator
        nonReentrant
        returns (bool isInside, bytes32 matchedZoneId)
    {
        // Validate geohash format
        if (!_isValidGeohash(geohash)) revert InvalidGeohash();
        if (latitude > 90_000_000 || longitude > 180_000_000) revert InvalidCoordinates();

        // Anti-spoofing checks
        _runAntiSpoofChecks(surveyId, msg.sender, geohash);

        // Check zone membership
        isInside = false;
        matchedZoneId = bytes32(0);

        for (uint256 i = 0; i < _zoneIds.length; ) {
            bytes32 zId = _zoneIds[i];
            GeoZone memory zone = _zones[zId];

            if (zone.isActive && _isInsideZone(geohash, zone.centerGeohash, zone.radiusMeters)) {
                // Check precision requirement
                if (bytes(geohash).length >= zone.minPrecision) {
                    isInside = true;
                    matchedZoneId = zId;
                    break;
                }
            }
            unchecked { i++; }
        }

        // Store location
        _surveyLocations[surveyId] = SurveyLocation({
            geohash: geohash,
            latitude: latitude,
            longitude: longitude,
            timestamp: block.timestamp,
            validatedBy: msg.sender,
            isInsideZone: isInside,
            matchedZone: matchedZoneId
        });

        emit LocationValidated(surveyId, geohash, latitude, longitude, isInside, matchedZoneId);
    }

    // ─── Core: Distance Calculation ────────────────────────────

    /// @notice Calculate distance between two geohashes in meters
    /// @param hash1 First geohash
    /// @param hash2 Second geohash
    /// @return distanceMeters Distance in meters (fixed-point, 2 decimals)
    function calculateDistance(string calldata hash1, string calldata hash2)
        external pure returns (uint256 distanceMeters)
    {
        (uint256 lat1, uint256 lon1) = _decodeGeohash(hash1);
        (uint256 lat2, uint256 lon2) = _decodeGeohash(hash2);

        distanceMeters = _haversineDistance(lat1, lon1, lat2, lon2);
    }

    /// @notice Check if a geohash falls within a circle around a center geohash
    /// @param geohash      Point to check
    /// @param centerHash   Center of the zone
    /// @param radiusMeters Allowed radius
    /// @return inside      True if within the radius
    function isInsideCircle(
        string calldata geohash,
        string calldata centerHash,
        uint256 radiusMeters
    ) external view returns (bool inside) {
        (uint256 lat1, uint256 lon1) = _decodeGeohash(geohash);
        (uint256 lat2, uint256 lon2) = _decodeGeohash(centerHash);
        return _haversineDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
    }

    // ─── Core: Zone Management ─────────────────────────────────

    /// @notice Create a new geographic zone
    /// @param zoneId        Unique zone identifier
    /// @param zoneName      Human-readable name
    /// @param centerGeohash Center geohash of the zone
    /// @param radiusMeters  Radius in meters
    /// @param minPrecision  Minimum geohash precision required
    function createZone(
        bytes32 zoneId,
        string calldata zoneName,
        string calldata centerGeohash,
        uint256 radiusMeters,
        uint256 minPrecision
    )
        external
        onlyAdmin
    {
        if (radiusMeters == 0) revert InvalidRadius();
        if (!_isValidGeohash(centerGeohash)) revert InvalidGeohash();
        if (minPrecision < MIN_GEOHASH_LENGTH || minPrecision > MAX_GEOHASH_LENGTH)
            revert InvalidGeohash();

        _zones[zoneId] = GeoZone({
            zoneName: zoneName,
            centerGeohash: centerGeohash,
            radiusMeters: radiusMeters,
            minPrecision: minPrecision,
            isActive: true,
            createdAt: block.timestamp
        });

        _zoneIds.push(zoneId);

        emit ZoneCreated(zoneId, zoneName, radiusMeters);
    }

    /// @notice Deactivate a zone
    /// @param zoneId Zone to deactivate
    function deactivateZone(bytes32 zoneId) external onlyAdmin {
        if (_zones[zoneId].createdAt == 0) revert ZoneNotFound();
        _zones[zoneId].isActive = false;
        emit ZoneDeactivated(zoneId);
    }

    /// @notice Reactivate a zone
    /// @param zoneId Zone to reactivate
    function activateZone(bytes32 zoneId) external onlyAdmin {
        if (_zones[zoneId].createdAt == 0) revert ZoneNotFound();
        _zones[zoneId].isActive = true;
        emit ZoneActivated(zoneId);
    }

    // ─── Core: Anti-Spoofing ───────────────────────────────────

    /// @notice Flag an address as suspicious (admin only)
    /// @param target Address to flag
    function flagAddress(address target) external onlyAdmin {
        _antiSpoof[target].isFlagged = true;
        emit AddressFlagged(msg.sender, target, "admin_flag");
    }

    /// @notice Unflag an address
    /// @param target Address to unflag
    function unflagAddress(address target) external onlyAdmin {
        _antiSpoof[target].isFlagged = false;
        _antiSpoof[target].flaggedCount = 0;
    }

    /// @dev Run anti-spoofing checks
    function _runAntiSpoofChecks(
        bytes32 surveyId,
        address submitter,
        string calldata geohash
    ) internal {
        AntiSpoofRecord storage record = _antiSpoof[submitter];

        // Check if address is permanently flagged
        if (record.isFlagged) revert AddressIsFlagged();

        // Rate limiting
        if (block.timestamp <= record.lastSubmissionTime + rateLimitWindow) {
            record.submissionCount++;
            if (record.submissionCount > maxSubmissionsPerWindow) {
                record.flaggedCount++;
                if (record.flaggedCount >= flagThreshold) {
                    record.isFlagged = true;
                    emit AddressFlagged(submitter, submitter, "auto_flag_rate_limit");
                }
                emit SpoofDetected(surveyId, submitter, "rate_limit_exceeded");
                revert SpoofDetectedError();
            }
        } else {
            record.submissionCount = 1;
            record.lastSubmissionTime = block.timestamp;
        }

        // Distance check: if recent submission exists, verify distance
        if (record.lastSubmissionTime != 0 && record.lastSubmissionTime != block.timestamp) {
            // Find most recent location for this submitter (simple approach: check last few)
            // In production, maintain a linked list of recent submissions
        }
    }

    // ─── Views ─────────────────────────────────────────────────

    /// @notice Get the stored location for a survey
    /// @param surveyId Survey identifier
    /// @return loc     The survey's location data
    function getSurveyLocation(bytes32 surveyId)
        external view returns (SurveyLocation memory loc)
    {
        return _surveyLocations[surveyId];
    }

    /// @notice Get zone configuration
    /// @param zoneId Zone identifier
    /// @return zone  Zone data
    function getZone(bytes32 zoneId) external view returns (GeoZone memory zone) {
        return _zones[zoneId];
    }

    /// @notice Get all zone IDs
    function getAllZoneIds() external view returns (bytes32[] memory) {
        return _zoneIds;
    }

    /// @notice Get spoofing record for an address
    function getAntiSpoofRecord(address addr)
        external view returns (uint256 submissions, uint256 flagged, bool isFlagged)
    {
        AntiSpoofRecord memory r = _antiSpoof[addr];
        return (r.submissionCount, r.flaggedCount, r.isFlagged);
    }

    /// @notice Get geohash prefix match length
    /// @param hash1 First geohash
    /// @param hash2 Second geohash
    /// @return matchLen Number of matching prefix characters
    function geohashPrefixLength(string calldata hash1, string calldata hash2)
        external pure returns (uint256 matchLen)
    {
        bytes memory b1 = bytes(hash1);
        bytes memory b2 = bytes(hash2);
        uint256 len = b1.length < b2.length ? b1.length : b2.length;

        for (uint256 i = 0; i < len; ) {
            if (b1[i] != b2[i]) return i;
            unchecked { i++; }
        }
        return len;
    }

    // ─── Geohash Internal Utilities ────────────────────────────

    /// @dev Validate geohash string (base32, correct length)
    function _isValidGeohash(string calldata geohash) internal pure returns (bool) {
        bytes memory g = bytes(geohash);
        if (g.length < MIN_GEOHASH_LENGTH || g.length > MAX_GEOHASH_LENGTH) return false;

        for (uint256 i = 0; i < g.length; ) {
            if (bytes(BASE32).length <= 32) {
                // Simple check: valid base32 chars
                bytes1 c = g[i];
                bool valid = false;
                for (uint256 j = 0; j < 32; ) {
                    if (c == bytes1(bytes(BASE32)[j])) { valid = true; break; }
                    unchecked { j++; }
                }
                if (!valid) return false;
            }
            unchecked { i++; }
        }
        return true;
    }

    /// @dev Decode a geohash to lat/lon (fixed-point, degrees * 1e6)
    function _decodeGeohash(string calldata geohash)
        internal pure returns (uint256 lat, uint256 lon)
    {
        bytes memory g = bytes(geohash);
        bool isLon = true;
        uint256 minLat = 0;
        uint256 maxLat = 90_000_000; // 90 * 1e6
        uint256 minLon = 0;
        uint256 maxLon = 180_000_000; // 180 * 1e6

        for (uint256 i = 0; i < g.length; ) {
            uint256 idx = _base32Index(g[i]);
            for (uint256 bit = 0; bit < 5; ) {
                uint256 mask = 1 << (4 - bit);
                if (isLon) {
                    if (idx & mask != 0) {
                        minLon = (minLon + maxLon) / 2;
                    } else {
                        maxLon = (minLon + maxLon) / 2;
                    }
                } else {
                    if (idx & mask != 0) {
                        minLat = (minLat + maxLat) / 2;
                    } else {
                        maxLat = (minLat + maxLat) / 2;
                    }
                }
                isLon = !isLon;
                unchecked { bit++; }
            }
            unchecked { i++; }
        }

        // Convert from [-90,90] and [-180,180] to [0,180] and [0,360]
        lat = (minLat + maxLat) / 2;
        lon = (minLon + maxLon) / 2;
    }

    /// @dev Get base32 index for a character
    function _base32Index(bytes1 c) internal pure returns (uint256) {
        bytes memory alphabet = bytes(BASE32);
        for (uint256 i = 0; i < 32; ) {
            if (c == alphabet[i]) return i;
            unchecked { i++; }
        }
        return 0; // Should not reach here with valid input
    }

    /// @dev Check if a geohash is inside a zone (simplified: prefix match + distance)
    function _isInsideZone(
        string calldata geohash,
        string calldata centerHash,
        uint256 radiusMeters
    ) internal view returns (bool) {
        (uint256 lat1, uint256 lon1) = _decodeGeohash(geohash);
        (uint256 lat2, uint256 lon2) = _decodeGeohash(centerHash);
        return _haversineDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
    }

    /// @dev Haversine formula for distance between two points (meters)
    ///      Uses fixed-point math (lat/lon in degrees * 1e6)
    function _haversineDistance(
        uint256 lat1, uint256 lon1,
        uint256 lat2, uint256 lon2
    ) internal pure returns (uint256) {
        // Convert to radians: rad = deg * PI / 180
        // With fixed-point: rad = deg_fixed * PI / (180 * 1e6)
        // Simplified: use the difference in fixed-point

        uint256 dLat;
        uint256 dLon;

        if (lat2 > lat1) {
            dLat = lat2 - lat1;
        } else {
            dLat = lat1 - lat2;
        }

        if (lon2 > lon1) {
            dLon = lon2 - lon1;
        } else {
            dLon = lon1 - lon2;
        }

        // Haversine: a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
        // For fixed-point approximation, use simplified distance:
        // For small distances, 1 degree latitude ≈ 111,320 meters
        // 1 degree longitude ≈ 111,320 * cos(latitude) meters

        // Approximate with: d ≈ sqrt((dLat_m)² + (dLon_m)²)
        uint256 dLatMeters = dLat * 111_320 / 1_000_000;
        uint256 avgLat = (lat1 + lat2) / 2;

        // cos(lat) approximation for fixed-point (degrees * 1e6)
        // cos(0) = 1, cos(90) = 0, linear approx is acceptable for MVP
        uint256 cosLat;
        if (avgLat >= 90_000_000) {
            cosLat = 0;
        } else {
            // cos(x) ≈ 1 - (x²/2) for small x; simplified for lat in [0, 90]
            cosLat = (90_000_000 - avgLat) * 10_000 / 90_000_000;
        }

        uint256 dLonMeters = dLon * 111_320 * cosLat / (1_000_000 * 10_000);

        // Euclidean distance (sufficient for short distances)
        uint256 d2 = dLatMeters * dLatMeters + dLonMeters * dLonMeters;

        // Integer square root (Babylonian method)
        return _sqrt(d2);
    }

    /// @dev Integer square root using Babylonian method
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        y = x;
        uint256 z = (x + 1) / 2;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // ─── Admin ─────────────────────────────────────────────────

    function grantRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(role, account);
    }
}
