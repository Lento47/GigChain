import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🌐 Deploying GigChain Social Network to Polygon Mumbai testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GigChain Token first
  console.log("\n🪙 Deploying GigChain Token (GCH)...");
  const GigChainToken = await ethers.getContractFactory("GigChainToken");
  const socialToken = await GigChainToken.deploy(deployer.address);
  await socialToken.waitForDeployment();
  const socialTokenAddress = await socialToken.getAddress();
  console.log("✅ GigChain Token deployed to:", socialTokenAddress);

  // Deploy Timelock Controller for DAO
  console.log("\n⏰ Deploying Timelock Controller...");
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    0, // min delay
    [deployer.address], // proposers
    [deployer.address], // executors
    deployer.address // admin
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("✅ Timelock Controller deployed to:", timelockAddress);

  // Deploy GigChain DAO
  console.log("\n🗳️ Deploying GigChain DAO...");
  const GigChainDAO = await ethers.getContractFactory("GigChainDAO");
  const dao = await GigChainDAO.deploy(
    socialTokenAddress,
    timelockAddress,
    deployer.address
  );
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ GigChain DAO deployed to:", daoAddress);

  // Deploy GigChain Social Network
  console.log("\n👥 Deploying GigChain Social Network...");
  const GigChainSocial = await ethers.getContractFactory("GigChainSocial");
  const socialNetwork = await GigChainSocial.deploy(socialTokenAddress);
  await socialNetwork.waitForDeployment();
  const socialNetworkAddress = await socialNetwork.getAddress();
  console.log("✅ GigChain Social Network deployed to:", socialNetworkAddress);

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
  const escrowContract = await GigChainEscrow.deploy(socialTokenAddress);
  await escrowContract.waitForDeployment();
  const escrowAddress = await escrowContract.getAddress();
  console.log("✅ GigChain Escrow deployed to:", escrowAddress);

  // Deploy Mock ERC20 for testing
  console.log("\n🧪 Deploying Mock USDC for testing...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC", 6);
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

  // Mint initial tokens for testing
  console.log("\n🪙 Minting initial tokens for testing...");
  const mintAmount = ethers.parseEther("1000000"); // 1M GCH tokens
  await socialToken.mint(deployer.address, mintAmount);
  await mockUSDC.mint(deployer.address, ethers.parseUnits("1000000", 6)); // 1M USDC
  console.log("✅ Initial tokens minted");

  // Add initial funds to DAO treasury
  console.log("\n💰 Adding initial funds to DAO treasury...");
  const treasuryAmount = ethers.parseEther("10000"); // 10K GCH
  await socialToken.transfer(daoAddress, treasuryAmount);
  console.log("✅ DAO treasury funded");

  // Create deployment summary
  const deploymentInfo = {
    network: "Polygon Mumbai Testnet",
    deployer: deployer.address,
    contracts: {
      GigChainToken: socialTokenAddress,
      TimelockController: timelockAddress,
      GigChainDAO: daoAddress,
      GigChainSocial: socialNetworkAddress,
      ReputationNFT: reputationNFTAddress,
      GigChainEscrow: escrowAddress,
      MockUSDC: mockUSDCAddress
    },
    features: {
      socialNetwork: "Decentralized professional social network",
      governance: "DAO with voting and proposals",
      tokenomics: "1B GCH tokens with social rewards",
      nftProfiles: "Soulbound professional profiles",
      reputation: "On-chain reputation system",
      escrow: "Secure payment system"
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n🎉 GigChain Social Network deployed successfully!");
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

  console.log("\n🚀 Features:");
  console.log("============");
  Object.entries(deploymentInfo.features).forEach(([feature, description]) => {
    console.log(`• ${feature}: ${description}`);
  });

  // Save deployment info to file
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `gigchain-social-${deploymentInfo.blockNumber}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Verify contracts on PolygonScan (optional)
  console.log("\n🔍 To verify contracts on PolygonScan, run:");
  console.log(`npx hardhat verify --network mumbai ${socialTokenAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${timelockAddress} 0 "[${deployer.address}]" "[${deployer.address}]" "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${daoAddress} "${socialTokenAddress}" "${timelockAddress}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${socialNetworkAddress} "${socialTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${reputationNFTAddress}`);
  console.log(`npx hardhat verify --network mumbai ${escrowAddress} "${socialTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${mockUSDCAddress} "Mock USDC" "mUSDC" 6`);

  console.log("\n🌐 GigChain Social Network is ready!");
  console.log("Visit: https://mumbai.polygonscan.com/");
  console.log("\n📱 Next steps:");
  console.log("1. Create your professional profile");
  console.log("2. Connect with other professionals");
  console.log("3. Share content and earn GCH tokens");
  console.log("4. Participate in DAO governance");
  console.log("5. Build your professional reputation");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });