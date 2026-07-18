import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { GeoValidation } from "../typechain-types";

describe("GeoValidation", function () {
  let geo: GeoValidation;
  let admin: SignerWithAddress;
  let validator: SignerWithAddress;
  let user: SignerWithAddress;

  const surveyId = ethers.keccak256(ethers.toUtf8Bytes("survey-geo-001"));
  const sampleGeoHash = "dqcjq";
  const sampleLat = -26204100; // ~26.2°S (Johannesburg) * 1e6
  const sampleLon = 28047200;  // ~28.0°E * 1e6

  beforeEach(async function () {
    [admin, validator, user] = await ethers.getSigners();

    const GeoFactory = await ethers.getContractFactory("GeoValidation");
    geo = await GeoFactory.deploy(
      admin.address,
      10,    // maxSubmissionsPerWindow
      3600,  // rateLimitWindow: 1 hour
      100,   // minDistanceBetweenSubmissions: 100m
      5      // flagThreshold
    );
    await geo.waitForDeployment();

    // Grant validator role
    const VALIDATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE"));
    await geo.connect(admin).grantRole(VALIDATOR_ROLE, validator.address);
  });

  // ─── Deployment ─────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set parameters correctly", async function () {
      expect(await geo.maxSubmissionsPerWindow()).to.equal(10);
      expect(await geo.rateLimitWindow()).to.equal(3600);
      expect(await geo.flagThreshold()).to.equal(5);
    });

    it("should grant admin role", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await geo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  // ─── Zone Management ────────────────────────────────────────

  describe("Zone Management", function () {
    const zoneId = ethers.keccak256(ethers.toUtf8Bytes("zone-joburg"));

    it("should create a zone", async function () {
      await geo.connect(admin).createZone(
        zoneId, "Johannesburg", "dqcjq", 50000, 5
      );

      const zone = await geo.getZone(zoneId);
      expect(zone.zoneName).to.equal("Johannesburg");
      expect(zone.centerGeohash).to.equal("dqcjq");
      expect(zone.radiusMeters).to.equal(50000);
      expect(zone.isActive).to.be.true;
    });

    it("should emit ZoneCreated event", async function () {
      await expect(
        geo.connect(admin).createZone(zoneId, "JHB", "dqcjq", 50000, 5)
      ).to.emit(geo, "ZoneCreated");
    });

    it("should deactivate a zone", async function () {
      await geo.connect(admin).createZone(zoneId, "JHB", "dqcjq", 50000, 5);
      await geo.connect(admin).deactivateZone(zoneId);

      const zone = await geo.getZone(zoneId);
      expect(zone.isActive).to.be.false;
    });

    it("should reactivate a zone", async function () {
      await geo.connect(admin).createZone(zoneId, "JHB", "dqcjq", 50000, 5);
      await geo.connect(admin).deactivateZone(zoneId);
      await geo.connect(admin).activateZone(zoneId);

      const zone = await geo.getZone(zoneId);
      expect(zone.isActive).to.be.true;
    });

    it("should revert if non-admin creates zone", async function () {
      await expect(
        geo.connect(user).createZone(zoneId, "JHB", "dqcjq", 50000, 5)
      ).to.be.reverted;
    });

    it("should revert if radius is zero", async function () {
      await expect(
        geo.connect(admin).createZone(zoneId, "JHB", "dqcjq", 0, 5)
      ).to.be.reverted;
    });

    it("should return all zone IDs", async function () {
      const zone2 = ethers.keccak256(ethers.toUtf8Bytes("zone-cape"));
      await geo.connect(admin).createZone(zoneId, "JHB", "dqcjq", 50000, 5);
      await geo.connect(admin).createZone(zone2, "CPT", "gcmzn", 30000, 5);

      const ids = await geo.getAllZoneIds();
      expect(ids.length).to.equal(2);
    });
  });

  // ─── Location Validation ────────────────────────────────────

  describe("Location Validation", function () {
    const zoneId = ethers.keccak256(ethers.toUtf8Bytes("zone-1"));

    beforeEach(async function () {
      await geo.connect(admin).createZone(zoneId, "Test Zone", "dqcjq", 50000, 4);
    });

    it("should validate a location inside a zone", async function () {
      const [isInside, matchedZone] = await geo.connect(validator).validateLocation(
        surveyId, sampleGeoHash, Math.abs(sampleLat), sampleLon
      );
      expect(isInside).to.be.true;
      expect(matchedZone).to.equal(zoneId);
    });

    it("should store location data", async function () {
      await geo.connect(validator).validateLocation(
        surveyId, sampleGeoHash, Math.abs(sampleLat), sampleLon
      );

      const loc = await geo.getSurveyLocation(surveyId);
      expect(loc.geohash).to.equal(sampleGeoHash);
      expect(loc.isInsideZone).to.be.true;
      expect(loc.validatedBy).to.equal(validator.address);
    });

    it("should emit LocationValidated event", async function () {
      await expect(
        geo.connect(validator).validateLocation(
          surveyId, sampleGeoHash, Math.abs(sampleLat), sampleLon
        )
      ).to.emit(geo, "LocationValidated");
    });

    it("should revert if geohash is too short", async function () {
      await expect(
        geo.connect(validator).validateLocation(
          surveyId, "dqc", Math.abs(sampleLat), sampleLon
        )
      ).to.be.reverted;
    });

    it("should revert if geohash is too long", async function () {
      await expect(
        geo.connect(validator).validateLocation(
          surveyId, "dqcjqwertyuiop", Math.abs(sampleLat), sampleLon
        )
      ).to.be.reverted;
    });

    it("should revert if caller is not validator", async function () {
      await expect(
        geo.connect(user).validateLocation(
          surveyId, sampleGeoHash, Math.abs(sampleLat), sampleLon
        )
      ).to.be.reverted;
    });
  });

  // ─── Distance Calculation ───────────────────────────────────

  describe("Distance Calculation", function () {
    it("should calculate zero distance for same geohash", async function () {
      const dist = await geo.calculateDistance("dqcjq", "dqcjq");
      expect(dist).to.equal(0);
    });

    it("should calculate non-zero distance for different geohashes", async function () {
      const dist = await geo.calculateDistance("dqcjq", "gcmzn");
      expect(dist).to.be.gt(0);
    });

    it("should calculate distance for nearby geohashes", async function () {
      const dist = await geo.calculateDistance("dqcjq", "dqcjr");
      expect(dist).to.be.lt(10000); // Should be within 10km
    });
  });

  // ─── Geohash Utilities ──────────────────────────────────────

  describe("Geohash Utilities", function () {
    it("should calculate prefix length for matching geohashes", async function () {
      const matchLen = await geo.geohashPrefixLength("dqcjq", "dqcjr");
      expect(matchLen).to.equal(4); // "dqcj" matches
    });

    it("should return full length for identical geohashes", async function () {
      const matchLen = await geo.geohashPrefixLength("dqcjq", "dqcjq");
      expect(matchLen).to.equal(5);
    });

    it("should return 0 for no match", async function () {
      const matchLen = await geo.geohashPrefixLength("dqcjq", "gcmzn");
      expect(matchLen).to.equal(0);
    });

    it("should handle different length geohashes", async function () {
      const matchLen = await geo.geohashPrefixLength("dqcjq", "dqcjqwerty");
      expect(matchLen).to.equal(5);
    });
  });

  // ─── Anti-Spoofing ──────────────────────────────────────────

  describe("Anti-Spoofing", function () {
    it("should track submissions per address", async function () {
      const [subs, flagged, isFlagged] = await geo.getAntiSpoofRecord(validator.address);
      expect(subs).to.equal(0);
      expect(flagged).to.equal(0);
      expect(isFlagged).to.be.false;
    });

    it("should flag an address", async function () {
      await geo.connect(admin).flagAddress(user.address);
      const [, , isFlagged] = await geo.getAntiSpoofRecord(user.address);
      expect(isFlagged).to.be.true;
    });

    it("should unflag an address", async function () {
      await geo.connect(admin).flagAddress(user.address);
      await geo.connect(admin).unflagAddress(user.address);
      const [, , isFlagged] = await geo.getAntiSpoofRecord(user.address);
      expect(isFlagged).to.be.false;
    });

    it("should emit AddressFlagged event", async function () {
      await expect(
        geo.connect(admin).flagAddress(user.address)
      ).to.emit(geo, "AddressFlagged");
    });
  });

  // ─── Zone Inside Circle ─────────────────────────────────────

  describe("isInsideCircle", function () {
    it("should return true for same geohash", async function () {
      expect(await geo.isInsideCircle("dqcjq", "dqcjq", 1000)).to.be.true;
    });

    it("should return false for distant geohash with small radius", async function () {
      expect(await geo.isInsideCircle("dqcjq", "gcmzn", 100)).to.be.false;
    });
  });
});
