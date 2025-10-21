// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ChainLinkProToken.sol";

/**
 * @title ChainLinkProDAO
 * @notice Decentralized governance for ChainLinkPro social network
 * @dev Handles proposals, voting, and community decisions
 * 
 * Features:
 * - Proposal creation and voting
 * - Time-locked execution
 * - Quorum requirements
 * - Community treasury management
 * - Social feature updates
 * - Token parameter changes
 */
contract ChainLinkProDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    AccessControl,
    ReentrancyGuard
{
    // ============ Constants ============

    /// @notice Role for proposal creators
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    /// @notice Role for executors
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    /// @notice Role for cancellers
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    // ============ State Variables ============

    /// @notice Community treasury
    uint256 public communityTreasury;

    /// @notice Proposal categories
    enum ProposalCategory {
        Treasury,           // 0
        SocialFeatures,     // 1
        TokenParameters,    // 2
        Governance,         // 3
        Security,           // 4
        Integration,        // 5
        Marketing,          // 6
        Other              // 7
    }

    /// @notice Proposal data
    struct ProposalData {
        ProposalCategory category;
        string description;
        uint256 requestedAmount;
        address beneficiary;
        bool isExecuted;
        uint256 createdAt;
    }

    /// @notice Mapping of proposal data
    mapping(uint256 => ProposalData) public proposalData;

    /// @notice Community proposals count
    uint256 public communityProposalsCount;

    /// @notice Successful proposals count
    uint256 public successfulProposalsCount;

    /// @notice Total voting power used
    uint256 public totalVotingPowerUsed;

    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalCategory category,
        string description,
        uint256 requestedAmount
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        bool success
    );
    event TreasuryUpdated(uint256 newAmount, string reason);
    event CommunityRewardDistributed(
        address indexed recipient,
        uint256 amount,
        string reason
    );

    // ============ Modifiers ============

    modifier onlyProposer() {
        require(
            hasRole(PROPOSER_ROLE, msg.sender) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to create proposals"
        );
        _;
    }

    modifier onlyExecutor() {
        require(
            hasRole(EXECUTOR_ROLE, msg.sender) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to execute proposals"
        );
        _;
    }

    /**
     * @notice Constructor
     * @param _token ChainLinkPro token address
     * @param _timelock Timelock controller address
     * @param admin Admin address
     */
    constructor(
        ChainLinkProToken _token,
        TimelockController _timelock,
        address admin
    )
        Governor("ChainLinkPro DAO")
        GovernorSettings(
            1, // voting delay (1 block)
            17280, // voting period (3 days in blocks, assuming 15s block time)
            0 // proposal threshold (0 tokens)
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {
        require(admin != address(0), "Admin cannot be zero address");

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(CANCELLER_ROLE, admin);

        // Grant timelock roles
        _timelock.grantRole(_timelock.PROPOSER_ROLE(), address(this));
        _timelock.grantRole(_timelock.EXECUTOR_ROLE(), address(this));
        _timelock.grantRole(_timelock.CANCELLER_ROLE(), address(this));
    }

    /**
     * @notice Create a new proposal
     * @param targets Target addresses
     * @param values ETH values
     * @param calldatas Calldata arrays
     * @param description Proposal description
     * @param category Proposal category
     * @param requestedAmount Amount requested from treasury
     * @param beneficiary Beneficiary address
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalCategory category,
        uint256 requestedAmount,
        address beneficiary
    ) public onlyProposer returns (uint256) {
        require(
            category != ProposalCategory.Treasury || requestedAmount <= communityTreasury,
            "Insufficient treasury funds"
        );

        uint256 proposalId = super.propose(targets, values, calldatas, description);

        // Store proposal data
        proposalData[proposalId] = ProposalData({
            category: category,
            description: description,
            requestedAmount: requestedAmount,
            beneficiary: beneficiary,
            isExecuted: false,
            createdAt: block.timestamp
        });

        communityProposalsCount++;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            category,
            description,
            requestedAmount
        );

        return proposalId;
    }

    /**
     * @notice Execute a proposal
     * @param proposalId Proposal ID
     */
    function execute(
        uint256 proposalId
    ) public payable override onlyExecutor nonReentrant {
        super.execute(proposalId);

        ProposalData storage data = proposalData[proposalId];
        require(!data.isExecuted, "Proposal already executed");

        data.isExecuted = true;
        successfulProposalsCount++;

        // Handle treasury proposals
        if (data.category == ProposalCategory.Treasury && data.requestedAmount > 0) {
            require(
                communityTreasury >= data.requestedAmount,
                "Insufficient treasury funds"
            );

            communityTreasury -= data.requestedAmount;

            if (data.beneficiary != address(0)) {
                payable(data.beneficiary).transfer(data.requestedAmount);
            }
        }

        emit ProposalExecuted(proposalId, msg.sender, true);
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId Proposal ID
     * @param support Support value (0 = Against, 1 = For, 2 = Abstain)
     * @param reason Voting reason
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) public override {
        super.castVote(proposalId, support, reason);

        // Track voting power usage
        uint256 votingPower = getVotes(msg.sender, proposalSnapshot(proposalId));
        totalVotingPowerUsed += votingPower;
    }

    /**
     * @notice Vote on a proposal with signature
     * @param proposalId Proposal ID
     * @param support Support value
     * @param v Signature v
     * @param r Signature r
     * @param s Signature s
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public override {
        super.castVoteBySig(proposalId, support, v, r, s);

        // Track voting power usage
        uint256 votingPower = getVotes(msg.sender, proposalSnapshot(proposalId));
        totalVotingPowerUsed += votingPower;
    }

    /**
     * @notice Add funds to community treasury
     */
    function addToTreasury() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        communityTreasury += msg.value;
        emit TreasuryUpdated(communityTreasury, "Treasury deposit");
    }

    /**
     * @notice Distribute community rewards
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @param reason Distribution reason
     */
    function distributeCommunityRewards(
        address[] memory recipients,
        uint256[] memory amounts,
        string memory reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(totalAmount <= communityTreasury, "Insufficient treasury funds");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be greater than 0");

            communityTreasury -= amounts[i];
            payable(recipients[i]).transfer(amounts[i]);

            emit CommunityRewardDistributed(recipients[i], amounts[i], reason);
        }
    }

    /**
     * @notice Update proposal threshold
     * @param newProposalThreshold New threshold
     */
    function updateProposalThreshold(uint256 newProposalThreshold)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _updateProposalThreshold(newProposalThreshold);
    }

    /**
     * @notice Update voting delay
     * @param newVotingDelay New voting delay
     */
    function updateVotingDelay(uint256 newVotingDelay)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _updateVotingDelay(newVotingDelay);
    }

    /**
     * @notice Update voting period
     * @param newVotingPeriod New voting period
     */
    function updateVotingPeriod(uint256 newVotingPeriod)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _updateVotingPeriod(newVotingPeriod);
    }

    /**
     * @notice Update quorum numerator
     * @param newQuorumNumerator New quorum numerator
     */
    function updateQuorumNumerator(uint256 newQuorumNumerator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _updateQuorumNumerator(newQuorumNumerator);
    }

    /**
     * @notice Get proposal data
     * @param proposalId Proposal ID
     * @return Proposal data
     */
    function getProposalData(uint256 proposalId)
        external
        view
        returns (ProposalData memory)
    {
        return proposalData[proposalId];
    }

    /**
     * @notice Get DAO statistics
     * @return totalProposals Total proposals count
     * @return successfulProposals Successful proposals count
     * @return treasuryBalance Current treasury balance
     * @return totalVotingPower Total voting power used
     */
    function getDAOStats()
        external
        view
        returns (
            uint256 totalProposals,
            uint256 successfulProposals,
            uint256 treasuryBalance,
            uint256 totalVotingPower
        )
    {
        totalProposals = communityProposalsCount;
        successfulProposals = successfulProposalsCount;
        treasuryBalance = communityTreasury;
        totalVotingPower = totalVotingPowerUsed;
    }

    /**
     * @notice Get proposals by category
     * @param category Proposal category
     * @param offset Starting index
     * @param limit Number of proposals to return
     * @return Array of proposal IDs
     */
    function getProposalsByCategory(
        ProposalCategory category,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        // This would require additional storage to track proposals by category
        // For now, return empty array
        return new uint256[](0);
    }

    /**
     * @notice Check if user can create proposal
     * @param user User address
     * @return True if can create proposal
     */
    function canCreateProposal(address user) external view returns (bool) {
        return hasRole(PROPOSER_ROLE, user) || hasRole(DEFAULT_ADMIN_ROLE, user);
    }

    /**
     * @notice Get user voting power
     * @param user User address
     * @return Voting power
     */
    function getUserVotingPower(address user) external view returns (uint256) {
        return getVotes(user, block.number);
    }

    /**
     * @notice Emergency withdrawal (only admin)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);
        communityTreasury = 0;
    }

    // ============ Required Overrides ============

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, GovernorCompatibilityBravo) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}