// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GigChainEscrow
 * @dev Escrow contract for GigChain.io gig economy platform
 * Supports milestone-based payments with USDC on Polygon
 */
contract GigChainEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Contract states
    enum ContractState {
        CREATED,
        FUNDED,
        ACTIVE,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    // Milestone states
    enum MilestoneState {
        PENDING,
        SUBMITTED,
        APPROVED,
        REJECTED,
        PAID
    }

    // Milestone structure
    struct Milestone {
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneState state;
        string deliverableHash; // IPFS hash of deliverable
    }

    // Contract structure
    struct GigContract {
        string contractId;
        address client;
        address freelancer;
        address tokenAddress; // USDC contract address
        uint256 totalAmount;
        uint256 releasedAmount;
        ContractState state;
        uint256 createdAt;
        uint256 fundedAt;
        Milestone[] milestones;
    }

    // Storage
    mapping(string => GigContract) public contracts;
    mapping(string => bool) public contractExists;
    
    // Events
    event ContractCreated(
        string indexed contractId,
        address indexed client,
        address indexed freelancer,
        uint256 totalAmount,
        uint256 milestoneCount
    );
    
    event ContractFunded(string indexed contractId, uint256 amount);
    event MilestoneSubmitted(string indexed contractId, uint256 milestoneIndex, string deliverableHash);
    event MilestoneApproved(string indexed contractId, uint256 milestoneIndex);
    event MilestoneRejected(string indexed contractId, uint256 milestoneIndex, string reason);
    event MilestonePaid(string indexed contractId, uint256 milestoneIndex, uint256 amount);
    event ContractCompleted(string indexed contractId, uint256 totalPaid);
    event ContractCancelled(string indexed contractId, uint256 refundedAmount);
    event DisputeRaised(string indexed contractId, address indexed raisedBy);

    // Modifiers
    modifier onlyClient(string memory contractId) {
        require(contracts[contractId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyFreelancer(string memory contractId) {
        require(contracts[contractId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }

    modifier onlyParties(string memory contractId) {
        require(
            contracts[contractId].client == msg.sender || 
            contracts[contractId].freelancer == msg.sender,
            "Only contract parties can call this"
        );
        _;
    }

    modifier contractInState(string memory contractId, ContractState requiredState) {
        require(contracts[contractId].state == requiredState, "Invalid contract state");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new gig contract with milestones
     */
    function createContract(
        string memory contractId,
        address freelancer,
        address tokenAddress,
        uint256[] memory milestoneAmounts,
        string[] memory milestoneDescriptions,
        uint256[] memory milestoneDeadlines
    ) external {
        require(!contractExists[contractId], "Contract ID already exists");
        require(freelancer != address(0), "Invalid freelancer address");
        require(freelancer != msg.sender, "Client and freelancer must be different");
        require(milestoneAmounts.length > 0, "At least one milestone required");
        require(
            milestoneAmounts.length == milestoneDescriptions.length &&
            milestoneAmounts.length == milestoneDeadlines.length,
            "Milestone arrays length mismatch"
        );

        uint256 totalAmount = 0;
        GigContract storage newContract = contracts[contractId];
        newContract.contractId = contractId;
        newContract.client = msg.sender;
        newContract.freelancer = freelancer;
        newContract.tokenAddress = tokenAddress;
        newContract.state = ContractState.CREATED;
        newContract.createdAt = block.timestamp;

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "Milestone amount must be > 0");
            require(milestoneDeadlines[i] > block.timestamp, "Deadline must be in future");
            
            totalAmount += milestoneAmounts[i];
            
            newContract.milestones.push(Milestone({
                description: milestoneDescriptions[i],
                amount: milestoneAmounts[i],
                deadline: milestoneDeadlines[i],
                state: MilestoneState.PENDING,
                deliverableHash: ""
            }));
        }

        newContract.totalAmount = totalAmount;
        contractExists[contractId] = true;

        emit ContractCreated(contractId, msg.sender, freelancer, totalAmount, milestoneAmounts.length);
    }

    /**
     * @dev Fund the contract with USDC tokens
     */
    function fundContract(string memory contractId) 
        external 
        onlyClient(contractId)
        contractInState(contractId, ContractState.CREATED)
        nonReentrant
    {
        GigContract storage gigContract = contracts[contractId];
        
        IERC20 token = IERC20(gigContract.tokenAddress);
        require(
            token.allowance(msg.sender, address(this)) >= gigContract.totalAmount,
            "Insufficient token allowance"
        );

        token.safeTransferFrom(msg.sender, address(this), gigContract.totalAmount);
        
        gigContract.state = ContractState.FUNDED;
        gigContract.fundedAt = block.timestamp;

        emit ContractFunded(contractId, gigContract.totalAmount);
    }

    /**
     * @dev Freelancer submits deliverable for a milestone
     */
    function submitMilestone(
        string memory contractId,
        uint256 milestoneIndex,
        string memory deliverableHash
    ) 
        external 
        onlyFreelancer(contractId)
        contractInState(contractId, ContractState.FUNDED)
    {
        GigContract storage gigContract = contracts[contractId];
        require(milestoneIndex < gigContract.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = gigContract.milestones[milestoneIndex];
        require(milestone.state == MilestoneState.PENDING, "Milestone not pending");
        require(bytes(deliverableHash).length > 0, "Deliverable hash required");

        milestone.state = MilestoneState.SUBMITTED;
        milestone.deliverableHash = deliverableHash;

        if (gigContract.state != ContractState.ACTIVE) {
            gigContract.state = ContractState.ACTIVE;
        }

        emit MilestoneSubmitted(contractId, milestoneIndex, deliverableHash);
    }

    /**
     * @dev Client approves and releases payment for a milestone
     */
    function approveMilestone(string memory contractId, uint256 milestoneIndex)
        external
        onlyClient(contractId)
        nonReentrant
    {
        GigContract storage gigContract = contracts[contractId];
        require(milestoneIndex < gigContract.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = gigContract.milestones[milestoneIndex];
        require(milestone.state == MilestoneState.SUBMITTED, "Milestone not submitted");

        milestone.state = MilestoneState.APPROVED;
        
        // Release payment
        IERC20 token = IERC20(gigContract.tokenAddress);
        token.safeTransfer(gigContract.freelancer, milestone.amount);
        
        gigContract.releasedAmount += milestone.amount;
        milestone.state = MilestoneState.PAID;

        emit MilestoneApproved(contractId, milestoneIndex);
        emit MilestonePaid(contractId, milestoneIndex, milestone.amount);

        // Check if all milestones are paid
        if (gigContract.releasedAmount == gigContract.totalAmount) {
            gigContract.state = ContractState.COMPLETED;
            emit ContractCompleted(contractId, gigContract.totalAmount);
        }
    }

    /**
     * @dev Client rejects a milestone submission
     */
    function rejectMilestone(
        string memory contractId,
        uint256 milestoneIndex,
        string memory reason
    )
        external
        onlyClient(contractId)
    {
        GigContract storage gigContract = contracts[contractId];
        require(milestoneIndex < gigContract.milestones.length, "Invalid milestone index");
        
        Milestone storage milestone = gigContract.milestones[milestoneIndex];
        require(milestone.state == MilestoneState.SUBMITTED, "Milestone not submitted");

        milestone.state = MilestoneState.REJECTED;
        
        emit MilestoneRejected(contractId, milestoneIndex, reason);
    }

    /**
     * @dev Raise a dispute (future: integrate with DisputeResolver AI)
     */
    function raiseDispute(string memory contractId)
        external
        onlyParties(contractId)
    {
        GigContract storage gigContract = contracts[contractId];
        require(
            gigContract.state == ContractState.FUNDED || 
            gigContract.state == ContractState.ACTIVE,
            "Cannot dispute in current state"
        );

        gigContract.state = ContractState.DISPUTED;
        
        emit DisputeRaised(contractId, msg.sender);
    }

    /**
     * @dev Cancel contract and refund client (only if not funded or all parties agree)
     */
    function cancelContract(string memory contractId)
        external
        onlyClient(contractId)
        nonReentrant
    {
        GigContract storage gigContract = contracts[contractId];
        require(
            gigContract.state == ContractState.CREATED || 
            gigContract.state == ContractState.FUNDED,
            "Cannot cancel in current state"
        );

        uint256 refundAmount = gigContract.totalAmount - gigContract.releasedAmount;
        
        if (refundAmount > 0 && gigContract.state == ContractState.FUNDED) {
            IERC20 token = IERC20(gigContract.tokenAddress);
            token.safeTransfer(gigContract.client, refundAmount);
        }

        gigContract.state = ContractState.CANCELLED;
        
        emit ContractCancelled(contractId, refundAmount);
    }

    /**
     * @dev Get contract details
     */
    function getContract(string memory contractId)
        external
        view
        returns (
            address client,
            address freelancer,
            uint256 totalAmount,
            uint256 releasedAmount,
            ContractState state,
            uint256 milestoneCount
        )
    {
        GigContract storage gigContract = contracts[contractId];
        return (
            gigContract.client,
            gigContract.freelancer,
            gigContract.totalAmount,
            gigContract.releasedAmount,
            gigContract.state,
            gigContract.milestones.length
        );
    }

    /**
     * @dev Get milestone details
     */
    function getMilestone(string memory contractId, uint256 milestoneIndex)
        external
        view
        returns (
            string memory description,
            uint256 amount,
            uint256 deadline,
            MilestoneState state,
            string memory deliverableHash
        )
    {
        Milestone storage milestone = contracts[contractId].milestones[milestoneIndex];
        return (
            milestone.description,
            milestone.amount,
            milestone.deadline,
            milestone.state,
            milestone.deliverableHash
        );
    }
}
