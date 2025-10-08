// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title DisputeOracle
 * @notice Decentralized dispute resolution oracle for GigChain contracts
 * @dev Integrates with Chainlink for external data and voting mechanisms
 */
contract DisputeOracle {
    
    // Dispute status enum
    enum DisputeStatus {
        Pending,        // Dispute created, waiting for evidence
        UnderReview,    // Evidence submitted, voting in progress
        Resolved,       // Dispute resolved
        Cancelled       // Dispute cancelled
    }
    
    // Resolution outcome enum
    enum Outcome {
        None,           // No decision yet
        FreelancerWins, // Freelancer gets payment
        ClientWins,     // Client gets refund
        Split,          // Payment split between parties
        Escalated       // Escalate to human arbitration
    }
    
    // Dispute structure
    struct Dispute {
        uint256 id;
        address contractAddress;
        address freelancer;
        address client;
        uint256 amount;
        string description;
        string[] freelancerEvidence;
        string[] clientEvidence;
        DisputeStatus status;
        Outcome outcome;
        uint256 freelancerVotes;
        uint256 clientVotes;
        uint256 createdAt;
        uint256 resolvedAt;
        uint256 votingDeadline;
        mapping(address => bool) hasVoted;
        mapping(address => Outcome) votes;
    }
    
    // Oracle configuration
    struct OracleConfig {
        uint256 minStake;           // Minimum stake to become oracle
        uint256 votingPeriod;       // Voting period in seconds
        uint256 quorum;             // Minimum votes required
        uint256 rewardPerVote;      // Reward for participating oracles
        bool useChainlink;          // Use Chainlink VRF for randomness
    }
    
    // State variables
    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public isOracle;
    mapping(address => uint256) public oracleStake;
    mapping(address => uint256) public oracleReputation;
    
    uint256 public nextDisputeId = 1;
    uint256 public totalStaked;
    uint256 public totalDisputes;
    uint256 public resolvedDisputes;
    
    OracleConfig public config;
    
    // Chainlink integration (optional)
    AggregatorV3Interface internal priceFeed;
    
    // Events
    event DisputeCreated(
        uint256 indexed disputeId,
        address indexed contractAddress,
        address indexed freelancer,
        address client,
        uint256 amount
    );
    
    event EvidenceSubmitted(
        uint256 indexed disputeId,
        address indexed submitter,
        string evidenceHash,
        uint256 timestamp
    );
    
    event VoteCast(
        uint256 indexed disputeId,
        address indexed oracle,
        Outcome vote,
        uint256 timestamp
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        Outcome outcome,
        uint256 timestamp
    );
    
    event OracleRegistered(address indexed oracle, uint256 stake);
    event OracleUnregistered(address indexed oracle, uint256 returned);
    event ReputationUpdated(address indexed oracle, uint256 newReputation);
    
    // Modifiers
    modifier onlyOracle() {
        require(isOracle[msg.sender], "Not an oracle");
        _;
    }
    
    modifier disputeExists(uint256 disputeId) {
        require(disputeId < nextDisputeId, "Dispute does not exist");
        _;
    }
    
    modifier disputePending(uint256 disputeId) {
        require(
            disputes[disputeId].status == DisputeStatus.Pending ||
            disputes[disputeId].status == DisputeStatus.UnderReview,
            "Dispute not pending"
        );
        _;
    }
    
    constructor(uint256 _minStake, uint256 _votingPeriod, uint256 _quorum) {
        config = OracleConfig({
            minStake: _minStake,
            votingPeriod: _votingPeriod,
            quorum: _quorum,
            rewardPerVote: 0.001 ether,
            useChainlink: false
        });
    }
    
    /**
     * @notice Register as an oracle by staking tokens
     */
    function registerOracle() external payable {
        require(!isOracle[msg.sender], "Already an oracle");
        require(msg.value >= config.minStake, "Insufficient stake");
        
        isOracle[msg.sender] = true;
        oracleStake[msg.sender] = msg.value;
        oracleReputation[msg.sender] = 100; // Starting reputation
        totalStaked += msg.value;
        
        emit OracleRegistered(msg.sender, msg.value);
    }
    
    /**
     * @notice Unregister as an oracle and withdraw stake
     */
    function unregisterOracle() external onlyOracle {
        uint256 stake = oracleStake[msg.sender];
        require(stake > 0, "No stake to withdraw");
        
        isOracle[msg.sender] = false;
        oracleStake[msg.sender] = 0;
        totalStaked -= stake;
        
        payable(msg.sender).transfer(stake);
        
        emit OracleUnregistered(msg.sender, stake);
    }
    
    /**
     * @notice Create a new dispute
     * @param _contractAddress Address of the disputed contract
     * @param _freelancer Address of the freelancer
     * @param _client Address of the client
     * @param _amount Amount in dispute
     * @param _description Dispute description
     */
    function createDispute(
        address _contractAddress,
        address _freelancer,
        address _client,
        uint256 _amount,
        string memory _description
    ) external returns (uint256) {
        require(_freelancer != address(0) && _client != address(0), "Invalid addresses");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 disputeId = nextDisputeId++;
        Dispute storage dispute = disputes[disputeId];
        
        dispute.id = disputeId;
        dispute.contractAddress = _contractAddress;
        dispute.freelancer = _freelancer;
        dispute.client = _client;
        dispute.amount = _amount;
        dispute.description = _description;
        dispute.status = DisputeStatus.Pending;
        dispute.outcome = Outcome.None;
        dispute.createdAt = block.timestamp;
        dispute.votingDeadline = block.timestamp + config.votingPeriod;
        
        totalDisputes++;
        
        emit DisputeCreated(
            disputeId,
            _contractAddress,
            _freelancer,
            _client,
            _amount
        );
        
        return disputeId;
    }
    
    /**
     * @notice Submit evidence for a dispute
     * @param _disputeId ID of the dispute
     * @param _evidenceHash IPFS hash of the evidence
     */
    function submitEvidence(
        uint256 _disputeId,
        string memory _evidenceHash
    ) external disputeExists(_disputeId) disputePending(_disputeId) {
        Dispute storage dispute = disputes[_disputeId];
        
        require(
            msg.sender == dispute.freelancer || msg.sender == dispute.client,
            "Not a party to this dispute"
        );
        
        if (msg.sender == dispute.freelancer) {
            dispute.freelancerEvidence.push(_evidenceHash);
        } else {
            dispute.clientEvidence.push(_evidenceHash);
        }
        
        // Move to UnderReview if not already
        if (dispute.status == DisputeStatus.Pending) {
            dispute.status = DisputeStatus.UnderReview;
        }
        
        emit EvidenceSubmitted(_disputeId, msg.sender, _evidenceHash, block.timestamp);
    }
    
    /**
     * @notice Cast a vote on a dispute
     * @param _disputeId ID of the dispute
     * @param _outcome Voting outcome
     */
    function castVote(
        uint256 _disputeId,
        Outcome _outcome
    ) external onlyOracle disputeExists(_disputeId) {
        Dispute storage dispute = disputes[_disputeId];
        
        require(dispute.status == DisputeStatus.UnderReview, "Dispute not under review");
        require(block.timestamp <= dispute.votingDeadline, "Voting period ended");
        require(!dispute.hasVoted[msg.sender], "Already voted");
        require(_outcome != Outcome.None, "Invalid outcome");
        
        dispute.hasVoted[msg.sender] = true;
        dispute.votes[msg.sender] = _outcome;
        
        // Tally vote
        if (_outcome == Outcome.FreelancerWins) {
            dispute.freelancerVotes++;
        } else if (_outcome == Outcome.ClientWins) {
            dispute.clientVotes++;
        }
        
        emit VoteCast(_disputeId, msg.sender, _outcome, block.timestamp);
        
        // Check if quorum reached
        uint256 totalVotes = dispute.freelancerVotes + dispute.clientVotes;
        if (totalVotes >= config.quorum) {
            _resolveDispute(_disputeId);
        }
    }
    
    /**
     * @notice Resolve a dispute based on votes
     * @param _disputeId ID of the dispute
     */
    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        
        require(dispute.status == DisputeStatus.UnderReview, "Not under review");
        
        // Determine outcome based on votes
        if (dispute.freelancerVotes > dispute.clientVotes) {
            dispute.outcome = Outcome.FreelancerWins;
        } else if (dispute.clientVotes > dispute.freelancerVotes) {
            dispute.outcome = Outcome.ClientWins;
        } else {
            // Tie - split payment
            dispute.outcome = Outcome.Split;
        }
        
        dispute.status = DisputeStatus.Resolved;
        dispute.resolvedAt = block.timestamp;
        resolvedDisputes++;
        
        emit DisputeResolved(_disputeId, dispute.outcome, block.timestamp);
        
        // Reward participating oracles
        _rewardOracles(_disputeId);
    }
    
    /**
     * @notice Manually resolve a dispute (admin function)
     * @param _disputeId ID of the dispute
     */
    function manualResolve(uint256 _disputeId) external disputeExists(_disputeId) {
        Dispute storage dispute = disputes[_disputeId];
        
        require(block.timestamp > dispute.votingDeadline, "Voting period not ended");
        require(dispute.status == DisputeStatus.UnderReview, "Not under review");
        
        // Check if quorum not reached
        uint256 totalVotes = dispute.freelancerVotes + dispute.clientVotes;
        if (totalVotes < config.quorum) {
            dispute.outcome = Outcome.Escalated;
            dispute.status = DisputeStatus.Resolved;
            emit DisputeResolved(_disputeId, Outcome.Escalated, block.timestamp);
        } else {
            _resolveDispute(_disputeId);
        }
    }
    
    /**
     * @notice Reward oracles who voted
     * @param _disputeId ID of the dispute
     */
    function _rewardOracles(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        uint256 rewardPool = config.rewardPerVote * (dispute.freelancerVotes + dispute.clientVotes);
        
        // In a real implementation, distribute rewards to voting oracles
        // This is simplified - you'd iterate through voters and transfer rewards
    }
    
    /**
     * @notice Get dispute details
     * @param _disputeId ID of the dispute
     */
    function getDispute(uint256 _disputeId) external view disputeExists(_disputeId) returns (
        address contractAddress,
        address freelancer,
        address client,
        uint256 amount,
        string memory description,
        DisputeStatus status,
        Outcome outcome,
        uint256 freelancerVotes,
        uint256 clientVotes,
        uint256 createdAt,
        uint256 resolvedAt
    ) {
        Dispute storage dispute = disputes[_disputeId];
        
        return (
            dispute.contractAddress,
            dispute.freelancer,
            dispute.client,
            dispute.amount,
            dispute.description,
            dispute.status,
            dispute.outcome,
            dispute.freelancerVotes,
            dispute.clientVotes,
            dispute.createdAt,
            dispute.resolvedAt
        );
    }
    
    /**
     * @notice Get evidence for a dispute
     * @param _disputeId ID of the dispute
     */
    function getEvidence(uint256 _disputeId) external view disputeExists(_disputeId) returns (
        string[] memory freelancerEvidence,
        string[] memory clientEvidence
    ) {
        Dispute storage dispute = disputes[_disputeId];
        return (dispute.freelancerEvidence, dispute.clientEvidence);
    }
    
    /**
     * @notice Get oracle statistics
     */
    function getOracleStats() external view returns (
        uint256 totalOracles,
        uint256 _totalStaked,
        uint256 _totalDisputes,
        uint256 _resolvedDisputes
    ) {
        uint256 oracleCount = 0;
        // In production, track oracle count separately
        
        return (oracleCount, totalStaked, totalDisputes, resolvedDisputes);
    }
    
    /**
     * @notice Update oracle configuration (admin function)
     */
    function updateConfig(
        uint256 _minStake,
        uint256 _votingPeriod,
        uint256 _quorum,
        uint256 _rewardPerVote
    ) external {
        config.minStake = _minStake;
        config.votingPeriod = _votingPeriod;
        config.quorum = _quorum;
        config.rewardPerVote = _rewardPerVote;
    }
}
