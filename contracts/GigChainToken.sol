// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GigChainToken (GCH)
 * @notice Social token for GigChain decentralized professional network
 * @dev ERC20 with voting, snapshots, burning, and social features
 * 
 * Tokenomics:
 * - Max supply: 1 billion GCH
 * - Community rewards: 40%
 * - Team & Advisors: 20%
 * - Investors: 15%
 * - Ecosystem Development: 15%
 * - DAO Treasury: 5%
 * - Reserve: 5%
 * 
 * Social Features:
 * - Engagement rewards
 * - Content creation rewards
 * - Connection rewards
 * - Skill verification rewards
 * - DAO governance participation
 * - Staking for premium features
 */
contract GigChainToken is
    ERC20,
    ERC20Burnable,
    ERC20Snapshot,
    ERC20Votes,
    ERC20Permit,
    AccessControl,
    ReentrancyGuard
{
    // ============ Constants ============

    /// @notice Maximum token supply (1 billion GCH)
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    /// @notice Role for minting new tokens (only during initial distribution)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Role for creating snapshots
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");

    /// @notice Role for pausing transfers (emergency only)
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Role for social rewards
    bytes32 public constant REWARDER_ROLE = keccak256("REWARDER_ROLE");

    // ============ State Variables ============

    /// @notice Whether minting is permanently disabled
    bool public mintingFinalized;

    /// @notice Maximum transfer amount (anti-whale, 0 = disabled)
    uint256 public maxTransferAmount;

    /// @notice Mapping of addresses exempt from max transfer limit
    mapping(address => bool) public isExemptFromLimit;

    /// @notice Social rewards pool
    uint256 public socialRewardsPool;

    /// @notice Total rewards distributed
    uint256 public totalRewardsDistributed;

    /// @notice User staking data
    mapping(address => uint256) public userStake;
    mapping(address => uint256) public stakeTimestamp;
    mapping(address => uint256) public stakeRewards;

    /// @notice Staking parameters
    uint256 public stakingRewardRate = 10; // 10% APY
    uint256 public minimumStake = 1000e18; // 1000 GCH minimum stake
    uint256 public stakingLockPeriod = 30 days; // 30 days lock period

    // ============ Events ============

    event MintingFinalized();
    event MaxTransferAmountUpdated(uint256 newAmount);
    event ExemptionUpdated(address indexed account, bool isExempt);
    event SocialRewardDistributed(address indexed user, uint256 amount, string reason);
    event UserStaked(address indexed user, uint256 amount, uint256 timestamp);
    event UserUnstaked(address indexed user, uint256 amount, uint256 rewards);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event SocialRewardsPoolUpdated(uint256 newAmount);

    // ============ Errors ============

    error MintingAlreadyFinalized();
    error MaxSupplyExceeded();
    error TransferAmountExceedsMaximum();
    error InsufficientStake();
    error StakeLocked();
    error NoStakeToClaim();

    /**
     * @notice Constructor
     * @param admin Address to grant admin role
     */
    constructor(address admin)
        ERC20("GigChain Token", "GCH")
        ERC20Permit("GigChain Token")
    {
        require(admin != address(0), "Admin cannot be zero address");

        // Grant roles to admin
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(SNAPSHOT_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(REWARDER_ROLE, admin);

        // Set initial max transfer (1M GCH, can be changed)
        maxTransferAmount = 1_000_000e18;

        // Exempt admin and this contract from limits
        isExemptFromLimit[admin] = true;
        isExemptFromLimit[address(this)] = true;

        // Initialize social rewards pool (40% of max supply)
        socialRewardsPool = (MAX_SUPPLY * 40) / 100;
    }

    /**
     * @notice Mint new tokens (only during initial distribution)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        if (mintingFinalized) revert MintingAlreadyFinalized();
        if (totalSupply() + amount > MAX_SUPPLY) revert MaxSupplyExceeded();

        _mint(to, amount);
    }

    /**
     * @notice Permanently disable minting (call after initial distribution)
     */
    function finalizeMinting() public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (mintingFinalized) revert MintingAlreadyFinalized();
        mintingFinalized = true;
        emit MintingFinalized();
    }

    /**
     * @notice Create a snapshot of token balances
     * @return Snapshot ID
     */
    function snapshot() public onlyRole(SNAPSHOT_ROLE) returns (uint256) {
        return _snapshot();
    }

    /**
     * @notice Update maximum transfer amount (anti-whale)
     * @param newAmount New maximum (0 to disable)
     */
    function setMaxTransferAmount(uint256 newAmount)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        maxTransferAmount = newAmount;
        emit MaxTransferAmountUpdated(newAmount);
    }

    /**
     * @notice Update exemption status for an address
     * @param account Address to update
     * @param exempt Whether to exempt from limits
     */
    function setExemption(address account, bool exempt)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        isExemptFromLimit[account] = exempt;
        emit ExemptionUpdated(account, exempt);
    }

    /**
     * @notice Distribute social rewards
     * @param user User address
     * @param amount Reward amount
     * @param reason Reward reason
     */
    function distributeSocialReward(
        address user,
        uint256 amount,
        string memory reason
    ) external onlyRole(REWARDER_ROLE) nonReentrant {
        require(socialRewardsPool >= amount, "Insufficient rewards pool");
        require(amount > 0, "Amount must be greater than 0");

        socialRewardsPool -= amount;
        totalRewardsDistributed += amount;

        _mint(user, amount);

        emit SocialRewardDistributed(user, amount, reason);
    }

    /**
     * @notice Stake tokens for rewards
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= minimumStake, "Amount below minimum stake");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Claim existing rewards before staking more
        if (userStake[msg.sender] > 0) {
            claimStakingRewards();
        }

        _transfer(msg.sender, address(this), amount);
        userStake[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;

        emit UserStaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Unstake tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(userStake[msg.sender] >= amount, "Insufficient stake");
        require(
            block.timestamp >= stakeTimestamp[msg.sender] + stakingLockPeriod,
            "Stake is locked"
        );

        // Claim rewards first
        claimStakingRewards();

        userStake[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);

        emit UserUnstaked(msg.sender, amount, stakeRewards[msg.sender]);
    }

    /**
     * @notice Claim staking rewards
     */
    function claimStakingRewards() public nonReentrant {
        require(userStake[msg.sender] > 0, "No stake to claim");

        uint256 rewards = calculateStakingRewards(msg.sender);
        if (rewards > 0) {
            stakeRewards[msg.sender] = 0;
            stakeTimestamp[msg.sender] = block.timestamp;

            _mint(msg.sender, rewards);

            emit StakingRewardsClaimed(msg.sender, rewards);
        }
    }

    /**
     * @notice Calculate staking rewards for a user
     * @param user User address
     * @return Rewards amount
     */
    function calculateStakingRewards(address user) public view returns (uint256) {
        if (userStake[user] == 0) return 0;

        uint256 stakingDuration = block.timestamp - stakeTimestamp[user];
        uint256 annualReward = (userStake[user] * stakingRewardRate) / 100;
        uint256 rewards = (annualReward * stakingDuration) / 365 days;

        return rewards + stakeRewards[user];
    }

    /**
     * @notice Update social rewards pool
     * @param newAmount New pool amount
     */
    function updateSocialRewardsPool(uint256 newAmount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        socialRewardsPool = newAmount;
        emit SocialRewardsPoolUpdated(newAmount);
    }

    /**
     * @notice Update staking parameters
     * @param _stakingRewardRate New reward rate (APY %)
     * @param _minimumStake New minimum stake amount
     * @param _stakingLockPeriod New lock period
     */
    function updateStakingParameters(
        uint256 _stakingRewardRate,
        uint256 _minimumStake,
        uint256 _stakingLockPeriod
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingRewardRate = _stakingRewardRate;
        minimumStake = _minimumStake;
        stakingLockPeriod = _stakingLockPeriod;
    }

    // ============ Internal Functions ============

    /**
     * @notice Hook called before any token transfer
     * @dev Enforces max transfer amount if enabled
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        // Check max transfer amount (skip for minting/burning)
        if (
            maxTransferAmount > 0 &&
            from != address(0) &&
            to != address(0) &&
            !isExemptFromLimit[from] &&
            !isExemptFromLimit[to]
        ) {
            if (amount > maxTransferAmount) {
                revert TransferAmountExceedsMaximum();
            }
        }
    }

    // ============ Required Overrides ============

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot, ERC20Votes) {
        _beforeTokenTransfer(from, to, amount);
        super._update(from, to, amount);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    // ============ View Functions ============

    /**
     * @notice Get user staking info
     * @param user User address
     * @return stakeAmount Current stake amount
     * @return stakeTime Stake timestamp
     * @return pendingRewards Pending rewards
     * @return isLocked Whether stake is locked
     */
    function getUserStakeInfo(address user)
        external
        view
        returns (
            uint256 stakeAmount,
            uint256 stakeTime,
            uint256 pendingRewards,
            bool isLocked
        )
    {
        stakeAmount = userStake[user];
        stakeTime = stakeTimestamp[user];
        pendingRewards = calculateStakingRewards(user);
        isLocked = block.timestamp < stakeTime + stakingLockPeriod;
    }

    /**
     * @notice Get social rewards info
     * @return poolAmount Current pool amount
     * @return totalDistributed Total rewards distributed
     * @return remainingPool Remaining pool amount
     */
    function getSocialRewardsInfo()
        external
        view
        returns (
            uint256 poolAmount,
            uint256 totalDistributed,
            uint256 remainingPool
        )
    {
        poolAmount = socialRewardsPool;
        totalDistributed = totalRewardsDistributed;
        remainingPool = socialRewardsPool;
    }
}