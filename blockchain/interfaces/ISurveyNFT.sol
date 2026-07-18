// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISurveyNFT - Interface for Survey Verification NFT
/// @notice Defines the external API for the SurveyNFT contract
/// @dev ERC-721 based survey certificate with verification metadata
interface ISurveyNFT {

    // ─── Structs ───────────────────────────────────────────────

    /// @notice Verification metadata stored per token
    struct VerificationData {
        bytes32 verificationHash;      // Hash of the full verification payload
        uint256 timestamp;             // Block timestamp of verification
        string  geoHash;               // Geohash of survey location
        address verifierWallet;        // Wallet that performed verification
        uint256 verificationScore;     // Composite score (0-10000, basis points)
        bool    isValid;               // Current validity status
        uint256 validUntil;            // Expiry timestamp (0 = no expiry)
    }

    // ─── Events ────────────────────────────────────────────────

    event SurveyMinted(
        uint256 indexed tokenId,
        address indexed surveyor,
        bytes32 verificationHash,
        uint256 timestamp,
        string  geoHash,
        uint256 verificationScore,
        string  metadataURI
    );

    event SurveyBurned(uint256 indexed tokenId, address indexed burner);
    event VerificationUpdated(uint256 indexed tokenId, bytes32 newHash, uint256 newScore);
    event MetadataURIUpdated(uint256 indexed tokenId, string newURI);
    event BatchMinted(uint256 startIndex, uint256 count);

    // ─── Errors ────────────────────────────────────────────────

    error InvalidHash();
    error InvalidScore();
    error InvalidGeoHash();
    error URIRequired();
    error NotAuthorized();
    error TokenDoesNotExist();
    error VerificationExpired();

    // ─── Views ─────────────────────────────────────────────────

    /// @notice Retrieve full verification data for a token
    function getVerificationData(uint256 tokenId)
        external view returns (VerificationData memory);

    /// @notice Check if a verification is currently valid
    function isVerificationValid(uint256 tokenId) external view returns (bool);

    /// @notice Get total supply of minted certificates
    function totalSupply() external view returns (uint256);

    /// @notice Check if a wallet has minter role
    function isMinter(address account) external view returns (bool);

    /// @notice Check if a wallet has verifier role
    function isVerifier(address account) external view returns (bool);

    // ─── Mutations ─────────────────────────────────────────────

    /// @notice Mint a verified survey certificate
    function mintSurvey(
        address to,
        bytes32 verificationHash,
        string  calldata geoHash,
        uint256 verificationScore,
        string  calldata metadataURI,
        uint256 validUntil
    ) external returns (uint256);

    /// @notice Batch mint multiple certificates
    function batchMintSurvey(
        address[] calldata recipients,
        bytes32[] calldata hashes,
        string[] calldata geoHashes,
        uint256[] calldata scores,
        string[] calldata uris,
        uint256[] calldata validities
    ) external returns (uint256 startIndex, uint256 count);

    /// @notice Burn a certificate (owner or admin only)
    function burn(uint256 tokenId) external;

    /// @notice Update verification data on an existing token
    function updateVerification(
        uint256 tokenId,
        bytes32 newHash,
        uint256 newScore
    ) external;

    /// @notice Update the metadata URI for a token
    function setMetadataURI(uint256 tokenId, string calldata newURI) external;
}
