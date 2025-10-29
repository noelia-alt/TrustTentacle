require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology/",
      accounts: process.env.PRIVATE_KEY !== undefined && process.env.PRIVATE_KEY !== 'your_private_key_here' && process.env.PRIVATE_KEY !== '' 
        ? [process.env.PRIVATE_KEY] 
        : [],
      chainId: 80002,
    },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com/",
      accounts: process.env.PRIVATE_KEY !== undefined && process.env.PRIVATE_KEY !== 'your_private_key_here' && process.env.PRIVATE_KEY !== ''
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
