import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Deploying Complete GigChain Platform to Polygon Mumbai testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GigChain Token first
  console.log("\n🪙 Deploying GigChain Token (GCH)...");
  const GigChainToken = await ethers.getContractFactory("GigChainToken");
  const clpToken = await GigChainToken.deploy(deployer.address);
  await clpToken.waitForDeployment();
  const clpTokenAddress = await clpToken.getAddress();
  console.log("✅ GigChain Token deployed to:", clpTokenAddress);

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
    clpTokenAddress,
    timelockAddress,
    deployer.address
  );
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ GigChain DAO deployed to:", daoAddress);

  // Deploy GigChain Social Network
  console.log("\n👥 Deploying GigChain Social Network...");
  const GigChainSocial = await ethers.getContractFactory("GigChainSocial");
  const socialNetwork = await GigChainSocial.deploy(clpTokenAddress);
  await socialNetwork.waitForDeployment();
  const socialNetworkAddress = await socialNetwork.getAddress();
  console.log("✅ GigChain Social Network deployed to:", socialNetworkAddress);

  // Deploy GigChain Marketplace
  console.log("\n🛒 Deploying GigChain Marketplace...");
  const GigChainMarketplace = await ethers.getContractFactory("GigChainMarketplace");
  const marketplace = await GigChainMarketplace.deploy(
    socialNetworkAddress,
    clpTokenAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ GigChain Marketplace deployed to:", marketplaceAddress);

  // Deploy GigChain DeFi
  console.log("\n💰 Deploying GigChain DeFi...");
  const GigChainDeFi = await ethers.getContractFactory("GigChainDeFi");
  const defi = await GigChainDeFi.deploy(
    clpTokenAddress,
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"  // WETH on Polygon
  );
  await defi.waitForDeployment();
  const defiAddress = await defi.getAddress();
  console.log("✅ GigChain DeFi deployed to:", defiAddress);

  // Deploy Reputation NFT contract
  console.log("\n🏆 Deploying Reputation NFT contract...");
  const ReputationNFT = await ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("✅ Reputation NFT deployed to:", reputationNFTAddress);

  // Deploy GigChain Escrow contract
  console.log("\n🔒 Deploying GigChain Escrow contract...");
  const GigChainEscrow = await ethers.getContractFactory("GigChainEscrow");
  const escrowContract = await GigChainEscrow.deploy(clpTokenAddress);
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
  const mintAmount = ethers.parseEther("10000000"); // 10M GCH tokens
  await clpToken.mint(deployer.address, mintAmount);
  await mockUSDC.mint(deployer.address, ethers.parseUnits("1000000", 6)); // 1M USDC
  console.log("✅ Initial tokens minted");

  // Add initial funds to DAO treasury
  console.log("\n💰 Adding initial funds to DAO treasury...");
  const treasuryAmount = ethers.parseEther("100000"); // 100K GCH
  await clpToken.transfer(daoAddress, treasuryAmount);
  console.log("✅ DAO treasury funded");

  // Create initial staking pools
  console.log("\n🏊 Creating initial staking pools...");
  
  // Standard staking pool (GCH -> GCH)
  await defi.createStakingPool(
    0, // Standard
    clpTokenAddress,
    clpTokenAddress,
    ethers.parseEther("100"), // 100 GCH per second
    30 * 24 * 60 * 60 // 30 days lock
  );

  // Governance staking pool (GCH -> GCH)
  await defi.createStakingPool(
    1, // Governance
    clpTokenAddress,
    clpTokenAddress,
    ethers.parseEther("150"), // 150 GCH per second
    90 * 24 * 60 * 60 // 90 days lock
  );

  // Social staking pool (GCH -> GCH)
  await defi.createStakingPool(
    2, // Social
    clpTokenAddress,
    clpTokenAddress,
    ethers.parseEther("120"), // 120 GCH per second
    60 * 24 * 60 * 60 // 60 days lock
  );

  console.log("✅ Initial staking pools created");

  // Grant necessary roles
  console.log("\n🔐 Setting up permissions...");
  
  // Grant social contract the REWARDER_ROLE for GCH token
  await clpToken.grantRole(await clpToken.REWARDER_ROLE(), socialNetworkAddress);
  
  // Grant marketplace the REWARDER_ROLE for GCH token
  await clpToken.grantRole(await clpToken.REWARDER_ROLE(), marketplaceAddress);
  
  // Grant DeFi contract the REWARDER_ROLE for GCH token
  await clpToken.grantRole(await clpToken.REWARDER_ROLE(), defiAddress);

  console.log("✅ Permissions configured");

  // Create deployment summary
  const deploymentInfo = {
    network: "Polygon Mumbai Testnet",
    deployer: deployer.address,
    contracts: {
      GigChainToken: clpTokenAddress,
      TimelockController: timelockAddress,
      GigChainDAO: daoAddress,
      GigChainSocial: socialNetworkAddress,
      GigChainMarketplace: marketplaceAddress,
      GigChainDeFi: defiAddress,
      ReputationNFT: reputationNFTAddress,
      GigChainEscrow: escrowAddress,
      MockUSDC: mockUSDCAddress
    },
    features: {
      socialNetwork: "Decentralized professional social network with NFT profiles",
      governance: "DAO with voting, proposals, and treasury management",
      marketplace: "Professional services marketplace with escrow payments",
      defi: "Staking, yield farming, and liquidity mining",
      tokenomics: "1B GCH tokens with social rewards and governance",
      nftProfiles: "Soulbound professional profiles with dynamic metadata",
      reputation: "On-chain reputation system with skill verification",
      escrow: "Secure payment system for marketplace transactions"
    },
    stakingPools: {
      standard: "GCH staking with 12.5% APY, 30-day lock",
      governance: "GCH governance staking with 18% APY, 90-day lock",
      social: "GCH social staking with 15% APY, 60-day lock",
      liquidity: "LP token staking with 25% APY, no lock",
      yield: "Yield farming with 22% APY, 45-day lock"
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n🎉 Complete GigChain Platform deployed successfully!");
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

  console.log("\n🚀 Platform Features:");
  console.log("====================");
  Object.entries(deploymentInfo.features).forEach(([feature, description]) => {
    console.log(`• ${feature}: ${description}`);
  });

  console.log("\n🏊 Staking Pools:");
  console.log("================");
  Object.entries(deploymentInfo.stakingPools).forEach(([pool, description]) => {
    console.log(`• ${pool}: ${description}`);
  });

  // Save deployment info to file
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '../deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `gigchain-complete-${deploymentInfo.blockNumber}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Verify contracts on PolygonScan (optional)
  console.log("\n🔍 To verify contracts on PolygonScan, run:");
  console.log(`npx hardhat verify --network mumbai ${clpTokenAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${timelockAddress} 0 "[${deployer.address}]" "[${deployer.address}]" "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${daoAddress} "${clpTokenAddress}" "${timelockAddress}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network mumbai ${socialNetworkAddress} "${clpTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${marketplaceAddress} "${socialNetworkAddress}" "${clpTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${defiAddress} "${clpTokenAddress}" "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"`);
  console.log(`npx hardhat verify --network mumbai ${reputationNFTAddress}`);
  console.log(`npx hardhat verify --network mumbai ${escrowAddress} "${clpTokenAddress}"`);
  console.log(`npx hardhat verify --network mumbai ${mockUSDCAddress} "Mock USDC" "mUSDC" 6`);

  console.log("\n🌐 GigChain Complete Platform is ready!");
  console.log("Visit: https://mumbai.polygonscan.com/");
  console.log("\n📱 Platform Components:");
  console.log("1. Social Network - Professional profiles and networking");
  console.log("2. Marketplace - Services and skills marketplace");
  console.log("3. DeFi - Staking, yield farming, and liquidity mining");
  console.log("4. DAO - Community governance and decision making");
  console.log("5. Reputation - On-chain reputation and skill verification");
  console.log("\n🚀 Next Steps:");
  console.log("1. Deploy frontend to Vercel/Netlify");
  console.log("2. Set up IPFS for metadata storage");
  console.log("3. Configure domain and SSL certificates");
  console.log("4. Launch beta testing program");
  console.log("5. Community building and marketing");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });