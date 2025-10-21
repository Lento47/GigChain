import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Deploying GigChain contracts to Polygon Mumbai testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GIGS Token first
  console.log("\n📝 Deploying GIGS Token...");
  const GigsToken = await ethers.getContractFactory("GigsToken");
  const gigsToken = await GigsToken.deploy(deployer.address);
  await gigsToken.waitForDeployment();
  const gigsTokenAddress = await gigsToken.getAddress();
  console.log("✅ GIGS Token deployed to:", gigsTokenAddress);

  // Deploy GigChain Profile contract
  console.log("\n👤 Deploying GigChain Profile contract...");
  const GigChainProfile = await ethers.getContractFactory("GigChainProfile");
  const profileContract = await GigChainProfile.deploy();
  await profileContract.waitForDeployment();
  const profileAddress = await profileContract.getAddress();
  console.log("✅ GigChain Profile deployed to:", profileAddress);

  // Deploy GigChain Connections contract
  console.log("\n🔗 Deploying GigChain Connections contract...");
  const GigChainConnections = await ethers.getContractFactory("GigChainConnections");
  const connectionsContract = await GigChainConnections.deploy(profileAddress);
  await connectionsContract.waitForDeployment();
  const connectionsAddress = await connectionsContract.getAddress();
  console.log("✅ GigChain Connections deployed to:", connectionsAddress);

  // Deploy GigChain Feed contract
  console.log("\n📰 Deploying GigChain Feed contract...");
  const GigChainFeed = await ethers.getContractFactory("GigChainFeed");
  const feedContract = await GigChainFeed.deploy(profileAddress, connectionsAddress);
  await feedContract.waitForDeployment();
  const feedAddress = await feedContract.getAddress();
  console.log("✅ GigChain Feed deployed to:", feedAddress);

  // Deploy GigChain Bounties contract
  console.log("\n🎯 Deploying GigChain Bounties contract...");
  const GigChainBounties = await ethers.getContractFactory("GigChainBounties");
  const bountiesContract = await GigChainBounties.deploy(profileAddress, connectionsAddress, gigsTokenAddress);
  await bountiesContract.waitForDeployment();
  const bountiesAddress = await bountiesContract.getAddress();
  console.log("✅ GigChain Bounties deployed to:", bountiesAddress);

  // Deploy Reputation NFT contract
  console.log("\n🏆 Deploying Reputation NFT contract...");
  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("✅ Reputation NFT deployed to:", reputationNFTAddress);

  // Deploy GigChain Escrow contract
  console.log("\n💰 Deploying GigChain Escrow contract...");
  const GigChainEscrow = await ethers.getContractFactory("GigChainEscrow");
  const escrowContract = await GigChainEscrow.deploy(gigsTokenAddress);
  await escrowContract.waitForDeployment();
  const escrowAddress = await escrowContract.getAddress();
  console.log("✅ GigChain Escrow deployed to:", escrowAddress);

  // Deploy Mock ERC20 for testing
  console.log("\n🧪 Deploying Mock ERC20 for testing...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock USDC", "mUSDC", 6);
  await mockERC20.waitForDeployment();
  const mockERC20Address = await mockERC20.getAddress();
  console.log("✅ Mock ERC20 deployed to:", mockERC20Address);

  // Mint initial tokens for testing
  console.log("\n🪙 Minting initial tokens for testing...");
  const mintAmount = ethers.parseEther("1000000"); // 1M tokens
  await gigsToken.mint(deployer.address, mintAmount);
  await mockERC20.mint(deployer.address, ethers.parseUnits("1000000", 6)); // 1M USDC
  console.log("✅ Initial tokens minted");

  // Create deployment summary
  const deploymentInfo = {
    network: "Polygon Mumbai Testnet",
    deployer: deployer.address,
    contracts: {
      GigsToken: gigsTokenAddress,
      GigChainProfile: profileAddress,
      GigChainConnections: connectionsAddress,
      GigChainFeed: feedAddress,
      GigChainBounties: bountiesAddress,
      ReputationNFT: reputationNFTAddress,
      GigChainEscrow: escrowAddress,
      MockERC20: mockERC20Address
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Block Number: ${deploymentInfo.blockNumber}`);
  console.log("\nContract Addresses:");
  console.log("===================");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });

  // Save deployment info to file
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `gigchain-${deploymentInfo.blockNumber}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Verify contracts on PolygonScan (optional)
  console.log("\n🔍 To verify contracts on PolygonScan, run:");
  console.log(`npx hardhat verify --network mumbai ${gigsTokenAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${profileAddress}`);
  console.log(`npx hardhat verify --network mumbai ${connectionsAddress} "${profileAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${feedAddress} "${profileAddress}" "${connectionsAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${bountiesAddress} "${profileAddress}" "${connectionsAddress}" "${gigsTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${reputationNFTAddress}`);
  console.log(`npx hardhat verify --network mumbai ${escrowAddress} "${gigsTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${mockERC20Address} "Mock USDC" "mUSDC" 6`);

  console.log("\n🚀 GigChain is ready for testing on Polygon Mumbai!");
  console.log("Visit: https://mumbai.polygonscan.com/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });