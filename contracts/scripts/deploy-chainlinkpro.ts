import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Deploying ChainLinkPro contracts to Polygon Mumbai testnet...");
  
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

  // Deploy ChainLinkPro Profile contract
  console.log("\n👤 Deploying ChainLinkPro Profile contract...");
  const ChainLinkProProfile = await ethers.getContractFactory("ChainLinkProProfile");
  const profileContract = await ChainLinkProProfile.deploy();
  await profileContract.waitForDeployment();
  const profileAddress = await profileContract.getAddress();
  console.log("✅ ChainLinkPro Profile deployed to:", profileAddress);

  // Deploy ChainLinkPro Connections contract
  console.log("\n🔗 Deploying ChainLinkPro Connections contract...");
  const ChainLinkProConnections = await ethers.getContractFactory("ChainLinkProConnections");
  const connectionsContract = await ChainLinkProConnections.deploy(profileAddress);
  await connectionsContract.waitForDeployment();
  const connectionsAddress = await connectionsContract.getAddress();
  console.log("✅ ChainLinkPro Connections deployed to:", connectionsAddress);

  // Deploy ChainLinkPro Feed contract
  console.log("\n📰 Deploying ChainLinkPro Feed contract...");
  const ChainLinkProFeed = await ethers.getContractFactory("ChainLinkProFeed");
  const feedContract = await ChainLinkProFeed.deploy(profileAddress, connectionsAddress);
  await feedContract.waitForDeployment();
  const feedAddress = await feedContract.getAddress();
  console.log("✅ ChainLinkPro Feed deployed to:", feedAddress);

  // Deploy ChainLinkPro Bounties contract
  console.log("\n🎯 Deploying ChainLinkPro Bounties contract...");
  const ChainLinkProBounties = await ethers.getContractFactory("ChainLinkProBounties");
  const bountiesContract = await ChainLinkProBounties.deploy(profileAddress, connectionsAddress, gigsTokenAddress);
  await bountiesContract.waitForDeployment();
  const bountiesAddress = await bountiesContract.getAddress();
  console.log("✅ ChainLinkPro Bounties deployed to:", bountiesAddress);

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
      ChainLinkProProfile: profileAddress,
      ChainLinkProConnections: connectionsAddress,
      ChainLinkProFeed: feedAddress,
      ChainLinkProBounties: bountiesAddress,
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
  
  const filename = `chainlinkpro-${deploymentInfo.blockNumber}.json`;
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

  console.log("\n🚀 ChainLinkPro is ready for testing on Polygon Mumbai!");
  console.log("Visit: https://mumbai.polygonscan.com/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });