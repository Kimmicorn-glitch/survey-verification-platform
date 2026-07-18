// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title TrustScoreOracle - Decentralized Trust Score Aggregation
/// @author BackOffice Pro
/// @notice Aggregates trust scores from multiple oracle sources with weighted
///         scoring, time-based decay, and an appeal mechanism for disputed scores.
/// @dev Scores are in basis points (0-10000). Decay is applied linearly per day.
contract TrustScoreOracle is AccessControl, ReentrancyGuard, Pausable {

    // ─── Roles ─────────────────────────────────────────────────

    bytes32 public constant ORACLE_ROLE   = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");
    bytes32 public constant APPEALER_ROLE = keccak256("APPEALER_ROLE");

    // ─── Structs ───────────────────────────────────────────────

    /// @notice An individual score submission from an oracle source
    struct ScoreSubmission {
        address oracle;
        uint256 score;          // Basis points (0-10000)
        uint256 weight;         // Weight of this oracle (basis points of total)
        uint256 timestamp;      // Block timestamp of submission
        bool    isValid;
    }

    /// @notice Aggregated result for a subject
    struct AggregatedScore {
        uint256 weightedScore;      // Weighted average (basis points)
        uint256 lastUpdated;        // Timestamp of last aggregation
        uint256 decayAdjustedScore; // Score after time-decay
        uint256 submissionCount;    // Number of valid submissions
        bool    hasMinimumSources;  // Whether quorum is met
    }

    /// @notice An appeal against a score
    struct Appeal {
        address appellant;
        string  reason;
        uint256 timestamp;
        bool    resolved;
        bool    upheld;
    }

    // ─── Events ────────────────────────────────────────────────

    event ScoreSubmitted(
        bytes32 indexed subjectId,
        address indexed oracle,
        uint256 score,
        uint256 weight,
        uint256 timestamp
    );

    event ScoreAggregated(
        bytes32 indexed subjectId,
        uint256 weightedScore,
        uint256 decayAdjustedScore,
        uint256 submissionCount
    );

    event AppealFiled(bytes32 indexed subjectId, address indexed appellant, string reason);
    event AppealResolved(bytes32 indexed subjectId, bool upheld);
    event OracleAdded(address indexed oracle, uint256 weight);
    event OracleRemoved(address indexed oracle);

    // ─── Errors ────────────────────────────────────────────────

    error InvalidScore();
    error InvalidWeight();
    error InsufficientSources();
    error AlreadySubmitted();
    error NotOracle();
    error AppealAlreadyResolved();
    error NoAppeal();
    error ZeroAddress();

    // ─── Storage ───────────────────────────────────────────────

    /// @dev subjectId => submissions (bounded by MAX_SOURCES_PER_SUBJECT)
    mapping(bytes32 => ScoreSubmission[]) private _submissions;

    /// @dev subjectId => aggregated score cache
    mapping(bytes32 => AggregatedScore) private _aggregated;

    /// @dev subjectId => appeals
    mapping(bytes32 => Appeal[]) private _appeals;

    /// @dev oracle address => configuration
    mapping(address => OracleConfig) private _oracleConfigs;

    struct OracleConfig {
        uint256 weight;
        bool    isActive;
        uint256 lastSubmissionTime;
    }

    /// @dev Minimum number of oracle sources required for quorum
    uint256 public minSourcesRequired;

    /// @dev Maximum submissions per subject before forcing aggregation
    uint256 public constant MAX_SOURCES_PER_SUBJECT = 50;

    /// @dev Decay rate: score lost per day beyond the freshness window (basis points)
    uint256 public decayRatePerDay;

    /// @dev Freshness window in seconds (no decay within this window)
    uint256 public freshnessWindow;

    /// @dev Appeal resolution window in seconds
    uint256 public appealWindow;

    /// @dev Maximum weight any single oracle can carry (basis points)
    uint256 public constant MAX_ORACLE_WEIGHT = 5_000; // 50%

    // ─── Constructor ───────────────────────────────────────────

    /// @param admin              Initial admin address
    /// @param minSources         Minimum sources for quorum
    /// @param decayRate          Decay rate per day in basis points
    /// @param freshnessWindowSec Seconds before decay starts
    /// @param appealWindowSec    Seconds to file an appeal
    constructor(
        address admin,
        uint256 minSources,
        uint256 decayRate,
        uint256 freshnessWindowSec,
        uint256 appealWindowSec
    ) {
        if (admin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        minSourcesRequired = minSources;
        decayRatePerDay = decayRate;
        freshnessWindow = freshnessWindowSec;
        appealWindow = appealWindowSec;
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyOracle() {
        OracleConfig memory config = _oracleConfigs[msg.sender];
        if (!config.isActive || !hasRole(ORACLE_ROLE, msg.sender)) revert NotOracle();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    // ─── Core: Score Submission ────────────────────────────────

    /// @notice Submit a trust score for a subject
    /// @param subjectId  Unique subject identifier
    /// @param score      Trust score in basis points (0-10000)
    function submitScore(bytes32 subjectId, uint256 score)
        external
        whenNotPaused
        onlyOracle
        nonReentrant
    {
        if (score > 10_000) revert InvalidScore();

        ScoreSubmission[] storage subs = _submissions[subjectId];
        if (subs.length >= MAX_SOURCES_PER_SUBJECT) revert InsufficientSources();

        // Prevent duplicate submissions from the same oracle
        for (uint256 i = 0; i < subs.length; ) {
            if (subs[i].oracle == msg.sender && subs[i].isValid) revert AlreadySubmitted();
            unchecked { i++; }
        }

        OracleConfig storage config = _oracleConfigs[msg.sender];

        subs.push(ScoreSubmission({
            oracle: msg.sender,
            score: score,
            weight: config.weight,
            timestamp: block.timestamp,
            isValid: true
        }));

        config.lastSubmissionTime = block.timestamp;

        emit ScoreSubmitted(subjectId, msg.sender, score, config.weight, block.timestamp);

        // Auto-aggregate if quorum is met
        if (subs.length >= minSourcesRequired) {
            _aggregate(subjectId);
        }
    }

    /// @notice Submit a batch of scores for multiple subjects
    /// @param subjects  Array of subject IDs
    /// @param scores    Array of scores in basis points
    function submitBatchScores(bytes32[] calldata subjects, uint256[] calldata scores)
        external
        whenNotPaused
        onlyOracle
        nonReentrant
    {
        if (subjects.length != scores.length) revert InsufficientSources();

        for (uint256 i = 0; i < subjects.length; ) {
            if (scores[i] > 10_000) revert InvalidScore();
            unchecked { i++; }
        }

        for (uint256 i = 0; i < subjects.length; ) {
            bytes32 subjectId = subjects[i];
            ScoreSubmission[] storage subs = _submissions[subjectId];

            if (subs.length < MAX_SOURCES_PER_SUBJECT) {
                OracleConfig storage config = _oracleConfigs[msg.sender];

                subs.push(ScoreSubmission({
                    oracle: msg.sender,
                    score: scores[i],
                    weight: config.weight,
                    timestamp: block.timestamp,
                    isValid: true
                }));

                emit ScoreSubmitted(subjectId, msg.sender, scores[i], config.weight, block.timestamp);
            }

            unchecked { i++; }
        }
    }

    // ─── Core: Aggregation ─────────────────────────────────────

    /// @notice Manually trigger score aggregation for a subject
    /// @param subjectId Subject to aggregate
    function aggregateScore(bytes32 subjectId) external {
        _aggregate(subjectId);
    }

    /// @dev Internal aggregation with weighted average and decay
    function _aggregate(bytes32 subjectId) internal {
        ScoreSubmission[] storage subs = _submissions[subjectId];
        uint256 totalWeight = 0;
        uint256 weightedSum = 0;
        uint256 validCount = 0;

        for (uint256 i = 0; i < subs.length; ) {
            if (subs[i].isValid) {
                weightedSum += subs[i].score * subs[i].weight;
                totalWeight += subs[i].weight;
                validCount++;
            }
            unchecked { i++; }
        }

        uint256 weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

        // Apply time decay
        uint256 decayAdjusted = _applyDecay(weightedScore, _aggregated[subjectId].lastUpdated);

        _aggregated[subjectId] = AggregatedScore({
            weightedScore: weightedScore,
            lastUpdated: block.timestamp,
            decayAdjustedScore: decayAdjusted,
            submissionCount: validCount,
            hasMinimumSources: validCount >= minSourcesRequired
        });

        emit ScoreAggregated(subjectId, weightedScore, decayAdjusted, validCount);
    }

    /// @dev Apply linear time-based decay to a score
    function _applyDecay(uint256 score, uint256 lastUpdated) internal view returns (uint256) {
        if (lastUpdated == 0 || block.timestamp <= lastUpdated + freshnessWindow) {
            return score;
        }

        uint256 daysElapsed = (block.timestamp - lastUpdated - freshnessWindow) / 1 days;
        uint256 decay = daysElapsed * decayRatePerDay;

        return score > decay ? score - decay : 0;
    }

    // ─── Core: Appeal Mechanism ────────────────────────────────

    /// @notice File an appeal against a subject's trust score
    /// @param subjectId Subject to appeal
    /// @param reason    Explanation for the appeal
    function fileAppeal(bytes32 subjectId, string calldata reason)
        external
        nonReentrant
    {
        Appeal[] storage appeals = _appeals[subjectId];

        // Prevent duplicate unresolved appeals
        for (uint256 i = 0; i < appeals.length; ) {
            if (!appeals[i].resolved) revert AppealAlreadyResolved();
            unchecked { i++; }
        }

        appeals.push(Appeal({
            appellant: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            resolved: false,
            upheld: false
        }));

        emit AppealFiled(subjectId, msg.sender, reason);
    }

    /// @notice Resolve an appeal (admin only)
    /// @param subjectId Subject with the appeal
    /// @param appealIdx Index in the appeals array
    /// @param upheld    Whether the appeal is upheld
    function resolveAppeal(bytes32 subjectId, uint256 appealIdx, bool upheld)
        external
        onlyAdmin
    {
        Appeal[] storage appeals = _appeals[subjectId];
        if (appealIdx >= appeals.length) revert NoAppeal();
        if (appeals[appealIdx].resolved) revert AppealAlreadyResolved();

        appeals[appealIdx].resolved = true;
        appeals[appealIdx].upheld = upheld;

        emit AppealResolved(subjectId, upheld);
    }

    // ─── Views ─────────────────────────────────────────────────

    /// @notice Get the aggregated score for a subject
    /// @param subjectId Subject identifier
    /// @return agg      The aggregated score data
    function getAggregatedScore(bytes32 subjectId)
        external view returns (AggregatedScore memory agg)
    {
        agg = _aggregated[subjectId];
        // Recompute decay on-the-fly for freshness
        agg.decayAdjustedScore = _applyDecay(agg.weightedScore, agg.lastUpdated);
    }

    /// @notice Get all submissions for a subject
    /// @param subjectId Subject identifier
    /// @return subs     Array of score submissions
    function getSubmissions(bytes32 subjectId)
        external view returns (ScoreSubmission[] memory subs)
    {
        return _submissions[subjectId];
    }

    /// @notice Get all appeals for a subject
    /// @param subjectId Subject identifier
    /// @return apps     Array of appeals
    function getAppeals(bytes32 subjectId)
        external view returns (Appeal[] memory apps)
    {
        return _appeals[subjectId];
    }

    /// @notice Get oracle configuration
    /// @param oracleAddr Oracle address
    /// @return config    Oracle weight, active status, and last submission time
    function getOracleConfig(address oracleAddr)
        external view returns (uint256 weight, bool isActive, uint256 lastSub)
    {
        OracleConfig memory c = _oracleConfigs[oracleAddr];
        return (c.weight, c.isActive, c.lastSubmissionTime);
    }

    // ─── Admin: Oracle Management ──────────────────────────────

    /// @notice Register or update an oracle source
    /// @param oracleAddr Oracle wallet address
    /// @param weight     Oracle weight in basis points (max 5000)
    function setOracle(address oracleAddr, uint256 weight)
        external
        onlyAdmin
    {
        if (oracleAddr == address(0)) revert ZeroAddress();
        if (weight > MAX_ORACLE_WEIGHT) revert InvalidWeight();

        _oracleConfigs[oracleAddr] = OracleConfig({
            weight: weight,
            isActive: true,
            lastSubmissionTime: 0
        });

        if (!hasRole(ORACLE_ROLE, oracleAddr)) {
            _grantRole(ORACLE_ROLE, oracleAddr);
        }

        emit OracleAdded(oracleAddr, weight);
    }

    /// @notice Deactivate an oracle
    /// @param oracleAddr Oracle to deactivate
    function removeOracle(address oracleAddr) external onlyAdmin {
        _oracleConfigs[oracleAddr].isActive = false;
        _revokeRole(ORACLE_ROLE, oracleAddr);
        emit OracleRemoved(oracleAddr);
    }

    /// @notice Update protocol parameters
    function setParameters(
        uint256 minSources,
        uint256 decayRate,
        uint256 freshWindow,
        uint256 appealWin
    ) external onlyAdmin {
        minSourcesRequired = minSources;
        decayRatePerDay = decayRate;
        freshnessWindow = freshWindow;
        appealWindow = appealWin;
    }

    // ─── Pausable ──────────────────────────────────────────────

    function pause() external onlyAdmin { _pause(); }
    function unpause() external onlyAdmin { _unpause(); }

    function grantRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(role, account);
    }
}
