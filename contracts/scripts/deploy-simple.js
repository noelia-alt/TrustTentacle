// Simple deployment script for TrustTentacle - Octopus Hackathon 2025
const hre = require("hardhat");

async function main() {
  console.log("🐙 TrustTentacle Deployment - Octopus Hackathon 2025");
  console.log("=====================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy EntityRegistry
  console.log("📋 Deploying EntityRegistry...");
  const EntityRegistry = await hre.ethers.getContractFactory("EntityRegistry");
  const entityRegistry = await EntityRegistry.deploy();
  await entityRegistry.waitForDeployment();
  const entityAddress = await entityRegistry.getAddress();
  console.log("✅ EntityRegistry:", entityAddress);

  // Deploy DomainRegistry
  console.log("\n🌐 Deploying DomainRegistry...");
  const DomainRegistry = await hre.ethers.getContractFactory("DomainRegistry");
  const domainRegistry = await DomainRegistry.deploy(entityAddress);
  await domainRegistry.waitForDeployment();
  const domainAddress = await domainRegistry.getAddress();
  console.log("✅ DomainRegistry:", domainAddress);

  // Deploy PhishingReports
  console.log("\n🎣 Deploying PhishingReports...");
  const PhishingReports = await hre.ethers.getContractFactory("PhishingReports");
  const phishingReports = await PhishingReports.deploy();
  await phishingReports.waitForDeployment();
  const reportsAddress = await phishingReports.getAddress();
  console.log("✅ PhishingReports:", reportsAddress);

  // Summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=========================");
  console.log(`Network: ${hre.network.name}`);
  console.log(`EntityRegistry: ${entityAddress}`);
  console.log(`DomainRegistry: ${domainAddress}`);
  console.log(`PhishingReports: ${reportsAddress}`);
  
  console.log("\n📝 Add to backend .env:");
  console.log(`ENTITY_REGISTRY_ADDRESS=${entityAddress}`);
  console.log(`DOMAIN_REGISTRY_ADDRESS=${domainAddress}`);
  console.log(`PHISHING_REPORTS_ADDRESS=${reportsAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
