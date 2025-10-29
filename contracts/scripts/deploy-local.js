// Deploy script for local Hardhat network (for testing)
const hre = require("hardhat");

async function main() {
  console.log("🐙 TrustTentacle - Local Deployment");
  console.log("====================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy EntityRegistry
  console.log("📝 Deploying EntityRegistry...");
  const EntityRegistry = await hre.ethers.getContractFactory("EntityRegistry");
  const entityRegistry = await EntityRegistry.deploy();
  await entityRegistry.waitForDeployment();
  const entityAddress = await entityRegistry.getAddress();
  console.log("✅ EntityRegistry deployed to:", entityAddress);

  // Deploy DomainRegistry
  console.log("\n📝 Deploying DomainRegistry...");
  const DomainRegistry = await hre.ethers.getContractFactory("DomainRegistry");
  const domainRegistry = await DomainRegistry.deploy(entityAddress);
  await domainRegistry.waitForDeployment();
  const domainAddress = await domainRegistry.getAddress();
  console.log("✅ DomainRegistry deployed to:", domainAddress);

  // Deploy PhishingReports
  console.log("\n📝 Deploying PhishingReports...");
  const PhishingReports = await hre.ethers.getContractFactory("PhishingReports");
  const phishingReports = await PhishingReports.deploy(domainAddress);
  await phishingReports.waitForDeployment();
  const reportsAddress = await phishingReports.getAddress();
  console.log("✅ PhishingReports deployed to:", reportsAddress);

  // Summary
  console.log("\n🎉 Deployment Complete!");
  console.log("====================================");
  console.log("EntityRegistry:", entityAddress);
  console.log("DomainRegistry:", domainAddress);
  console.log("PhishingReports:", reportsAddress);
  console.log("\n📝 Add these addresses to your backend .env file:");
  console.log(`ENTITY_REGISTRY_ADDRESS=${entityAddress}`);
  console.log(`DOMAIN_REGISTRY_ADDRESS=${domainAddress}`);
  console.log(`PHISHING_REPORTS_ADDRESS=${reportsAddress}`);

  // Register some demo data
  console.log("\n🔧 Registering demo data...");
  
  // Register demo entities
  await entityRegistry.registerEntity(
    "Banco Example",
    "banco.com",
    "0x1234567890123456789012345678901234567890123456789012345678901234",
    true
  );
  console.log("✅ Registered: Banco Example");

  await entityRegistry.registerEntity(
    "PayPal Official",
    "paypal.com",
    "0x2234567890123456789012345678901234567890123456789012345678901234",
    true
  );
  console.log("✅ Registered: PayPal Official");

  // Register demo domains
  await domainRegistry.registerDomain("banco.com", 1);
  console.log("✅ Registered domain: banco.com");

  await domainRegistry.registerDomain("paypal.com", 2);
  console.log("✅ Registered domain: paypal.com");

  console.log("\n🐙 Local deployment ready for testing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
