# Blockchain Documentation

**Survey Verification Platform**
**Version**: 1.0.0
**Author**: BackOffice Pro (Pty) Ltd
**Last Updated**: 2026-07-16

---

## Table of Contents

- [Smart Contract Architecture](#smart-contract-architecture)
- [NFT Specification](#nft-specification)
- [Verification Registry](#verification-registry)
- [Trust Score Oracle](#trust-score-oracle)
- [Deployment Guide](#deployment-guide)
- [Gas Optimization](#gas-optimization)
- [Security Considerations](#security-considerations)

---

## Smart Contract Architecture

### Overview

The Survey Verification Platform utilizes Ethereum-compatible smart contracts deployed on the Polygon network for cost-effective, scalable on-chain verification records and NFT certificate minting.

### Network Selection

| Network | Chain ID | Purpose | Status |
|---------|----------|---------|--------|
| Polygon Mainnet | 137 | Production deployments | Active |
| Polygon Mumbai | 80001 | Testnet development | Active |
| Ethereum Mainnet | 1 | Future high-value records | Planned |

### Contract Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                  SurveyVerifyRegistry                       │
│                  (Main Entry Point)                         │
├─────────────────────────────────────────────────────────────┤
│  - Admin functions                                          │
│  - Fee management                                           │
│  - Contract versioning                                      │
│  - Access control delegation                                │
└───────────┬──────────────────────┬──────────────────────────┘
            │                      │
┌───────────▼──────────┐  ┌───────▼──────────────────────┐
│ VerificationRegistry │  │ SurveyVerificationNFT         │
│                      │  │ (ERC-721)                    │
│ - Submit record      │  │                              │
│ - Query records      │  │ - Mint certificates          │
│ - Verify existence   │  │ - Transfer ownership         │
│ - Batch operations   │  │ - Metadata management        │
└──────────────────────┘  └──────────────────────────────┘
            │
┌───────────▼──────────┐
│ TrustScoreOracle      │
│                      │
│ - Update trust scores│
│ - Query scores       │
│ - Score history      │
│ - Chainlink feeds    │
└──────────────────────┘
```

### Solidity Version

All contracts target Solidity 0.8.20+ with optimizer enabled (200 runs).

---

## NFT Specification

### ERC-721 Certificate Token

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SurveyVerificationNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct CertificateData {
        address owner;
        bytes32 verificationHash;
        uint256 trustScore;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    mapping(uint256 => CertificateData) public certificates;
    mapping(bytes32 => bool) public verificationHashes;
    
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 verificationHash,
        uint256 trustScore
    );
    
    event CertificateTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    constructor() ERC721("Survey Verification Certificate", "SVCERT") Ownable(msg.sender) {}
    
    function mintCertificate(
        address to,
        bytes32 verificationHash,
        uint256 trustScore,
        string memory uri,
        uint256 expiresAt
    ) public onlyOwner returns (uint256) {
        require(!verificationHashes[verificationHash], "Verification already recorded");
        require(trustScore > 0 && trustScore <= 100, "Invalid trust score");
        require(expiresAt > block.timestamp, "Expiry must be in the future");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        certificates[tokenId] = CertificateData({
            owner: to,
            verificationHash: verificationHash,
            trustScore: trustScore,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });
        
        verificationHashes[verificationHash] = true;
        
        emit CertificateMinted(tokenId, to, verificationHash, trustScore);
        
        return tokenId;
    }
    
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        CertificateData memory cert = certificates[tokenId];
        return cert.isActive && block.timestamp < cert.expiresAt;
    }
}
```

### Certificate Metadata Standard

```json
{
  "name": "Survey Verification Certificate #001",
  "description": "This NFT certifies the verified completion and integrity of a survey response on the Survey Verification Platform by BackOffice Pro (Pty) Ltd.",
  "image": "ipfs://QmImageHash123456789",
  "external_url": "https://surveyverify.backofficepro.co.za/certificate/001",
  "attributes": [
    {
      "trait_type": "Survey Type",
      "value": "Customer Satisfaction"
    },
    {
      "trait_type": "Trust Score",
      "value": 87.5,
      "display_type": "number"
    },
    {
      "trait_type": "Verification Level",
      "value": "Full"
    },
    {
      "trait_type": "Fraud Risk",
      "value": "Low"
    },
    {
      "trait_type": "Issue Date",
      "value": 1689500000,
      "display_type": "date"
    },
    {
      "trait_type": "Expiry Date",
      "value": 1721036000,
      "display_type": "date"
    },
    {
      "trait_type": "Network",
      "value": "Polygon"
    },
    {
      "trait_type": "Issued By",
      "value": "BackOffice Pro (Pty) Ltd"
    }
  ]
}
```

---

## Verification Registry

### Contract Specification

```solidity
contract VerificationRegistry is Ownable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    struct VerificationRecord {
        bytes32 recordHash;
        address submitter;
        uint256 timestamp;
        uint8 status; // 0: Pending, 1: Confirmed, 2: Rejected, 3: Revoked
        string metadataURI;
        bytes32[] proofChain;
    }
    
    mapping(bytes32 => VerificationRecord) public records;
    bytes32[] public recordHashes;
    
    uint256 public fee;
    uint256 public totalRecords;
    
    event VerificationSubmitted(
        bytes32 indexed recordHash,
        address indexed submitter,
        uint256 timestamp
    );
    
    event VerificationConfirmed(
        bytes32 indexed recordHash,
        uint256 timestamp
    );
    
    event VerificationRevoked(
        bytes32 indexed recordHash,
        address indexed revokedBy,
        string reason
    );
    
    function submitVerification(
        bytes32 recordHash,
        string memory metadataURI
    ) public payable returns (bytes32) {
        require(msg.value >= fee, "Insufficient fee");
        require(records[recordHash].timestamp == 0, "Record already exists");
        
        records[recordHash] = VerificationRecord({
            recordHash: recordHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            status: 0, // Pending
            metadataURI: metadataURI,
            proofChain: new bytes32[](0)
        });
        
        recordHashes.push(recordHash);
        totalRecords++;
        
        emit VerificationSubmitted(recordHash, msg.sender, block.timestamp);
        
        return recordHash;
    }
    
    function confirmVerification(bytes32 recordHash) public onlyRole(VERIFIER_ROLE) {
        require(records[recordHash].timestamp != 0, "Record not found");
        require(records[recordHash].status == 0, "Record not pending");
        
        records[recordHash].status = 1; // Confirmed
        
        emit VerificationConfirmed(recordHash, block.timestamp);
    }
    
    function verifyExistence(bytes32 recordHash) public view returns (bool, uint8) {
        VerificationRecord memory record = records[recordHash];
        return (record.timestamp != 0, record.status);
    }
    
    function getRecordCount() public view returns (uint256) {
        return totalRecords;
    }
}
```

### Data Integrity Model

```
┌─────────────────────────────────────────────────────────────┐
│                  Verification Data Chain                    │
│                                                             │
│  Survey Response ──▶ Hash (SHA-256) ──▶ On-Chain Record    │
│       │                    │                    │           │
│       ▼                    ▼                    ▼           │
│  Raw Data            Data Hash          Immutable Proof     │
│  (Off-chain)         (Content           (Blockchain)       │
│                       Addressable)                          │
│                                                             │
│  Merkle Tree Root ──▶ Stored On-Chain ──▶ Proof of         │
│  (Batch of records)   (Single hash)      Inclusion         │
└─────────────────────────────────────────────────────────────┘
```

---

## Trust Score Oracle

### Oracle Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Trust Score    │────▶│  Chainlink       │────▶│  On-Chain Trust  │
│   Service (Java) │     │  External Adapter│     │  Score Contract  │
│                  │     │                  │     │                  │
│  Calculates      │     │  Translates      │     │  Stores and      │
│  scores off-chain│     │  off-chain to    │     │  serves scores   │
│                  │     │  on-chain        │     │  to contracts    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Oracle Contract

```solidity
contract TrustScoreOracle is ChainlinkClient, Ownable {
    mapping(address => int256) public trustScores;
    mapping(address => uint256) public lastUpdated;
    
    uint256 public constant UPDATE_INTERVAL = 1 hours;
    
    event TrustScoreUpdated(
        address indexed entity,
        int256 newScore,
        uint256 timestamp
    );
    
    function updateTrustScore(
        address entity,
        int256 score,
        bytes calldata signature
    ) external onlyAuthorized {
        require(score >= 0 && score <= 100, "Invalid score");
        require(verifySignature(entity, score, signature), "Invalid signature");
        
        trustScores[entity] = score;
        lastUpdated[entity] = block.timestamp;
        
        emit TrustScoreUpdated(entity, score, block.timestamp);
    }
    
    function getTrustScore(address entity) public view returns (int256) {
        return trustScores[entity];
    }
    
    function isScoreFresh(address entity) public view returns (bool) {
        return block.timestamp - lastUpdated[entity] < UPDATE_INTERVAL;
    }
}
```

---

## Deployment Guide

### Prerequisites

```bash
# Install dependencies
npm install @openzeppelin/contracts @chainlink/contracts

# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Configure hardhat.config.js
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 137
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 80001
    }
  }
};
```

### Deployment Scripts

```bash
# Deploy to Mumbai (testnet)
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Polygon (production)
npx hardhat run scripts/deploy.js --network polygon

# Verify contracts on Polygonscan
npx hardhat verify --network polygon DEPLOYED_ADDRESS constructor_arg1
```

### Post-Deployment Configuration

```bash
# Grant roles
cast send $REGISTRY_ADDRESS "grantRole(bytes32,address)" \
  0xVERIFIER_ROLE_HASH $VERIFIER_ADDRESS \
  --rpc-url $POLYGON_RPC_URL \
  --private-key $DEPLOYER_KEY

# Set fees
cast send $REGISTRY_ADDRESS "setFee(uint256)" 10000000000000000 \
  --rpc-url $POLYGON_RPC_URL \
  --private-key $DEPLOYER_KEY
```

---

## Gas Optimization

### Strategies Implemented

| Strategy | Savings | Description |
|----------|---------|-------------|
| Batch Operations | ~40% | Process multiple records in single transaction |
| Merkle Proofs | ~60% | Store root hash, verify individual items off-chain |
| Optimized Storage | ~25% | Pack struct variables, use appropriate types |
| Assembly Blocks | ~15% | Critical path optimizations |
| Lazy Minting | ~30% | Mint NFTs only when needed |

### Gas Estimates

| Operation | Estimated Gas | MATIC Cost (30 gwei) |
|-----------|--------------|----------------------|
| Submit Verification | 120,000 | 0.0036 |
| Confirm Verification | 45,000 | 0.00135 |
| Mint NFT | 150,000 | 0.0045 |
| Transfer NFT | 65,000 | 0.00195 |
| Update Trust Score | 55,000 | 0.00165 |
| Batch Submit (10) | 500,000 | 0.015 |

### Batch Operations

```solidity
function batchSubmitVerification(
    bytes32[] calldata recordHashes,
    string[] calldata metadataURIs
) external payable returns (bytes32[]) {
    require(recordHashes.length == metadataURIs.length, "Array length mismatch");
    require(msg.value >= fee * recordHashes.length, "Insufficient fee");
    
    bytes32[] memory results = new bytes32[](recordHashes.length);
    
    for (uint256 i = 0; i < recordHashes.length; i++) {
        results[i] = _submitSingle(recordHashes[i], metadataURIs[i]);
    }
    
    return results;
}
```

---

## Security Considerations

### Smart Contract Security

| Risk | Mitigation |
|------|------------|
| Reentrancy | ReentrancyGuard on all state-changing functions |
| Integer Overflow | Solidity 0.8+ built-in checks |
| Access Control | OpenZeppelin AccessControl with role-based permissions |
| Front-Running | Commit-reveal scheme for sensitive operations |
| Oracle Manipulation | Signature verification, multi-oracle consensus |
| Gas Griefing | Gas limits, batch size limits |

### Audit Checklist

- [ ] All functions reviewed for access control
- [ ] Reentrancy guards applied
- [ ] Integer overflow/underflow checked
- [ ] Events emitted for all state changes
- [ ] Gas optimization applied
- [ ] Test coverage > 95%
- [ ] Formal verification for critical paths
- [ ] External audit by certified firm
- [ ] Bug bounty program active

### Upgradeability

Contracts use the Transparent Proxy pattern for upgradeability:

```solidity
// Deploy proxy
TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
    logicContract.address,
    admin,
    ""
);

// Upgrade (admin only)
proxy.upgradeToAndCall(newLogicContract.address, "");
```

### Emergency Procedures

```solidity
// Circuit breaker
bool public paused;

function pause() external onlyAdmin {
    paused = true;
    emit Paused(msg.sender);
}

function unpause() external onlyAdmin {
    paused = false;
    emit Unpaused(msg.sender);
}

modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}
```

---

*Document Version: 1.0.0*
*Copyright © 2024-2026 BackOffice Pro (Pty) Ltd. All rights reserved.*
