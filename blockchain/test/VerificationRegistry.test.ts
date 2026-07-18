import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { VerificationRegistry } from "../typechain-types";

describe("VerificationRegistry", function () {
  let registry: VerificationRegistry;
  let admin: SignerWithAddress;
  let registrar: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  const surveyId = ethers.keccak256(ethers.toUtf8Bytes("survey-unique-001"));
  const verificationHash = ethers.keccak256(ethers.toUtf8Bytes("verification-payload"));
  const geoHash = "dqcjq";
  const trustScore = 7500; // 75%
  const defaultValidity = 90 * 24 * 60 * 60; // 90 days

  beforeEach(async function () {
    [admin, registrar, user, other] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("VerificationRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();

    // Grant registrar role
    const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
    await registry.connect(admin).grantRole(REGISTRAR_ROLE, registrar.address);
  });

  // ─── Deployment ─────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set admin correctly", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should start with zero registrations", async function () {
      expect(await registry.registeredCount()).to.equal(0);
    });

    it("should revert with zero address admin", async function () {
      const Factory = await ethers.getContractFactory("VerificationRegistry");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.reverted;
    });
  });

  // ─── Registration ───────────────────────────────────────────

  describe("Registration", function () {
    it("should register a verification", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );

      expect(await registry.registeredCount()).to.equal(1);
      expect(await registry.isCurrentlyValid(surveyId)).to.be.true;
    });

    it("should store correct verification data", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );

      const record = await registry.getVerification(surveyId);
      expect(record.verificationHash).to.equal(verificationHash);
      expect(record.verifier).to.equal(registrar.address);
      expect(record.geoHash).to.equal(geoHash);
      expect(record.trustScore).to.equal(trustScore);
      expect(record.isActive).to.be.true;
      expect(record.timestamp).to.be.gt(0);
    });

    it("should set correct expiry", async function () {
      const customValidity = 30 * 24 * 60 * 60; // 30 days
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, customValidity
      );

      const record = await registry.getVerification(surveyId);
      expect(record.expiry).to.be.gt(record.timestamp);
    });

    it("should use default validity when duration is 0", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );

      const record = await registry.getVerification(surveyId);
      expect(record.expiry - record.timestamp).to.equal(defaultValidity);
    });

    it("should emit VerificationRegistered event", async function () {
      await expect(
        registry.connect(registrar).registerVerification(
          surveyId, verificationHash, geoHash, trustScore, 0
        )
      ).to.emit(registry, "VerificationRegistered");
    });

    it("should revert if survey ID already registered", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );

      await expect(
        registry.connect(registrar).registerVerification(
          surveyId, verificationHash, geoHash, trustScore, 0
        )
      ).to.be.reverted;
    });

    it("should revert if caller is not registrar", async function () {
      await expect(
        registry.connect(user).registerVerification(
          surveyId, verificationHash, geoHash, trustScore, 0
        )
      ).to.be.reverted;
    });

    it("should revert if hash is zero", async function () {
      await expect(
        registry.connect(registrar).registerVerification(
          surveyId, ethers.ZeroHash, geoHash, trustScore, 0
        )
      ).to.be.reverted;
    });

    it("should revert if survey ID is zero", async function () {
      await expect(
        registry.connect(registrar).registerVerification(
          ethers.ZeroHash, verificationHash, geoHash, trustScore, 0
        )
      ).to.be.reverted;
    });
  });

  // ─── Hash Resolution ────────────────────────────────────────

  describe("Hash Resolution", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );
    });

    it("should resolve hash to survey ID", async function () {
      expect(await registry.resolveHash(verificationHash)).to.equal(surveyId);
    });

    it("should return zero for unknown hash", async function () {
      expect(await registry.resolveHash(ethers.keccak256(ethers.toUtf8Bytes("unknown"))))
        .to.equal(ethers.ZeroHash);
    });

    it("should get verification hash for a survey", async function () {
      expect(await registry.getVerificationHash(surveyId)).to.equal(verificationHash);
    });
  });

  // ─── Update Verification Hash ───────────────────────────────

  describe("Update Verification Hash", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );
    });

    it("should update the verification hash", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("updated-hash"));
      await registry.connect(registrar).updateVerificationHash(surveyId, newHash);

      expect(await registry.getVerificationHash(surveyId)).to.equal(newHash);
      expect(await registry.resolveHash(newHash)).to.equal(surveyId);
    });

    it("should emit VerificationUpdated event", async function () {
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("updated"));
      await expect(
        registry.connect(registrar).updateVerificationHash(surveyId, newHash)
      ).to.emit(registry, "VerificationUpdated");
    });

    it("should revert for non-existent survey", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        registry.connect(registrar).updateVerificationHash(fakeId, verificationHash)
      ).to.be.reverted;
    });

    it("should revert if new hash is zero", async function () {
      await expect(
        registry.connect(registrar).updateVerificationHash(surveyId, ethers.ZeroHash)
      ).to.be.reverted;
    });
  });

  // ─── Revocation ─────────────────────────────────────────────

  describe("Revocation", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );
    });

    it("should revoke a verification", async function () {
      await registry.connect(registrar).revokeVerification(surveyId);
      expect(await registry.isCurrentlyValid(surveyId)).to.be.false;
    });

    it("should emit VerificationRevoked event", async function () {
      await expect(
        registry.connect(registrar).revokeVerification(surveyId)
      ).to.emit(registry, "VerificationRevoked");
    });

    it("should revert if already revoked", async function () {
      await registry.connect(registrar).revokeVerification(surveyId);
      await expect(
        registry.connect(registrar).revokeVerification(surveyId)
      ).to.be.reverted;
    });
  });

  // ─── Extension ──────────────────────────────────────────────

  describe("Extension", function () {
    beforeEach(async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );
    });

    it("should extend verification expiry", async function () {
      const newExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await registry.connect(registrar).extendVerification(surveyId, newExpiry);

      const record = await registry.getVerification(surveyId);
      expect(record.expiry).to.equal(newExpiry);
    });

    it("should emit VerificationExtended event", async function () {
      const newExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await expect(
        registry.connect(registrar).extendVerification(surveyId, newExpiry)
      ).to.emit(registry, "VerificationExtended");
    });

    it("should revert if new expiry is in the past", async function () {
      await expect(
        registry.connect(registrar).extendVerification(surveyId, 1)
      ).to.be.reverted;
    });
  });

  // ─── Status Queries ─────────────────────────────────────────

  describe("Status Queries", function () {
    it("should return correct status for unregistered", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("nope"));
      const status = await registry.getVerificationStatus(fakeId);
      expect(status.exists).to.be.false;
    });

    it("should return correct status for active verification", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );

      const status = await registry.getVerificationStatus(surveyId);
      expect(status.exists).to.be.true;
      expect(status.isActive).to.be.true;
      expect(status.isExpired).to.be.false;
    });

    it("should report expired for revoked verification", async function () {
      await registry.connect(registrar).registerVerification(
        surveyId, verificationHash, geoHash, trustScore, 0
      );
      await registry.connect(registrar).revokeVerification(surveyId);

      const status = await registry.getVerificationStatus(surveyId);
      expect(status.isActive).to.be.false;
    });

    it("should report all registered surveys", async function () {
      const id1 = ethers.keccak256(ethers.toUtf8Bytes("s1"));
      const id2 = ethers.keccak256(ethers.toUtf8Bytes("s2"));

      await registry.connect(registrar).registerVerification(
        id1, verificationHash, geoHash, trustScore, 0
      );
      await registry.connect(registrar).registerVerification(
        id2, ethers.keccak256(ethers.toUtf8Bytes("h2")), geoHash, trustScore, 0
      );

      const all = await registry.getAllRegisteredSurveys();
      expect(all.length).to.equal(2);
    });
  });

  // ─── Pausable ───────────────────────────────────────────────

  describe("Pausable", function () {
    it("should block registration when paused", async function () {
      await registry.connect(admin).pause();
      await expect(
        registry.connect(registrar).registerVerification(
          surveyId, verificationHash, geoHash, trustScore, 0
        )
      ).to.be.reverted;
    });

    it("should resume after unpause", async function () {
      await registry.connect(admin).pause();
      await registry.connect(admin).unpause();
      await expect(
        registry.connect(registrar).registerVerification(
          surveyId, verificationHash, geoHash, trustScore, 0
        )
      ).to.not.be.reverted;
    });
  });

  // ─── Role Management ────────────────────────────────────────

  describe("Role Management", function () {
    it("should allow admin to grant registrar role", async function () {
      const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
      await registry.connect(admin).grantRole(REGISTRAR_ROLE, user.address);
      expect(await registry.hasRole(REGISTRAR_ROLE, user.address)).to.be.true;
    });

    it("should revert if non-admin grants role", async function () {
      const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
      await expect(
        registry.connect(user).grantRole(REGISTRAR_ROLE, user.address)
      ).to.be.reverted;
    });
  });
});
