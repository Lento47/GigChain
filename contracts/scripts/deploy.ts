import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting GigChain Escrow deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Deploy GigChainEscrow
  console.log("📦 Deploying GigChainEscrow contract...");
  const GigChainEscrow = await ethers.getContractFactory("GigChainEscrow");
  const escrow = await GigChainEscrow.deploy();

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("✅ GigChainEscrow deployed to:", escrowAddress);
  console.log("🔗 Owner:", await escrow.owner());

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: escrowAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const filename = `${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentPath, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n📄 Deployment info saved to: deployments/${filename}`);

  // Save to parent directory for backend integration
  const backendPath = path.join(__dirname, "../../.env");
  if (fs.existsSync(backendPath)) {
    console.log("\n📝 Updating .env file with contract address...");
    let envContent = fs.readFileSync(backendPath, "utf-8");
    
    // Update or add ESCROW_CONTRACT_ADDRESS
    if (envContent.includes("ESCROW_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /ESCROW_CONTRACT_ADDRESS=.*/,
        `ESCROW_CONTRACT_ADDRESS=${escrowAddress}`
      );
    } else {
      envContent += `\nESCROW_CONTRACT_ADDRESS=${escrowAddress}\n`;
    }
    
    fs.writeFileSync(backendPath, envContent);
    console.log("✅ .env file updated");
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on PolygonScan:");
  console.log(`   npx hardhat verify --network ${network.name} ${escrowAddress}`);
  console.log("2. Update frontend with contract address");
  console.log("3. Test contract functionality with test script");
  console.log("\n💡 Contract address:", escrowAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
