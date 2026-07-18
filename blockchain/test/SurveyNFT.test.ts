import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SurveyNFT } from "../typechain-types";

describe("SurveyNFT", function () {
  let surveyNFT: SurveyNFT;
  let admin: SignerWithAddress;
  let minter: SignerWithAddress;
  let verifier: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  const COLLECTION_NAME = "Survey Verification Certificate";
  const COLLECTION_SYMBOL = "SVCERT";
  const DEFAULT_VALIDITY = 30 * 24 * 60 * 60; // 30 days
  const MAX_SCORE = 10_000;

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("survey-payload-1"));
  const sampleGeoHash = "dqcjq";
  const sampleScore = 8500; // 85%
  const sampleURI = "ipfs://QmSampleMetadataHash/1.json";

  beforeEach(async function () {
    [admin, minter, verifier, user, other] = await ethers.getSigners();

    const SurveyNFTFactory = await ethers.getContractFactory("SurveyNFT");
    surveyNFT = await SurveyNFTFactory.deploy(
      COLLECTION_NAME,
      COLLECTION_SYMBOL,
      admin.address,
      minter.address
    );
    await surveyNFT.waitForDeployment();
  });

  // ─── Deployment ─────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set name and symbol correctly", async function () {
      expect(await surveyNFT.name()).to.equal(COLLECTION_NAME);
      expect(await surveyNFT.symbol()).to.equal(COLLECTION_SYMBOL);
    });

    it("should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await surveyNFT.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should grant minter role to minter address", async function () {
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      expect(await surveyNFT.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("should start with zero total supply", async function () {
      expect(await surveyNFT.totalSupply()).to.equal(0);
    });

    it("should revert if admin address is zero", async function () {
      const Factory = await ethers.getContractFactory("SurveyNFT");
      await expect(
        Factory.deploy(COLLECTION_NAME, COLLECTION_SYMBOL, ethers.ZeroAddress, minter.address)
      ).to.be.reverted;
    });
  });

  // ─── Minting ────────────────────────────────────────────────

  describe("Minting", function () {
    it("should mint a survey certificate", async function () {
      const tx = await surveyNFT.connect(minter).mintSurvey(
        user.address,
        sampleHash,
        sampleGeoHash,
        sampleScore,
        sampleURI,
        0 // default validity
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      expect(await surveyNFT.totalSupply()).to.equal(1);
      expect(await surveyNFT.ownerOf(0)).to.equal(user.address);
    });

    it("should store correct verification data", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );

      const data = await surveyNFT.getVerificationData(0);
      expect(data.verificationHash).to.equal(sampleHash);
      expect(data.geoHash).to.equal(sampleGeoHash);
      expect(data.verificationScore).to.equal(sampleScore);
      expect(data.verifierWallet).to.equal(minter.address);
      expect(data.isValid).to.be.true;
      expect(data.timestamp).to.be.gt(0);
    });

    it("should set correct metadata URI", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );

      expect(await surveyNFT.tokenURI(0)).to.equal(sampleURI);
    });

    it("should set validUntil correctly", async function () {
      const customExpiry = Math.floor(Date.now() / 1000) + 86400 * 60; // 60 days
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, customExpiry
      );

      const data = await surveyNFT.getVerificationData(0);
      expect(data.validUntil).to.equal(customExpiry);
    });

    it("should use default validity when validUntil is 0", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );

      const data = await surveyNFT.getVerificationData(0);
      expect(data.validUntil).to.be.gt(Math.floor(Date.now() / 1000));
    });

    it("should revert if caller is not minter", async function () {
      await expect(
        surveyNFT.connect(user).mintSurvey(
          user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
        )
      ).to.be.reverted;
    });

    it("should revert if hash is zero", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, ethers.ZeroHash, sampleGeoHash, sampleScore, sampleURI, 0
        )
      ).to.be.reverted;
    });

    it("should revert if score exceeds max", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, sampleGeoHash, MAX_SCORE + 1, sampleURI, 0
        )
      ).to.be.reverted;
    });

    it("should revert if geohash is empty", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, "", sampleScore, sampleURI, 0
        )
      ).to.be.reverted;
    });

    it("should revert if metadata URI is empty", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, sampleGeoHash, sampleScore, "", 0
        )
      ).to.be.reverted;
    });

    it("should emit SurveyMinted event", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
        )
      ).to.emit(surveyNFT, "SurveyMinted");
    });

    it("should increment token IDs sequentially", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );

      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("payload-2"));
      await surveyNFT.connect(minter).mintSurvey(
        user.address, hash2, sampleGeoHash, sampleScore, sampleURI, 0
      );

      expect(await surveyNFT.ownerOf(0)).to.equal(user.address);
      expect(await surveyNFT.ownerOf(1)).to.equal(user.address);
      expect(await surveyNFT.totalSupply()).to.equal(2);
    });

    it("should accept score of exactly MAX_SCORE", async function () {
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, sampleGeoHash, MAX_SCORE, sampleURI, 0
        )
      ).to.not.be.reverted;
    });
  });

  // ─── Batch Minting ──────────────────────────────────────────

  describe("Batch Minting", function () {
    it("should batch mint multiple certificates", async function () {
      const recipients = [user.address, other.address, minter.address];
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("batch-1")),
        ethers.keccak256(ethers.toUtf8Bytes("batch-2")),
        ethers.keccak256(ethers.toUtf8Bytes("batch-3")),
      ];
      const geoHashes = [sampleGeoHash, "dqcjr", "dqcjp"];
      const scores = [7000, 8000, 9000];
      const uris = ["ipfs://1", "ipfs://2", "ipfs://3"];
      const validities = [0, 0, 0];

      const tx = await surveyNFT.connect(minter).batchMintSurvey(
        recipients, hashes, geoHashes, scores, uris, validities
      );
      await tx.wait();

      expect(await surveyNFT.totalSupply()).to.equal(3);
      expect(await surveyNFT.ownerOf(0)).to.equal(user.address);
      expect(await surveyNFT.ownerOf(1)).to.equal(other.address);
      expect(await surveyNFT.ownerOf(2)).to.equal(minter.address);
    });

    it("should emit BatchMinted event", async function () {
      const recipients = [user.address, other.address];
      const hashes = [sampleHash, sampleHash];
      const geoHashes = [sampleGeoHash, sampleGeoHash];
      const scores = [sampleScore, sampleScore];
      const uris = [sampleURI, sampleURI];
      const validities = [0, 0];

      await expect(
        surveyNFT.connect(minter).batchMintSurvey(
          recipients, hashes, geoHashes, scores, uris, validities
        )
      ).to.emit(surveyNFT, "BatchMinted");
    });

    it("should revert if arrays have mismatched lengths", async function () {
      await expect(
        surveyNFT.connect(minter).batchMintSurvey(
          [user.address],
          [sampleHash, sampleHash],
          [sampleGeoHash],
          [sampleScore],
          [sampleURI],
          [0]
        )
      ).to.be.reverted;
    });
  });

  // ─── Burning ────────────────────────────────────────────────

  describe("Burning", function () {
    beforeEach(async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );
    });

    it("should allow owner to burn their token", async function () {
      await surveyNFT.connect(user).burn(0);
      expect(await surveyNFT.totalSupply()).to.equal(0);
    });

    it("should allow admin to burn any token", async function () {
      await surveyNFT.connect(admin).burn(0);
      expect(await surveyNFT.totalSupply()).to.equal(0);
    });

    it("should revert if non-owner/non-admin tries to burn", async function () {
      await expect(surveyNFT.connect(other).burn(0)).to.be.reverted;
    });

    it("should emit SurveyBurned event", async function () {
      await expect(surveyNFT.connect(user).burn(0))
        .to.emit(surveyNFT, "SurveyBurned")
        .withArgs(0, user.address);
    });

    it("should invalidate verification data on burn", async function () {
      await surveyNFT.connect(user).burn(0);
      const data = await surveyNFT.getVerificationData(0);
      expect(data.isValid).to.be.false;
    });
  });

  // ─── Verification Updates ───────────────────────────────────

  describe("Verification Updates", function () {
    beforeEach(async function () {
      // Grant verifier role
      const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
      await surveyNFT.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);

      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );
    });

    it("should update verification hash and score", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("updated-hash"));
      const newScore = 9500;

      await surveyNFT.connect(verifier).updateVerification(0, newHash, newScore);

      const data = await surveyNFT.getVerificationData(0);
      expect(data.verificationHash).to.equal(newHash);
      expect(data.verificationScore).to.equal(newScore);
    });

    it("should emit VerificationUpdated event", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("updated"));
      await expect(
        surveyNFT.connect(verifier).updateVerification(0, newHash, 9000)
      ).to.emit(surveyNFT, "VerificationUpdated");
    });

    it("should revert if caller is not verifier", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("updated"));
      await expect(
        surveyNFT.connect(user).updateVerification(0, newHash, 9000)
      ).to.be.reverted;
    });

    it("should revert if hash is zero", async function () {
      await expect(
        surveyNFT.connect(verifier).updateVerification(0, ethers.ZeroHash, 9000)
      ).to.be.reverted;
    });

    it("should revert if score exceeds max", async function () {
      await expect(
        surveyNFT.connect(verifier).updateVerification(0, sampleHash, MAX_SCORE + 1)
      ).to.be.reverted;
    });
  });

  // ─── Metadata URI ───────────────────────────────────────────

  describe("Metadata URI", function () {
    beforeEach(async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );
    });

    it("should allow admin to update metadata URI", async function () {
      const newURI = "ipfs://QmNewMetadata/updated.json";
      await surveyNFT.connect(admin).setMetadataURI(0, newURI);
      expect(await surveyNFT.tokenURI(0)).to.equal(newURI);
    });

    it("should emit MetadataURIUpdated event", async function () {
      const newURI = "ipfs://QmNewMetadata/updated.json";
      await expect(surveyNFT.connect(admin).setMetadataURI(0, newURI))
        .to.emit(surveyNFT, "MetadataURIUpdated")
        .withArgs(0, newURI);
    });

    it("should revert if non-admin tries to update", async function () {
      await expect(
        surveyNFT.connect(user).setMetadataURI(0, "ipfs://new")
      ).to.be.reverted;
    });
  });

  // ─── Verification Validity ──────────────────────────────────

  describe("Verification Validity", function () {
    it("should return true for valid verification", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );
      expect(await surveyNFT.isVerificationValid(0)).to.be.true;
    });

    it("should return false for non-existent token", async function () {
      expect(await surveyNFT.isVerificationValid(999)).to.be.false;
    });

    it("should return false after burning", async function () {
      await surveyNFT.connect(minter).mintSurvey(
        user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
      );
      await surveyNFT.connect(user).burn(0);
      expect(await surveyNFT.isVerificationValid(0)).to.be.false;
    });
  });

  // ─── Pausable ───────────────────────────────────────────────

  describe("Pausable", function () {
    it("should allow admin to pause", async function () {
      await surveyNFT.connect(admin).pause();
      expect(await surveyNFT.paused()).to.be.true;
    });

    it("should block minting when paused", async function () {
      await surveyNFT.connect(admin).pause();
      await expect(
        surveyNFT.connect(minter).mintSurvey(
          user.address, sampleHash, sampleGeoHash, sampleScore, sampleURI, 0
        )
      ).to.be.reverted;
    });

    it("should allow admin to unpause", async function () {
      await surveyNFT.connect(admin).pause();
      await surveyNFT.connect(admin).unpause();
      expect(await surveyNFT.paused()).to.be.false;
    });

    it("should revert if non-admin pauses", async function () {
      await expect(surveyNFT.connect(user).pause()).to.be.reverted;
    });
  });

  // ─── Role Management ────────────────────────────────────────

  describe("Role Management", function () {
    it("should grant and revoke roles", async function () {
      const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

      await surveyNFT.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);
      expect(await surveyNFT.isVerifier(verifier.address)).to.be.true;

      await surveyNFT.connect(admin).revokeRole(VERIFIER_ROLE, verifier.address);
      expect(await surveyNFT.isVerifier(verifier.address)).to.be.false;
    });

    it("should report minter status", async function () {
      expect(await surveyNFT.isMinter(minter.address)).to.be.true;
      expect(await surveyNFT.isMinter(user.address)).to.be.false;
    });
  });

  // ─── ERC721 Enumerable ──────────────────────────────────────

  describe("ERC721 Enumerable", function () {
    beforeEach(async function () {
      for (let i = 0; i < 5; i++) {
        await surveyNFT.connect(minter).mintSurvey(
          user.address,
          ethers.keccak256(ethers.toUtf8Bytes(`payload-${i}`)),
          sampleGeoHash,
          sampleScore,
          `ipfs://${i}`,
          0
        );
      }
    });

    it("should track total supply", async function () {
      expect(await surveyNFT.totalSupply()).to.equal(5);
    });

    it("should return tokens by owner", async function () {
      const tokens = await surveyNFT.tokensOfOwner(user.address);
      expect(tokens.length).to.equal(5);
    });

    it("should return token by index", async function () {
      expect(await surveyNFT.tokenByIndex(2)).to.equal(2);
    });
  });
});
