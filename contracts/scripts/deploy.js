const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🐙 Deploying TrustTentacle contracts...");
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy EntityRegistry
  console.log("\n📋 Deploying EntityRegistry...");
  const EntityRegistry = await ethers.getContractFactory("EntityRegistry");
  const entityRegistry = await EntityRegistry.deploy();
  await entityRegistry.waitForDeployment();
  const entityAddress = await entityRegistry.getAddress();
  
  console.log("✅ EntityRegistry deployed to:", entityAddress);
  
  // Deploy DomainRegistry
  console.log("\n🌐 Deploying DomainRegistry...");
  const DomainRegistry = await ethers.getContractFactory("DomainRegistry");
  const domainRegistry = await DomainRegistry.deploy(entityAddress);
  await domainRegistry.waitForDeployment();
  const domainAddress = await domainRegistry.getAddress();
  
  console.log("✅ DomainRegistry deployed to:", domainAddress);
  
  // Deploy PhishingReports
  console.log("\n🎣 Deploying PhishingReports...");
  const PhishingReports = await ethers.getContractFactory("PhishingReports");
  const phishingReports = await PhishingReports.deploy(domainAddress);
  await phishingReports.waitForDeployment();
  const reportsAddress = await phishingReports.getAddress();
  
  console.log("✅ PhishingReports deployed to:", reportsAddress);
  
  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      EntityRegistry: entityAddress,
      DomainRegistry: domainAddress,
      PhishingReports: reportsAddress
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  
  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  
  // Seed some initial data if on testnet
  if (hre.network.name === "amoy" || hre.network.name === "localhost") {
    console.log("\n🌱 Seeding initial data...");
    await seedInitialData(entityRegistry, domainRegistry, deployer);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
}

async function seedInitialData(entityRegistry, domainRegistry, deployer) {
  try {
    // Register some Argentine banks
    console.log("Adding Argentine financial institutions...");
    
    const entities = [
      {
        name: "Banco Galicia",
        website: "https://bancogalicia.com.ar",
        country: "AR",
        domains: ["bancogalicia.com.ar", "onlinebanking.bancogalicia.com.ar"]
      },
      {
        name: "BBVA Argentina",
        website: "https://bbva.com.ar", 
        country: "AR",
        domains: ["bbva.com.ar", "net.bbva.com.ar"]
      },
      {
        name: "Mercado Pago",
        website: "https://mercadopago.com.ar",
        country: "AR", 
        domains: ["mercadopago.com.ar", "mercadopago.com"]
      },
      {
        name: "Ualá",
        website: "https://uala.com.ar",
        country: "AR",
        domains: ["uala.com.ar"]
      }
    ];
    
    for (const entity of entities) {
      console.log(`Registering ${entity.name}...`);
      
      const tx = await entityRegistry.registerEntity(
        entity.name,
        deployer.address, // Owner will be deployer for demo
        entity.website,
        entity.country
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "EntityRegistered");
      const entityId = event.args.entityId;
      
      console.log(`✅ ${entity.name} registered with ID: ${entityId}`);
      
      // Add domains for this entity
      for (const domain of entity.domains) {
        console.log(`  Adding domain: ${domain}`);
        const domainTx = await domainRegistry.addDomain(entityId, domain);
        await domainTx.wait();
        console.log(`  ✅ Domain ${domain} added`);
      }
    }
    
    console.log("🌱 Initial data seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
