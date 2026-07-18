// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title VerificationRegistry - On-Chain Survey Verification Registry
/// @author BackOffice Pro
/// @notice Records verification events, maps survey IDs to verification hashes,
///         and provides queryable verification status with time-bounded validity.
/// @dev All verification data is hashes only—raw survey answers never touch-chain.
contract VerificationRegistry is AccessControl, ReentrancyGuard, Pausable {

    // ─── Roles ─────────────────────────────────────────────────

    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");

    // ─── Structs ───────────────────────────────────────────────

    /// @notice Complete record of a single verification event
    struct VerificationRecord {
        bytes32 verificationHash;   // Hash of the verification payload
        address verifier;           // Address that performed verification
        uint256 timestamp;          // Block timestamp of registration
        uint256 expiry;             // When this verification expires
        string  geoHash;            // Location geohash
        uint256 trustScore;         // Trust score at time of verification (basis points)
        bool    isActive;           // Whether the record is currently active
    }

    /// @notice Lightweight status for quick lookups
    struct VerificationStatus {
        bool    exists;
        bool    isActive;
        bool    isExpired;
        uint256 registeredAt;
        uint256 expiresAt;
    }

    // ─── Events ────────────────────────────────────────────────

    event VerificationRegistered(
        bytes32 indexed surveyId,
        bytes32 indexed verificationHash,
        address indexed verifier,
        uint256 timestamp,
        uint256 expiry,
        string  geoHash,
        uint256 trustScore
    );

    event VerificationRevoked(bytes32 indexed surveyId, address indexed revokedBy, uint256 timestamp);
    event VerificationExtended(bytes32 indexed surveyId, uint256 newExpiry);
    event VerificationUpdated(bytes32 indexed surveyId, bytes32 newHash);

    // ─── Errors ────────────────────────────────────────────────

    error AlreadyRegistered();
    error NotRegistered();
    error Expired();
    error NotRevoked();
    error InvalidHash();
    error InvalidExpiry();
    error ZeroAddress();

    // ─── Storage ───────────────────────────────────────────────

    /// @dev surveyId => full verification record
    mapping(bytes32 => VerificationRecord) private _records;

    /// @dev surveyId => verification hash (redundant index for fast lookups)
    mapping(bytes32 => bytes32) private _surveyToHash;

    /// @dev verificationHash => surveyId (reverse index)
    mapping(bytes32 => bytes32) private _hashToSurvey;

    /// @dev All registered survey IDs (for enumeration)
    bytes32[] private _registeredSurveys;

    /// @dev Default validity period: 90 days
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 90 days;

    /// @dev Maximum validity: 1 year
    uint256 public constant MAX_VALIDITY_PERIOD = 365 days;

    // ─── Constructor ───────────────────────────────────────────

    /// @param admin Initial admin address
    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyRegistrar() {
        if (!hasRole(REGISTRAR_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    // ─── Core: Registration ────────────────────────────────────

    /// @notice Register a new verification on-chain
    /// @param surveyId           Unique survey identifier (keccak-256 of survey metadata)
    /// @param verificationHash   Hash of the verification payload
    /// @param geoHash            Geohash string of survey location
    /// @param trustScore         Trust score at time of verification (basis points)
    /// @param validityDuration   How long the verification is valid (0 = default)
    function registerVerification(
        bytes32 surveyId,
        bytes32 verificationHash,
        string  calldata geoHash,
        uint256 trustScore,
        uint256 validityDuration
    )
        external
        whenNotPaused
        onlyRegistrar
        nonReentrant
    {
        if (surveyId == bytes32(0) || verificationHash == bytes32(0)) revert InvalidHash();
        if (_records[surveyId].timestamp != 0) revert AlreadyRegistered();

        uint256 expiry = validityDuration == 0
            ? block.timestamp + DEFAULT_VALIDITY_PERIOD
            : block.timestamp + validityDuration;

        // Store
        _records[surveyId] = VerificationRecord({
            verificationHash: verificationHash,
            verifier: msg.sender,
            timestamp: block.timestamp,
            expiry: expiry,
            geoHash: geoHash,
            trustScore: trustScore,
            isActive: true
        });

        _surveyToHash[surveyId] = verificationHash;
        _hashToSurvey[verificationHash] = surveyId;
        _registeredSurveys.push(surveyId);

        emit VerificationRegistered(
            surveyId,
            verificationHash,
            msg.sender,
            block.timestamp,
            expiry,
            geoHash,
            trustScore
        );
    }

    /// @notice Update an existing verification's hash
    /// @param surveyId   Existing survey ID
    /// @param newHash    New verification hash
    function updateVerificationHash(bytes32 surveyId, bytes32 newHash)
        external
        whenNotPaused
        onlyRegistrar
    {
        if (_records[surveyId].timestamp == 0) revert NotRegistered();
        if (newHash == bytes32(0)) revert InvalidHash();

        bytes32 oldHash = _surveyToHash[surveyId];

        // Remove old reverse mapping
        delete _hashToSurvey[oldHash];

        // Update
        _records[surveyId].verificationHash = newHash;
        _surveyToHash[surveyId] = newHash;
        _hashToSurvey[newHash] = surveyId;

        emit VerificationUpdated(surveyId, newHash);
    }

    /// @notice Revoke an active verification
    /// @param surveyId Survey ID to revoke
    function revokeVerification(bytes32 surveyId)
        external
        whenNotPaused
        onlyRegistrar
    {
        if (_records[surveyId].timestamp == 0) revert NotRegistered();
        if (!_records[surveyId].isActive) revert NotRevoked();

        _records[surveyId].isActive = false;

        emit VerificationRevoked(surveyId, msg.sender, block.timestamp);
    }

    /// @notice Extend a verification's expiry
    /// @param surveyId      Survey ID to extend
    /// @param newExpiry     New expiry timestamp
    function extendVerification(bytes32 surveyId, uint256 newExpiry)
        external
        onlyRegistrar
    {
        if (_records[surveyId].timestamp == 0) revert NotRegistered();
        if (newExpiry <= block.timestamp) revert InvalidExpiry();

        _records[surveyId].expiry = newExpiry;

        emit VerificationExtended(surveyId, newExpiry);
    }

    // ─── Views ─────────────────────────────────────────────────

    /// @notice Get the full verification record for a survey
    /// @param surveyId Survey identifier
    /// @return record  The complete verification record
    function getVerification(bytes32 surveyId)
        external view returns (VerificationRecord memory record)
    {
        record = _records[surveyId];
    }

    /// @notice Check the current verification status
    /// @param surveyId Survey identifier
    /// @return status  Lightweight status struct
    function getVerificationStatus(bytes32 surveyId)
        external view returns (VerificationStatus memory status)
    {
        VerificationRecord memory record = _records[surveyId];
        status.exists = record.timestamp != 0;
        status.isActive = record.isActive;
        status.isExpired = block.timestamp > record.expiry;
        status.registeredAt = record.timestamp;
        status.expiresAt = record.expiry;
    }

    /// @notice Resolve a verification hash to its survey ID
    /// @param vHash Verification hash
    /// @return surveyId  The associated survey ID (bytes32(0) if not found)
    function resolveHash(bytes32 vHash) external view returns (bytes32) {
        return _hashToSurvey[vHash];
    }

    /// @notice Get the verification hash for a survey
    /// @param surveyId Survey identifier
    /// @return vHash   The stored verification hash
    function getVerificationHash(bytes32 surveyId) external view returns (bytes32) {
        return _surveyToHash[surveyId];
    }

    /// @notice Total number of registered verifications
    function registeredCount() external view returns (uint256) {
        return _registeredSurveys.length;
    }

    /// @notice Get all registered survey IDs
    /// @return ids Array of survey IDs
    function getAllRegisteredSurveys() external view returns (bytes32[] memory) {
        return _registeredSurveys;
    }

    /// @notice Check if a verification is currently valid (active and not expired)
    /// @param surveyId Survey identifier
    /// @return valid   True if active and unexpired
    function isCurrentlyValid(bytes32 surveyId) external view returns (bool) {
        VerificationRecord memory record = _records[surveyId];
        return record.timestamp != 0 && record.isActive && block.timestamp <= record.expiry;
    }

    // ─── Admin ─────────────────────────────────────────────────

    /// @notice Pause all write operations
    function pause() external onlyAdmin {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyAdmin {
        _unpause();
    }

    /// @notice Grant a role
    function grantRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(role, account);
    }

    /// @notice Revoke a role
    function revokeRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(role, account);
    }
}
