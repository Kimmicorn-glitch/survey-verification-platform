import { ethers, run, network } from "hardhat";

interface DeployedContracts {
  surveyNFT: string;
  verificationRegistry: string;
  trustScoreOracle: string;
  geoValidation: string;
  drrtGovernance: string;
}

async function main(): Promise<DeployedContracts> {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log("=".repeat(60));
  console.log(`Deploying Survey Verification Platform`);
  console.log(`Network:  ${networkName}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("=".repeat(60));

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} ETH\n`);

  const deployed: DeployedContracts = {
    surveyNFT: "",
    verificationRegistry: "",
    trustScoreOracle: "",
    geoValidation: "",
    drrtGovernance: "",
  };

  // ─── 1. SurveyNFT ──────────────────────────────────────────
  console.log("1/5 Deploying SurveyNFT...");
  const SurveyNFT = await ethers.getContractFactory("SurveyNFT");
  const surveyNFT = await SurveyNFT.deploy(
    "Survey Verification Certificate",
    "SVCERT",
    deployer.address, // admin
    deployer.address  // minter
  );
  await surveyNFT.waitForDeployment();
  const surveyNFTAddr = await surveyNFT.getAddress();
  deployed.surveyNFT = surveyNFTAddr;
  console.log(`   SurveyNFT deployed at: ${surveyNFTAddr}`);

  // ─── 2. VerificationRegistry ────────────────────────────────
  console.log("2/5 Deploying VerificationRegistry...");
  const VerificationRegistry = await ethers.getContractFactory("VerificationRegistry");
  const registry = await VerificationRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  deployed.verificationRegistry = registryAddr;
  console.log(`   VerificationRegistry deployed at: ${registryAddr}`);

  // ─── 3. TrustScoreOracle ────────────────────────────────────
  console.log("3/5 Deploying TrustScoreOracle...");
  const TrustScoreOracle = await ethers.getContractFactory("TrustScoreOracle");
  const oracle = await TrustScoreOracle.deploy(
    deployer.address, // admin
    3,                // min sources for quorum
    50,               // decay rate: 50 basis points per day
    7 days,           // freshness window
    7 days            // appeal window
  );
  await oracle.waitForDeployment();
  const oracleAddr = await oracle.getAddress();
  deployed.trustScoreOracle = oracleAddr;
  console.log(`   TrustScoreOracle deployed at: ${oracleAddr}`);

  // ─── 4. GeoValidation ──────────────────────────────────────
  console.log("4/5 Deploying GeoValidation...");
  const GeoValidation = await ethers.getContractFactory("GeoValidation");
  const geo = await GeoValidation.deploy(
    deployer.address, // admin
    10,               // max submissions per window
    3600,             // rate limit window: 1 hour
    100,              // min distance between submissions: 100m
    5                 // flag threshold
  );
  await geo.waitForDeployment();
  const geoAddr = await geo.getAddress();
  deployed.geoValidation = geoAddr;
  console.log(`   GeoValidation deployed at: ${geoAddr}`);

  // ─── 5. DRRTGovernance ──────────────────────────────────────
  console.log("5/5 Deploying DRRTGovernance...");
  const DRRTGovernance = await ethers.getContractFactory("DRRTGovernance");
  const governance = await DRRTGovernance.deploy(
    deployer.address,   // admin
    ethers.ZeroAddress, // voting token (set later for mainnet)
    1,                  // voting delay: 1 block
    45818,              // voting period: ~1 week at ~13s/block
    2 days,             // timelock delay
    ethers.parseEther("100000"), // quorum: 100k tokens
    ethers.parseEther("10000")   // proposal threshold: 10k tokens
  );
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  deployed.drrtGovernance = governanceAddr;
  console.log(`   DRRTGovernance deployed at: ${governanceAddr}`);

  // ─── Summary ────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deployed, null, 2));

  // ─── Verify on Etherscan (skip for local) ──────────────────
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30_000));

    const contracts: [string, string, any[]][] = [
      ["SurveyNFT", surveyNFTAddr, ["Survey Verification Certificate", "SVCERT", deployer.address, deployer.address]],
      ["VerificationRegistry", registryAddr, [deployer.address]],
      ["TrustScoreOracle", oracleAddr, [deployer.address, 3, 50, 7 * 86400, 7 * 86400]],
      ["GeoValidation", geoAddr, [deployer.address, 10, 3600, 100, 5]],
      ["DRRTGovernance", governanceAddr, [deployer.address, ethers.ZeroAddress, 1, 45818, 2 * 86400, ethers.parseEther("100000"), ethers.parseEther("10000")]],
    ];

    for (const [name, address, constructorArgs] of contracts) {
      try {
        console.log(`Verifying ${name} at ${address}...`);
        await run("verify:verify", {
          address,
          constructorArguments: constructorArgs,
        });
        console.log(`   ${name} verified!`);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log(`   ${name} already verified.`);
        } else {
          console.error(`   ${name} verification failed: ${error.message}`);
        }
      }
    }
  }

  return deployed;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
