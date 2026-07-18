import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { TrustScoreOracle } from "../typechain-types";

describe("TrustScoreOracle", function () {
  let oracle: TrustScoreOracle;
  let admin: SignerWithAddress;
  let oracleAddr1: SignerWithAddress;
  let oracleAddr2: SignerWithAddress;
  let oracleAddr3: SignerWithAddress;
  let user: SignerWithAddress;

  const subjectId = ethers.keccak256(ethers.toUtf8Bytes("survey-subject-1"));
  const MIN_SOURCES = 3;
  const DECAY_RATE = 50; // 50 basis points per day
  const FRESHNESS_WINDOW = 7 * 24 * 60 * 60; // 7 days
  const APPEAL_WINDOW = 7 * 24 * 60 * 60;

  beforeEach(async function () {
    [admin, oracleAddr1, oracleAddr2, oracleAddr3, user] = await ethers.getSigners();

    const OracleFactory = await ethers.getContractFactory("TrustScoreOracle");
    oracle = await OracleFactory.deploy(
      admin.address,
      MIN_SOURCES,
      DECAY_RATE,
      FRESHNESS_WINDOW,
      APPEAL_WINDOW
    );
    await oracle.waitForDeployment();

    // Register oracles
    await oracle.connect(admin).setOracle(oracleAddr1.address, 3000); // 30%
    await oracle.connect(admin).setOracle(oracleAddr2.address, 3000); // 30%
    await oracle.connect(admin).setOracle(oracleAddr3.address, 4000); // 40%
  });

  // ─── Deployment ─────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set parameters correctly", async function () {
      expect(await oracle.minSourcesRequired()).to.equal(MIN_SOURCES);
      expect(await oracle.decayRatePerDay()).to.equal(DECAY_RATE);
      expect(await oracle.freshnessWindow()).to.equal(FRESHNESS_WINDOW);
      expect(await oracle.appealWindow()).to.equal(APPEAL_WINDOW);
    });

    it("should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await oracle.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  // ─── Oracle Management ──────────────────────────────────────

  describe("Oracle Management", function () {
    it("should add an oracle", async function () {
      const config = await oracle.getOracleConfig(oracleAddr1.address);
      expect(config.weight).to.equal(3000);
      expect(config.isActive).to.be.true;
    });

    it("should remove an oracle", async function () {
      await oracle.connect(admin).removeOracle(oracleAddr1.address);
      const config = await oracle.getOracleConfig(oracleAddr1.address);
      expect(config.isActive).to.be.false;
    });

    it("should emit OracleAdded event", async function () {
      await expect(
        oracle.connect(admin).setOracle(user.address, 1000)
      ).to.emit(oracle, "OracleAdded");
    });

    it("should revert if non-admin adds oracle", async function () {
      await expect(
        oracle.connect(user).setOracle(user.address, 1000)
      ).to.be.reverted;
    });

    it("should revert if weight exceeds max", async function () {
      await expect(
        oracle.connect(admin).setOracle(user.address, 6000)
      ).to.be.reverted;
    });
  });

  // ─── Score Submission ───────────────────────────────────────

  describe("Score Submission", function () {
    it("should accept a score submission", async function () {
      await oracle.connect(oracleAddr1).submitScore(subjectId, 8000);
      const subs = await oracle.getSubmissions(subjectId);
      expect(subs.length).to.equal(1);
      expect(subs[0].score).to.equal(8000);
    });

    it("should emit ScoreSubmitted event", async function () {
      await expect(
        oracle.connect(oracleAddr1).submitScore(subjectId, 7500)
      ).to.emit(oracle, "ScoreSubmitted");
    });

    it("should auto-aggregate when quorum is met", async function () {
      await oracle.connect(oracleAddr1).submitScore(subjectId, 8000);
      await oracle.connect(oracleAddr2).submitScore(subjectId, 7000);
      await oracle.connect(oracleAddr3).submitScore(subjectId, 9000);

      const agg = await oracle.getAggregatedScore(subjectId);
      expect(agg.submissionCount).to.equal(3);
      expect(agg.hasMinimumSources).to.be.true;
      expect(agg.weightedScore).to.be.gt(0);
    });

    it("should reject duplicate submissions from same oracle", async function () {
      await oracle.connect(oracleAddr1).submitScore(subjectId, 8000);
      await expect(
        oracle.connect(oracleAddr1).submitScore(subjectId, 9000)
      ).to.be.reverted;
    });

    it("should reject score above 10000", async function () {
      await expect(
        oracle.connect(oracleAddr1).submitScore(subjectId, 10001)
      ).to.be.reverted;
    });

    it("should reject non-oracle submissions", async function () {
      await expect(
        oracle.connect(user).submitScore(subjectId, 8000)
      ).to.be.reverted;
    });

    it("should allow score of exactly 10000", async function () {
      await expect(
        oracle.connect(oracleAddr1).submitScore(subjectId, 10000)
      ).to.not.be.reverted;
    });
  });

  // ─── Batch Submission ───────────────────────────────────────

  describe("Batch Submission", function () {
    it("should submit batch scores", async function () {
      const subject2 = ethers.keccak256(ethers.toUtf8Bytes("subject-2"));
      const subjects = [subjectId, subject2];
      const scores = [8000, 6000];

      await oracle.connect(oracleAddr1).submitBatchScores(subjects, scores);

      const subs1 = await oracle.getSubmissions(subjectId);
      const subs2 = await oracle.getSubmissions(subject2);
      expect(subs1.length).to.equal(1);
      expect(subs2.length).to.equal(1);
    });

    it("should revert if arrays mismatched", async function () {
      await expect(
        oracle.connect(oracleAddr1).submitBatchScores([subjectId], [8000, 6000])
      ).to.be.reverted;
    });
  });

  // ─── Aggregation ────────────────────────────────────────────

  describe("Aggregation", function () {
    it("should calculate weighted average correctly", async function () {
      // Oracle1: weight=3000, score=8000
      // Oracle2: weight=3000, score=7000
      // Oracle3: weight=4000, score=9000
      // Weighted = (8000*3000 + 7000*3000 + 9000*4000) / (3000+3000+4000)
      //          = (24000000 + 21000000 + 36000000) / 10000
      //          = 81000000 / 10000 = 8100

      await oracle.connect(oracleAddr1).submitScore(subjectId, 8000);
      await oracle.connect(oracleAddr2).submitScore(subjectId, 7000);
      await oracle.connect(oracleAddr3).submitScore(subjectId, 9000);

      const agg = await oracle.getAggregatedScore(subjectId);
      expect(agg.weightedScore).to.equal(8100);
    });

    it("should manually trigger aggregation", async function () {
      await oracle.connect(oracleAddr1).submitScore(subjectId, 5000);
      await oracle.connect(oracleAddr2).submitScore(subjectId, 5000);
      await oracle.connect(oracleAddr3).submitScore(subjectId, 5000);

      await oracle.connect(user).aggregateScore(subjectId);

      const agg = await oracle.getAggregatedScore(subjectId);
      expect(agg.weightedScore).to.equal(5000);
    });
  });

  // ─── Appeals ────────────────────────────────────────────────

  describe("Appeals", function () {
    it("should file an appeal", async function () {
      await oracle.connect(user).fileAppeal(subjectId, "Score is inaccurate");
      const appeals = await oracle.getAppeals(subjectId);
      expect(appeals.length).to.equal(1);
      expect(appeals[0].appellant).to.equal(user.address);
    });

    it("should emit AppealFiled event", async function () {
      await expect(
        oracle.connect(user).fileAppeal(subjectId, "Wrong score")
      ).to.emit(oracle, "AppealFiled");
    });

    it("should resolve an appeal", async function () {
      await oracle.connect(user).fileAppeal(subjectId, "Wrong score");
      await oracle.connect(admin).resolveAppeal(subjectId, 0, true);

      const appeals = await oracle.getAppeals(subjectId);
      expect(appeals[0].resolved).to.be.true;
      expect(appeals[0].upheld).to.be.true;
    });

    it("should emit AppealResolved event", async function () {
      await oracle.connect(user).fileAppeal(subjectId, "Wrong");
      await expect(
        oracle.connect(admin).resolveAppeal(subjectId, 0, false)
      ).to.emit(oracle, "AppealResolved");
    });

    it("should revert if non-admin resolves appeal", async function () {
      await oracle.connect(user).fileAppeal(subjectId, "Wrong");
      await expect(
        oracle.connect(user).resolveAppeal(subjectId, 0, true)
      ).to.be.reverted;
    });
  });

  // ─── Parameter Updates ──────────────────────────────────────

  describe("Parameter Updates", function () {
    it("should update parameters", async function () {
      await oracle.connect(admin).setParameters(5, 100, 14 * 86400, 14 * 86400);
      expect(await oracle.minSourcesRequired()).to.equal(5);
      expect(await oracle.decayRatePerDay()).to.equal(100);
    });

    it("should revert if non-admin updates parameters", async function () {
      await expect(
        oracle.connect(user).setParameters(5, 100, 14 * 86400, 14 * 86400)
      ).to.be.reverted;
    });
  });
});
