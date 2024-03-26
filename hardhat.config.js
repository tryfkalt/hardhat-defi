require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
// require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("solidity-coverage");
require("hardhat-gas-reporter");
// require("hardhat-contract-sizer");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://eth-rpc.sepolia/example";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY || "0x11ee3108a03081fe260ecdc106554d09d9d1209bcafd46942b10e02943effc4a";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINNET_RPC_URL,
      },
      blockConfirmations: 1,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.7.0",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.8.0",
      },
      {
        version: "0.4.19",
      },
      {
        version: "0.6.12",
      },
    ],
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 30000,
  },
};
