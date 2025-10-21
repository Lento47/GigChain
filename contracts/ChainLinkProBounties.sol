// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ChainLinkProProfile.sol";
import "./ChainLinkProConnections.sol";

/**
 * @title ChainLinkProBounties
 * @notice Bounty and referral system for ChainLinkPro
 * @dev Handles skill bounties, referrals, and token rewards
 */
contract ChainLinkProBounties is Ownable, ReentrancyGuard {
    
    // Bounty status
    enum BountyStatus {
        Active,         // 0
        Completed,      // 1
        Cancelled,      // 2
        Expired         // 3
    }
    
    // Bounty type
    enum BountyType {
        SkillShowcase,  // 0
        Referral,       // 1
        Project,        // 2
        Achievement,    // 3
        Community       // 4
    }
    
    // Bounty structure
    struct Bounty {
        uint256 bountyId;
        address creator;
        string title;
        string description;
        BountyType bountyType;
        string[] requiredSkills;
        uint256 reward; // in wei
        uint256 deadline;
        BountyStatus status;
        address winner;
        uint256 createdAt;
        uint256 completedAt;
        string[] submissions;
        mapping(address => bool) hasSubmitted;
    }
    
    // Referral structure
    struct Referral {
        uint256 referralId;
        address referrer;
        address referred;
        string skill;
        uint256 reward;
        bool isCompleted;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // Skill verification
    struct SkillVerification {
        address user;
        string skill;
        string proof;
        address verifier;
        bool isVerified;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Referral) public referrals;
    mapping(address => uint256[]) public userBounties;
    mapping(address => uint256[]) public userReferrals;
    mapping(address => SkillVerification[]) public userSkillVerifications;
    mapping(string => uint256[]) public skillBounties;
    mapping(address => mapping(string => bool)) public verifiedSkills;
    
    // Counters
    uint256 private _bountyCounter;
    uint256 private _referralCounter;
    
    // State variables
    ChainLinkProProfile public profileContract;
    ChainLinkProConnections public connectionsContract;
    IERC20 public gigsToken;
    
    // Bounty fees (in basis points, 100 = 1%)
    uint256 public bountyFee = 250; // 2.5%
    uint256 public referralFee = 100; // 1%
    
    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed creator, BountyType bountyType, uint256 reward);
    event BountySubmitted(uint256 indexed bountyId, address indexed submitter, string submission);
    event BountyCompleted(uint256 indexed bountyId, address indexed winner, uint256 reward);
    event BountyCancelled(uint256 indexed bountyId, address indexed creator);
    event ReferralCreated(uint256 indexed referralId, address indexed referrer, address indexed referred, string skill);
    event ReferralCompleted(uint256 indexed referralId, address indexed referred, uint256 reward);
    event SkillVerified(address indexed user, string skill, address indexed verifier);
    event BountyFeeUpdated(uint256 newFee);
    event ReferralFeeUpdated(uint256 newFee);
    
    // Modifiers
    modifier onlyProfileOwner() {
        require(profileContract.hasProfile(msg.sender), "Must have ChainLinkPro profile");
        _;
    }
    
    modifier bountyExists(uint256 bountyId) {
        require(bountyId < _bountyCounter, "Bounty does not exist");
        _;
    }
    
    modifier referralExists(uint256 referralId) {
        require(referralId < _referralCounter, "Referral does not exist");
        _;
    }
    
    constructor(
        address _profileContract,
        address _connectionsContract,
        address _gigsToken
    ) Ownable(msg.sender) {
        profileContract = ChainLinkProProfile(_profileContract);
        connectionsContract = ChainLinkProConnections(_connectionsContract);
        gigsToken = IERC20(_gigsToken);
    }
    
    /**
     * @notice Create a new bounty
     * @param title Bounty title
     * @param description Bounty description
     * @param bountyType Type of bounty
     * @param requiredSkills Required skills
     * @param reward Reward amount in wei
     * @param deadline Deadline timestamp
     */
    function createBounty(
        string memory title,
        string memory description,
        BountyType bountyType,
        string[] memory requiredSkills,
        uint256 reward,
        uint256 deadline
    ) external payable onlyProfileOwner nonReentrant {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(reward > 0, "Reward must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(msg.value >= reward, "Insufficient payment");
        
        uint256 bountyId = _bountyCounter;
        _bountyCounter++;
        
        Bounty storage bounty = bounties[bountyId];
        bounty.bountyId = bountyId;
        bounty.creator = msg.sender;
        bounty.title = title;
        bounty.description = description;
        bounty.bountyType = bountyType;
        bounty.requiredSkills = requiredSkills;
        bounty.reward = reward;
        bounty.deadline = deadline;
        bounty.status = BountyStatus.Active;
        bounty.createdAt = block.timestamp;
        
        userBounties[msg.sender].push(bountyId);
        
        // Add to skill mappings
        for (uint256 i = 0; i < requiredSkills.length; i++) {
            skillBounties[requiredSkills[i]].push(bountyId);
        }
        
        emit BountyCreated(bountyId, msg.sender, bountyType, reward);
    }
    
    /**
     * @notice Submit to a bounty
     * @param bountyId Bounty ID
     * @param submission Submission content
     */
    function submitToBounty(uint256 bountyId, string memory submission) external onlyProfileOwner bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        require(block.timestamp <= bounty.deadline, "Bounty expired");
        require(!bounty.hasSubmitted[msg.sender], "Already submitted");
        require(bytes(submission).length > 0, "Submission cannot be empty");
        
        bounty.submissions.push(submission);
        bounty.hasSubmitted[msg.sender] = true;
        
        emit BountySubmitted(bountyId, msg.sender, submission);
    }
    
    /**
     * @notice Complete a bounty (only creator)
     * @param bountyId Bounty ID
     * @param winner Address of the winner
     */
    function completeBounty(uint256 bountyId, address winner) external bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator == msg.sender, "Not bounty creator");
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        require(bounty.hasSubmitted[winner], "Winner must have submitted");
        require(profileContract.hasProfile(winner), "Winner must have profile");
        
        bounty.status = BountyStatus.Completed;
        bounty.winner = winner;
        bounty.completedAt = block.timestamp;
        
        // Calculate fee
        uint256 fee = (bounty.reward * bountyFee) / 10000;
        uint256 winnerReward = bounty.reward - fee;
        
        // Transfer reward to winner
        payable(winner).transfer(winnerReward);
        
        // Transfer fee to contract owner
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }
        
        emit BountyCompleted(bountyId, winner, winnerReward);
    }
    
    /**
     * @notice Cancel a bounty
     * @param bountyId Bounty ID
     */
    function cancelBounty(uint256 bountyId) external bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator == msg.sender, "Not bounty creator");
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        
        bounty.status = BountyStatus.Cancelled;
        
        // Refund creator
        payable(bounty.creator).transfer(bounty.reward);
        
        emit BountyCancelled(bountyId, msg.sender);
    }
    
    /**
     * @notice Create a referral
     * @param referred Address being referred
     * @param skill Skill being referred for
     * @param reward Referral reward in wei
     */
    function createReferral(
        address referred,
        string memory skill,
        uint256 reward
    ) external payable onlyProfileOwner nonReentrant {
        require(referred != msg.sender, "Cannot refer self");
        require(profileContract.hasProfile(referred), "Referred must have profile");
        require(bytes(skill).length > 0, "Skill cannot be empty");
        require(reward > 0, "Reward must be greater than 0");
        require(msg.value >= reward, "Insufficient payment");
        
        uint256 referralId = _referralCounter;
        _referralCounter++;
        
        Referral memory referral = Referral({
            referralId: referralId,
            referrer: msg.sender,
            referred: referred,
            skill: skill,
            reward: reward,
            isCompleted: false,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        referrals[referralId] = referral;
        userReferrals[msg.sender].push(referralId);
        userReferrals[referred].push(referralId);
        
        emit ReferralCreated(referralId, msg.sender, referred, skill);
    }
    
    /**
     * @notice Complete a referral
     * @param referralId Referral ID
     */
    function completeReferral(uint256 referralId) external referralExists(referralId) {
        Referral storage referral = referrals[referralId];
        require(referral.referred == msg.sender, "Not the referred user");
        require(!referral.isCompleted, "Referral already completed");
        
        referral.isCompleted = true;
        referral.completedAt = block.timestamp;
        
        // Calculate fee
        uint256 fee = (referral.reward * referralFee) / 10000;
        uint256 winnerReward = referral.reward - fee;
        
        // Transfer reward to referred user
        payable(referral.referred).transfer(winnerReward);
        
        // Transfer fee to contract owner
        if (fee > 0) {
            payable(owner()).transfer(fee);
        }
        
        emit ReferralCompleted(referralId, referral.referred, winnerReward);
    }
    
    /**
     * @notice Verify a skill
     * @param user User address
     * @param skill Skill to verify
     * @param proof Proof of skill
     */
    function verifySkill(
        address user,
        string memory skill,
        string memory proof
    ) external onlyProfileOwner {
        require(profileContract.hasProfile(user), "User must have profile");
        require(bytes(skill).length > 0, "Skill cannot be empty");
        require(bytes(proof).length > 0, "Proof cannot be empty");
        
        SkillVerification memory verification = SkillVerification({
            user: user,
            skill: skill,
            proof: proof,
            verifier: msg.sender,
            isVerified: true,
            timestamp: block.timestamp
        });
        
        userSkillVerifications[user].push(verification);
        verifiedSkills[user][skill] = true;
        
        emit SkillVerified(user, skill, msg.sender);
    }
    
    /**
     * @notice Get user bounties
     * @param user User address
     * @return Array of bounty IDs
     */
    function getUserBounties(address user) external view returns (uint256[] memory) {
        return userBounties[user];
    }
    
    /**
     * @notice Get user referrals
     * @param user User address
     * @return Array of referral IDs
     */
    function getUserReferrals(address user) external view returns (uint256[] memory) {
        return userReferrals[user];
    }
    
    /**
     * @notice Get skill bounties
     * @param skill Skill name
     * @return Array of bounty IDs
     */
    function getSkillBounties(string memory skill) external view returns (uint256[] memory) {
        return skillBounties[skill];
    }
    
    /**
     * @notice Get user skill verifications
     * @param user User address
     * @return Array of skill verifications
     */
    function getUserSkillVerifications(address user) external view returns (SkillVerification[] memory) {
        return userSkillVerifications[user];
    }
    
    /**
     * @notice Check if user has verified skill
     * @param user User address
     * @param skill Skill name
     * @return True if verified
     */
    function hasVerifiedSkill(address user, string memory skill) external view returns (bool) {
        return verifiedSkills[user][skill];
    }
    
    /**
     * @notice Get active bounties
     * @return Array of active bounty IDs
     */
    function getActiveBounties() external view returns (uint256[] memory) {
        uint256 totalBounties = _bountyCounter;
        uint256 activeCount = 0;
        
        // Count active bounties
        for (uint256 i = 0; i < totalBounties; i++) {
            if (bounties[i].status == BountyStatus.Active && block.timestamp <= bounties[i].deadline) {
                activeCount++;
            }
        }
        
        // Create array with active bounties
        uint256[] memory activeBounties = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalBounties; i++) {
            if (bounties[i].status == BountyStatus.Active && block.timestamp <= bounties[i].deadline) {
                activeBounties[index] = i;
                index++;
            }
        }
        
        return activeBounties;
    }
    
    /**
     * @notice Update bounty fee
     * @param newFee New fee in basis points
     */
    function updateBountyFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        bountyFee = newFee;
        emit BountyFeeUpdated(newFee);
    }
    
    /**
     * @notice Update referral fee
     * @param newFee New fee in basis points
     */
    function updateReferralFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        referralFee = newFee;
        emit ReferralFeeUpdated(newFee);
    }
    
    /**
     * @notice Update profile contract address
     * @param _profileContract New profile contract address
     */
    function updateProfileContract(address _profileContract) external onlyOwner {
        require(_profileContract != address(0), "Invalid address");
        profileContract = ChainLinkProProfile(_profileContract);
    }
    
    /**
     * @notice Update connections contract address
     * @param _connectionsContract New connections contract address
     */
    function updateConnectionsContract(address _connectionsContract) external onlyOwner {
        require(_connectionsContract != address(0), "Invalid address");
        connectionsContract = ChainLinkProConnections(_connectionsContract);
    }
    
    /**
     * @notice Update GIGS token address
     * @param _gigsToken New token address
     */
    function updateGigsToken(address _gigsToken) external onlyOwner {
        require(_gigsToken != address(0), "Invalid address");
        gigsToken = IERC20(_gigsToken);
    }
    
    /**
     * @notice Get total bounties count
     * @return Total number of bounties
     */
    function getTotalBounties() external view returns (uint256) {
        return _bountyCounter;
    }
    
    /**
     * @notice Get total referrals count
     * @return Total number of referrals
     */
    function getTotalReferrals() external view returns (uint256) {
        return _referralCounter;
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}