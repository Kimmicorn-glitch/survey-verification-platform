import { run, network } from "hardhat";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Etherscan verification script.
 * Reads deployed addresses from deployment output or accepts manual overrides.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network sepolia
 *   npx hardhat run scripts/verify.ts --network polygon
 *   npx hardhat run scripts/verify.ts --network mainnet
 */

// ─── Manual overrides (fill in after deployment) ─────────────
const DEPLOYED_ADDRESSES: Record<string, Record<string, string>> = {
  sepolia: {
    SurveyNFT: "",
    VerificationRegistry: "",
    TrustScoreOracle: "",
    GeoValidation: "",
    DRRTGovernance: "",
  },
  mainnet: {
    SurveyNFT: "",
    VerificationRegistry: "",
    TrustScoreOracle: "",
    GeoValidation: "",
    DRRTGovernance: "",
  },
  polygon: {
    SurveyNFT: "",
    VerificationRegistry: "",
    TrustScoreOracle: "",
    GeoValidation: "",
    DRRTGovernance: "",
  },
  polygonAmoy: {
    SurveyNFT: "",
    VerificationRegistry: "",
    TrustScoreOracle: "",
    GeoValidation: "",
    DRRTGovernance: "",
  },
};

// ─── Constructor arguments (must match deployment) ───────────
const CONSTRUCTOR_ARGS: Record<string, any[]> = {
  SurveyNFT: [
    "Survey Verification Certificate",
    "SVCERT",
    process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000001",
    process.env.MINTER_ADDRESS || "0x0000000000000000000000000000000000000001",
  ],
  VerificationRegistry: [
    process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000001",
  ],
  TrustScoreOracle: [
    process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000001",
    3,       // minSources
    50,      // decayRatePerDay
    604800,  // freshnessWindow (7 days)
    604800,  // appealWindow (7 days)
  ],
  GeoValidation: [
    process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000001",
    10,      // maxSubmissionsPerWindow
    3600,    // rateLimitWindow
    100,     // minDistanceBetweenSubmissions
    5,       // flagThreshold
  ],
  DRRTGovernance: [
    process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000000", // votingToken
    1,                                           // votingDelay
    45818,                                       // votingPeriod
    172800,                                      // timelockDelay (2 days)
    "100000000000000000000000",                  // quorumVotes
    "10000000000000000000000",                   // proposalThreshold
  ],
};

async function main() {
  const networkName = network.name;
  console.log(`Verifying contracts on: ${networkName}`);

  const addresses = DEPLOYED_ADDRESSES[networkName];
  if (!addresses) {
    console.error(`No deployed addresses found for network: ${networkName}`);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const [contractName, address] of Object.entries(addresses)) {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      console.log(`\nSkipping ${contractName}: no address configured`);
      continue;
    }

    console.log(`\n--- Verifying ${contractName} at ${address} ---`);

    try {
      await run("verify:verify", {
        address,
        constructorArguments: CONSTRUCTOR_ARGS[contractName] || [],
      });
      console.log(`[OK] ${contractName} verified successfully`);
      successCount++;
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`[OK] ${contractName} already verified`);
        successCount++;
      } else {
        console.error(`[FAIL] ${contractName}: ${error.message}`);
        failCount++;
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Verification complete: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
