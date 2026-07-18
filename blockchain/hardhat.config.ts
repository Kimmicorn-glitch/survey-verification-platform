import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const ETHEREUM_MAINNET_RPC = process.env.ETHEREUM_MAINNET_RPC_URL || "";
const ETHEREUM_SEPOLIA_RPC = process.env.ETHEREUM_SEPOLIA_RPC_URL || "";
const POLYGON_MAINNET_RPC = process.env.POLYGON_MAINNET_RPC_URL || "";
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "ipfs",
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
      gas: 30_000_000,
      gasPrice: "auto",
      forking: process.env.ETHEREUM_SEPOLIA_RPC_URL
        ? { url: ETHEREUM_SEPOLIA_RPC }
        : undefined,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: ETHEREUM_SEPOLIA_RPC,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: "auto",
    },
    mainnet: {
      url: ETHEREUM_MAINNET_RPC,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 1,
      gasPrice: "auto",
    },
    polygon: {
      url: POLYGON_MAINNET_RPC,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 137,
      gasPrice: "auto",
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 80002,
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
