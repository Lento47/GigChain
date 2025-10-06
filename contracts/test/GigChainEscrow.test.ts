import { expect } from "chai";
import { ethers } from "hardhat";
import { GigChainEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GigChainEscrow", function () {
  let escrow: GigChainEscrow;
  let mockUSDC: any;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let freelancer: SignerWithAddress;

  const CONTRACT_ID = "gig_test_001";
  const MILESTONE_AMOUNTS = [1000n * 10n**6n, 1500n * 10n**6n, 2500n * 10n**6n]; // USDC has 6 decimals
  const MILESTONE_DESCRIPTIONS = ["Design", "Development", "Testing"];
  
  beforeEach(async function () {
    [owner, client, freelancer] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to client
    const totalAmount = MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n);
    await mockUSDC.mint(client.address, totalAmount);

    // Deploy escrow
    const GigChainEscrow = await ethers.getContractFactory("GigChainEscrow");
    escrow = await GigChainEscrow.deploy();
    await escrow.waitForDeployment();
  });

  describe("Contract Creation", function () {
    it("Should create a new contract", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlines = [
        currentTime + 86400 * 7,
        currentTime + 86400 * 14,
        currentTime + 86400 * 21
      ];

      await expect(
        escrow.connect(client).createContract(
          CONTRACT_ID,
          freelancer.address,
          await mockUSDC.getAddress(),
          MILESTONE_AMOUNTS,
          MILESTONE_DESCRIPTIONS,
          deadlines
        )
      )
        .to.emit(escrow, "ContractCreated")
        .withArgs(
          CONTRACT_ID,
          client.address,
          freelancer.address,
          MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n),
          MILESTONE_AMOUNTS.length
        );

      const contractDetails = await escrow.getContract(CONTRACT_ID);
      expect(contractDetails.client).to.equal(client.address);
      expect(contractDetails.freelancer).to.equal(freelancer.address);
      expect(contractDetails.totalAmount).to.equal(
        MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n)
      );
    });

    it("Should reject duplicate contract IDs", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlines = [currentTime + 86400, currentTime + 86400 * 2];

      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        [1000n * 10n**6n, 2000n * 10n**6n],
        ["Milestone 1", "Milestone 2"],
        deadlines
      );

      await expect(
        escrow.connect(client).createContract(
          CONTRACT_ID,
          freelancer.address,
          await mockUSDC.getAddress(),
          [1000n * 10n**6n],
          ["Milestone 1"],
          [currentTime + 86400]
        )
      ).to.be.revertedWith("Contract ID already exists");
    });

    it("Should reject invalid freelancer address", async function () {
      const currentTime = Math.floor(Date.now() / 1000);

      await expect(
        escrow.connect(client).createContract(
          CONTRACT_ID,
          ethers.ZeroAddress,
          await mockUSDC.getAddress(),
          [1000n * 10n**6n],
          ["Milestone 1"],
          [currentTime + 86400]
        )
      ).to.be.revertedWith("Invalid freelancer address");
    });
  });

  describe("Contract Funding", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlines = [
        currentTime + 86400 * 7,
        currentTime + 86400 * 14,
        currentTime + 86400 * 21
      ];

      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        MILESTONE_AMOUNTS,
        MILESTONE_DESCRIPTIONS,
        deadlines
      );
    });

    it("Should fund contract with USDC", async function () {
      const totalAmount = MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n);
      
      // Approve escrow to spend USDC
      await mockUSDC.connect(client).approve(await escrow.getAddress(), totalAmount);

      await expect(
        escrow.connect(client).fundContract(CONTRACT_ID)
      )
        .to.emit(escrow, "ContractFunded")
        .withArgs(CONTRACT_ID, totalAmount);

      const escrowBalance = await mockUSDC.balanceOf(await escrow.getAddress());
      expect(escrowBalance).to.equal(totalAmount);
    });

    it("Should reject funding without approval", async function () {
      await expect(
        escrow.connect(client).fundContract(CONTRACT_ID)
      ).to.be.revertedWith("Insufficient token allowance");
    });

    it("Should reject funding from non-client", async function () {
      const totalAmount = MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n);
      await mockUSDC.connect(client).approve(await escrow.getAddress(), totalAmount);

      await expect(
        escrow.connect(freelancer).fundContract(CONTRACT_ID)
      ).to.be.revertedWith("Only client can call this");
    });
  });

  describe("Milestone Submission and Approval", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlines = [
        currentTime + 86400 * 7,
        currentTime + 86400 * 14,
        currentTime + 86400 * 21
      ];

      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        MILESTONE_AMOUNTS,
        MILESTONE_DESCRIPTIONS,
        deadlines
      );

      const totalAmount = MILESTONE_AMOUNTS.reduce((a, b) => a + b, 0n);
      await mockUSDC.connect(client).approve(await escrow.getAddress(), totalAmount);
      await escrow.connect(client).fundContract(CONTRACT_ID);
    });

    it("Should allow freelancer to submit milestone", async function () {
      const deliverableHash = "QmX7Z9KjDj4K8Y3gFqWxPqZnXvYzN5H8mRtL3cU2fJsV1A";

      await expect(
        escrow.connect(freelancer).submitMilestone(CONTRACT_ID, 0, deliverableHash)
      )
        .to.emit(escrow, "MilestoneSubmitted")
        .withArgs(CONTRACT_ID, 0, deliverableHash);

      const milestone = await escrow.getMilestone(CONTRACT_ID, 0);
      expect(milestone.deliverableHash).to.equal(deliverableHash);
      expect(milestone.state).to.equal(1); // SUBMITTED
    });

    it("Should allow client to approve and pay milestone", async function () {
      const deliverableHash = "QmX7Z9KjDj4K8Y3gFqWxPqZnXvYzN5H8mRtL3cU2fJsV1A";
      await escrow.connect(freelancer).submitMilestone(CONTRACT_ID, 0, deliverableHash);

      const freelancerBalanceBefore = await mockUSDC.balanceOf(freelancer.address);

      await expect(
        escrow.connect(client).approveMilestone(CONTRACT_ID, 0)
      )
        .to.emit(escrow, "MilestoneApproved")
        .withArgs(CONTRACT_ID, 0)
        .to.emit(escrow, "MilestonePaid")
        .withArgs(CONTRACT_ID, 0, MILESTONE_AMOUNTS[0]);

      const freelancerBalanceAfter = await mockUSDC.balanceOf(freelancer.address);
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(MILESTONE_AMOUNTS[0]);

      const milestone = await escrow.getMilestone(CONTRACT_ID, 0);
      expect(milestone.state).to.equal(4); // PAID
    });

    it("Should complete contract after all milestones paid", async function () {
      const deliverableHash = "QmTest";

      // Submit and approve all milestones
      for (let i = 0; i < MILESTONE_AMOUNTS.length; i++) {
        await escrow.connect(freelancer).submitMilestone(CONTRACT_ID, i, deliverableHash);
        
        if (i === MILESTONE_AMOUNTS.length - 1) {
          await expect(
            escrow.connect(client).approveMilestone(CONTRACT_ID, i)
          ).to.emit(escrow, "ContractCompleted");
        } else {
          await escrow.connect(client).approveMilestone(CONTRACT_ID, i);
        }
      }

      const contractDetails = await escrow.getContract(CONTRACT_ID);
      expect(contractDetails.state).to.equal(3); // COMPLETED
    });

    it("Should allow client to reject milestone", async function () {
      const deliverableHash = "QmTest";
      await escrow.connect(freelancer).submitMilestone(CONTRACT_ID, 0, deliverableHash);

      const rejectionReason = "Does not meet requirements";
      await expect(
        escrow.connect(client).rejectMilestone(CONTRACT_ID, 0, rejectionReason)
      )
        .to.emit(escrow, "MilestoneRejected")
        .withArgs(CONTRACT_ID, 0, rejectionReason);

      const milestone = await escrow.getMilestone(CONTRACT_ID, 0);
      expect(milestone.state).to.equal(3); // REJECTED
    });
  });

  describe("Dispute Handling", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlines = [currentTime + 86400];

      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        [1000n * 10n**6n],
        ["Test"],
        deadlines
      );

      await mockUSDC.connect(client).approve(await escrow.getAddress(), 1000n * 10n**6n);
      await escrow.connect(client).fundContract(CONTRACT_ID);
    });

    it("Should allow parties to raise dispute", async function () {
      await expect(
        escrow.connect(client).raiseDispute(CONTRACT_ID)
      )
        .to.emit(escrow, "DisputeRaised")
        .withArgs(CONTRACT_ID, client.address);

      const contractDetails = await escrow.getContract(CONTRACT_ID);
      expect(contractDetails.state).to.equal(4); // DISPUTED
    });
  });

  describe("Contract Cancellation", function () {
    it("Should allow cancellation before funding", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      
      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        [1000n * 10n**6n],
        ["Test"],
        [currentTime + 86400]
      );

      await expect(
        escrow.connect(client).cancelContract(CONTRACT_ID)
      )
        .to.emit(escrow, "ContractCancelled")
        .withArgs(CONTRACT_ID, 0);
    });

    it("Should refund client on cancellation after funding", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const amount = 1000n * 10n**6n;
      
      await escrow.connect(client).createContract(
        CONTRACT_ID,
        freelancer.address,
        await mockUSDC.getAddress(),
        [amount],
        ["Test"],
        [currentTime + 86400]
      );

      await mockUSDC.connect(client).approve(await escrow.getAddress(), amount);
      await escrow.connect(client).fundContract(CONTRACT_ID);

      const clientBalanceBefore = await mockUSDC.balanceOf(client.address);

      await escrow.connect(client).cancelContract(CONTRACT_ID);

      const clientBalanceAfter = await mockUSDC.balanceOf(client.address);
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(amount);
    });
  });
});

// Mock ERC20 contract for testing
// This should be in a separate file in production
