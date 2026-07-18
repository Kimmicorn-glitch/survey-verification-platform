// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "../interfaces/ISurveyNFT.sol";

/// @title SurveyNFT - ERC-721 Verified Survey Certificate
/// @author BackOffice Pro
/// @notice Mints NFTs that represent verified survey results.
///         Only hashes are stored on-chain—never raw survey answers.
/// @dev Uses AccessControlEnumerable for role management, ReentrancyGuard
///      for external-call safety, and Pausable for emergency stops.
contract SurveyNFT is
    ERC721,
    ERC721Enumerable,
    AccessControlEnumerable,
    ReentrancyGuard,
    Pausable,
    ISurveyNFT
{
    // ─── Role Definitions ──────────────────────────────────────

    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");

    // ─── Storage ───────────────────────────────────────────────

    /// @dev tokenId => verification metadata
    mapping(uint256 => VerificationData) private _verificationData;

    /// @dev tokenId => IPFS/Arweave metadata URI
    mapping(uint256 => string) private _metadataURIs;

    /// @dev Running token counter (never decrements)
    uint256 private _tokenIdCounter;

    /// @dev Maximum score in basis points
    uint256 public constant MAX_SCORE = 10_000;

    /// @dev Default verification validity period (30 days)
    uint256 public constant DEFAULT_VALIDITY = 30 days;

    // ─── Constructor ───────────────────────────────────────────

    /// @param name_  Token collection name
    /// @param symbol_ Token collection symbol
    /// @param admin_  Initial admin address
    /// @param minter_ Initial minter address
    constructor(
        string memory name_,
        string memory symbol_,
        address admin_,
        address minter_
    ) ERC721(name_, symbol_) {
        if (admin_ == address(0)) revert NotAuthorized();

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(MINTER_ROLE, minter_);
        _grantRole(PAUSER_ROLE, admin_);
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyMinter() {
        if (!hasRole(MINTER_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    modifier onlyVerifier() {
        if (!hasRole(VERIFIER_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    modifier validToken(uint256 tokenId) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        _;
    }

    // ─── ERC721 Overrides ──────────────────────────────────────

    /// @dev Block token URI from being set via the inherited ERC721 logic.
    ///      We manage URIs through our own mapping.
    function tokenURI(uint256 tokenId)
        public view override(ERC721)
        returns (string memory)
    {
        _requireOwned(tokenId);
        string memory uri = _metadataURIs[tokenId];
        if (bytes(uri).length == 0) return "";
        return uri;
    }

    /// @dev Required override for ERC721Enumerable
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /// @dev Required override for ERC721Enumerable
    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /// @dev Required override for AccessControlEnumerable
    function _checkRole(bytes32 role, address account)
        internal view override(AccessControlEnumerable)
    {
        super._checkRole(role, account);
    }

    // ─── Core: Minting ─────────────────────────────────────────

    /// @notice Mint a verified survey certificate NFT
    /// @param to               Recipient wallet
    /// @param verificationHash Keccak-256 hash of the verification payload
    /// @param geoHash          Geohash string of the survey location
    /// @param verificationScore Composite score in basis points (0-10000)
    /// @param metadataURI      IPFS/Arweave URI for token metadata
    /// @param validUntil       Expiry timestamp (0 = default 30 days)
    /// @return tokenId         The newly minted token ID
    function mintSurvey(
        address to,
        bytes32 verificationHash,
        string  calldata geoHash,
        uint256 verificationScore,
        string  calldata metadataURI,
        uint256 validUntil
    )
        external
        whenNotPaused
        onlyMinter
        nonReentrant
        returns (uint256 tokenId)
    {
        if (verificationHash == bytes32(0)) revert InvalidHash();
        if (verificationScore > MAX_SCORE) revert InvalidScore();
        if (bytes(geoHash).length == 0) revert InvalidGeoHash();
        if (bytes(metadataURI).length == 0) revert URIRequired();

        tokenId = _tokenIdCounter;

        // Effects
        _verificationData[tokenId] = VerificationData({
            verificationHash: verificationHash,
            timestamp: block.timestamp,
            geoHash: geoHash,
            verifierWallet: msg.sender,
            verificationScore: verificationScore,
            isValid: true,
            validUntil: validUntil == 0
                ? block.timestamp + DEFAULT_VALIDITY
                : validUntil
        });

        _metadataURIs[tokenId] = metadataURI;
        unchecked { _tokenIdCounter++; }

        // Interaction (mint)
        _safeMint(to, tokenId);

        emit SurveyMinted(
            tokenId,
            to,
            verificationHash,
            block.timestamp,
            geoHash,
            verificationScore,
            metadataURI
        );
    }

    /// @notice Batch mint multiple verified survey certificates
    /// @param recipients Array of recipient addresses
    /// @param hashes     Array of verification hashes
    /// @param geoHashes  Array of geohash strings
    /// @param scores     Array of verification scores
    /// @param uris       Array of metadata URIs
    /// @param validities Array of expiry timestamps
    /// @return startIndex First token ID minted in the batch
    /// @return count      Number of tokens minted
    function batchMintSurvey(
        address[] calldata recipients,
        bytes32[] calldata hashes,
        string[] calldata geoHashes,
        uint256[] calldata scores,
        string[] calldata uris,
        uint256[] calldata validities
    )
        external
        whenNotPaused
        onlyMinter
        nonReentrant
        returns (uint256 startIndex, uint256 count)
    {
        uint256 len = recipients.length;
        if (
            len != hashes.length ||
            len != geoHashes.length ||
            len != scores.length ||
            len != uris.length ||
            len != validities.length
        ) revert NotAuthorized();

        startIndex = _tokenIdCounter;

        for (uint256 i = 0; i < len; ) {
            if (hashes[i] == bytes32(0)) revert InvalidHash();
            if (scores[i] > MAX_SCORE) revert InvalidScore();
            if (bytes(geoHashes[i]).length == 0) revert InvalidGeoHash();
            if (bytes(uris[i]).length == 0) revert URIRequired();

            uint256 tid = _tokenIdCounter;

            _verificationData[tid] = VerificationData({
                verificationHash: hashes[i],
                timestamp: block.timestamp,
                geoHash: geoHashes[i],
                verifierWallet: msg.sender,
                verificationScore: scores[i],
                isValid: true,
                validUntil: validities[i] == 0
                    ? block.timestamp + DEFAULT_VALIDITY
                    : validities[i]
            });

            _metadataURIs[tid] = uris[i];

            unchecked { _tokenIdCounter++; tid++; }
            unchecked { i++; }
        }

        count = len;

        // Batch mint via sequential safe mints
        for (uint256 j = 0; j < count; ) {
            _safeMint(recipients[j], startIndex + j);
            unchecked { j++; }
        }

        emit BatchMinted(startIndex, count);
    }

    // ─── Core: Burn ────────────────────────────────────────────

    /// @notice Burn a certificate. Callable by token owner or admin.
    /// @param tokenId The token to burn
    function burn(uint256 tokenId)
        external
        validToken(tokenId)
        nonReentrant
    {
        if (ownerOf(tokenId) != msg.sender && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();

        _verificationData[tokenId].isValid = false;
        _burn(tokenId);

        emit SurveyBurned(tokenId, msg.sender);
    }

    // ─── Core: Verification Updates ────────────────────────────

    /// @notice Update the verification hash and score on an existing token
    /// @param tokenId   Token to update
    /// @param newHash   New verification hash
    /// @param newScore  New verification score (0-10000)
    function updateVerification(
        uint256 tokenId,
        bytes32 newHash,
        uint256 newScore
    )
        external
        whenNotPaused
        onlyVerifier
        validToken(tokenId)
    {
        if (newHash == bytes32(0)) revert InvalidHash();
        if (newScore > MAX_SCORE) revert InvalidScore();

        VerificationData storage data = _verificationData[tokenId];
        data.verificationHash = newHash;
        data.verificationScore = newScore;
        data.timestamp = block.timestamp;

        emit VerificationUpdated(tokenId, newHash, newScore);
    }

    /// @notice Update the metadata URI for a token
    /// @param tokenId  Token to update
    /// @param newURI   New IPFS/Arweave URI
    function setMetadataURI(uint256 tokenId, string calldata newURI)
        external
        whenNotPaused
        onlyAdmin
        validToken(tokenId)
    {
        if (bytes(newURI).length == 0) revert URIRequired();
        _metadataURIs[tokenId] = newURI;

        emit MetadataURIUpdated(tokenId, newURI);
    }

    /// @notice Invalidate a verification (set isValid = false)
    /// @param tokenId Token to invalidate
    function invalidateVerification(uint256 tokenId)
        external
        onlyVerifier
        validToken(tokenId)
    {
        _verificationData[tokenId].isValid = false;
    }

    // ─── Views ─────────────────────────────────────────────────

    /// @inheritdoc ISurveyNFT
    function getVerificationData(uint256 tokenId)
        external view validToken(tokenId)
        returns (VerificationData memory)
    {
        return _verificationData[tokenId];
    }

    /// @inheritdoc ISurveyNFT
    function isVerificationValid(uint256 tokenId)
        external view returns (bool)
    {
        if (tokenId >= _tokenIdCounter) return false;
        VerificationData memory data = _verificationData[tokenId];
        return data.isValid && block.timestamp <= data.validUntil;
    }

    /// @inheritdoc ISurveyNFT
    function totalSupply() external view override returns (uint256) {
        return ERC721Enumerable.totalSupply();
    }

    /// @inheritdoc ISurveyNFT
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /// @inheritdoc ISurveyNFT
    function isVerifier(address account) external view returns (bool) {
        return hasRole(VERIFIER_ROLE, account);
    }

    // ─── Admin ─────────────────────────────────────────────────

    /// @notice Pause all minting and updates
    function pause() external onlyAdmin {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyAdmin {
        _unpause();
    }

    /// @notice Grant a role to an account
    /// @param role    Role bytes32
    /// @param account Target address
    function grantRole(bytes32 role, address account) public override(AccessControlEnumerable) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(role, account);
    }

    /// @notice Revoke a role from an account
    /// @param role    Role bytes32
    /// @param account Target address
    function revokeRole(bytes32 role, address account) public override(AccessControlEnumerable) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(role, account);
    }

    /// @notice Extend the validity of a verification
    /// @param tokenId   Token to extend
    /// @param newExpiry New expiry timestamp
    function extendVerification(uint256 tokenId, uint256 newExpiry)
        external
        onlyVerifier
        validToken(tokenId)
    {
        _verificationData[tokenId].validUntil = newExpiry;
    }
}
