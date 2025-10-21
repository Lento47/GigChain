// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./GigChainToken.sol";

/**
 * @title GigChainDeFi
 * @notice DeFi integration for GigChain including staking, yield farming, and liquidity mining
 * @dev Handles various DeFi strategies and reward mechanisms
 * 
 * Features:
 * - GCH token staking with flexible lock periods
 * - Yield farming with multiple reward tokens
 * - Liquidity mining for LP token holders
 * - Governance staking for voting power
 * - Social staking for reputation rewards
 * - Automated compound rewards
 */
contract GigChainDeFi is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Staking pool types
    enum PoolType {
        Standard,       // 0 - Basic staking
        Governance,     // 1 - Governance staking
        Social,         // 2 - Social reputation staking
        Liquidity,      // 3 - LP token staking
        Yield           // 4 - Yield farming
    }
    
    // Staking pool
    struct StakingPool {
        uint256 poolId;
        PoolType poolType;
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 totalStaked;
        uint256 rewardRate; // tokens per second
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        uint256 totalRewards;
        uint256 lockPeriod; // in seconds
        bool isActive;
        uint256 createdAt;
    }
    
    // User staking position
    struct StakingPosition {
        uint256 poolId;
        uint256 amount;
        uint256 rewardDebt;
        uint256 stakedAt;
        uint256 unlockTime;
        bool isActive;
    }
    
    // Liquidity mining position
    struct LiquidityPosition {
        address lpToken;
        uint256 amount;
        uint256 rewardDebt;
        uint256 stakedAt;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => StakingPool) public stakingPools;
    mapping(address => mapping(uint256 => StakingPosition)) public userPositions;
    mapping(address => uint256[]) public userPoolIds;
    mapping(address => LiquidityPosition[]) public userLiquidityPositions;
    mapping(address => uint256) public userTotalStaked;
    mapping(address => uint256) public userTotalRewards;
    
    // Counters
    uint256 private _poolCounter;
    
    // State variables
    GigChainToken public clpToken;
    IERC20 public usdcToken;
    IERC20 public wethToken;
    
    // Reward distribution
    uint256 public totalRewardsDistributed;
    uint256 public totalStaked;
    
    // Events
    event PoolCreated(uint256 indexed poolId, PoolType poolType, address stakingToken, address rewardToken);
    event Staked(uint256 indexed poolId, address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(uint256 indexed poolId, address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(uint256 indexed poolId, address indexed user, uint256 amount);
    event LiquidityStaked(address indexed user, address lpToken, uint256 amount);
    event LiquidityUnstaked(address indexed user, address lpToken, uint256 amount);
    event PoolUpdated(uint256 indexed poolId, uint256 newRewardRate);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    // Modifiers
    modifier poolExists(uint256 poolId) {
        require(poolId < _poolCounter, "Pool does not exist");
        _;
    }
    
    modifier poolActive(uint256 poolId) {
        require(stakingPools[poolId].isActive, "Pool not active");
        _;
    }
    
    modifier updateRewards(uint256 poolId) {
        StakingPool storage pool = stakingPools[poolId];
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 rewards = timeElapsed * pool.rewardRate;
            pool.rewardPerTokenStored += (rewards * 1e18) / pool.totalStaked;
            pool.totalRewards += rewards;
        }
        pool.lastUpdateTime = block.timestamp;
        _;
    }
    
    constructor(
        address _clpToken,
        address _usdcToken,
        address _wethToken
    ) Ownable(msg.sender) {
        clpToken = GigChainToken(_clpToken);
        usdcToken = IERC20(_usdcToken);
        wethToken = IERC20(_wethToken);
    }
    
    /**
     * @notice Create a new staking pool
     * @param poolType Type of staking pool
     * @param stakingToken Token to stake
     * @param rewardToken Token for rewards
     * @param rewardRate Reward rate per second
     * @param lockPeriod Lock period in seconds
     */
    function createStakingPool(
        PoolType poolType,
        address stakingToken,
        address rewardToken,
        uint256 rewardRate,
        uint256 lockPeriod
    ) external onlyOwner {
        require(stakingToken != address(0), "Invalid staking token");
        require(rewardToken != address(0), "Invalid reward token");
        require(rewardRate > 0, "Invalid reward rate");
        
        uint256 poolId = _poolCounter;
        _poolCounter++;
        
        StakingPool storage pool = stakingPools[poolId];
        pool.poolId = poolId;
        pool.poolType = poolType;
        pool.stakingToken = IERC20(stakingToken);
        pool.rewardToken = IERC20(rewardToken);
        pool.totalStaked = 0;
        pool.rewardRate = rewardRate;
        pool.lastUpdateTime = block.timestamp;
        pool.rewardPerTokenStored = 0;
        pool.totalRewards = 0;
        pool.lockPeriod = lockPeriod;
        pool.isActive = true;
        pool.createdAt = block.timestamp;
        
        emit PoolCreated(poolId, poolType, stakingToken, rewardToken);
    }
    
    /**
     * @notice Stake tokens in a pool
     * @param poolId Pool ID
     * @param amount Amount to stake
     */
    function stake(uint256 poolId, uint256 amount) external nonReentrant poolExists(poolId) poolActive(poolId) updateRewards(poolId) {
        require(amount > 0, "Amount must be greater than 0");
        
        StakingPool storage pool = stakingPools[poolId];
        StakingPosition storage position = userPositions[msg.sender][poolId];
        
        // Transfer tokens from user
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user position
        if (position.isActive) {
            // Claim existing rewards first
            uint256 pendingRewards = _calculatePendingRewards(msg.sender, poolId);
            if (pendingRewards > 0) {
                position.rewardDebt += pendingRewards;
                userTotalRewards[msg.sender] += pendingRewards;
            }
            
            position.amount += amount;
            position.rewardDebt += (amount * pool.rewardPerTokenStored) / 1e18;
        } else {
            position.poolId = poolId;
            position.amount = amount;
            position.rewardDebt = (amount * pool.rewardPerTokenStored) / 1e18;
            position.stakedAt = block.timestamp;
            position.unlockTime = block.timestamp + pool.lockPeriod;
            position.isActive = true;
            
            userPoolIds[msg.sender].push(poolId);
        }
        
        // Update pool
        pool.totalStaked += amount;
        totalStaked += amount;
        userTotalStaked[msg.sender] += amount;
        
        emit Staked(poolId, msg.sender, amount, position.unlockTime);
    }
    
    /**
     * @notice Unstake tokens from a pool
     * @param poolId Pool ID
     * @param amount Amount to unstake
     */
    function unstake(uint256 poolId, uint256 amount) external nonReentrant poolExists(poolId) updateRewards(poolId) {
        StakingPosition storage position = userPositions[msg.sender][poolId];
        require(position.isActive, "No active position");
        require(position.amount >= amount, "Insufficient staked amount");
        require(block.timestamp >= position.unlockTime, "Position still locked");
        
        StakingPool storage pool = stakingPools[poolId];
        
        // Calculate and claim rewards
        uint256 pendingRewards = _calculatePendingRewards(msg.sender, poolId);
        uint256 totalRewards = pendingRewards + position.rewardDebt;
        
        // Update position
        position.amount -= amount;
        position.rewardDebt = (position.amount * pool.rewardPerTokenStored) / 1e18;
        
        if (position.amount == 0) {
            position.isActive = false;
        }
        
        // Update pool
        pool.totalStaked -= amount;
        totalStaked -= amount;
        userTotalStaked[msg.sender] -= amount;
        
        // Transfer tokens back to user
        pool.stakingToken.safeTransfer(msg.sender, amount);
        
        // Transfer rewards if any
        if (totalRewards > 0) {
            pool.rewardToken.safeTransfer(msg.sender, totalRewards);
            userTotalRewards[msg.sender] += totalRewards;
            totalRewardsDistributed += totalRewards;
        }
        
        emit Unstaked(poolId, msg.sender, amount, totalRewards);
    }
    
    /**
     * @notice Claim rewards from a pool
     * @param poolId Pool ID
     */
    function claimRewards(uint256 poolId) external nonReentrant poolExists(poolId) updateRewards(poolId) {
        StakingPosition storage position = userPositions[msg.sender][poolId];
        require(position.isActive, "No active position");
        
        uint256 pendingRewards = _calculatePendingRewards(msg.sender, poolId);
        require(pendingRewards > 0, "No rewards to claim");
        
        StakingPool storage pool = stakingPools[poolId];
        
        // Update position
        position.rewardDebt = (position.amount * pool.rewardPerTokenStored) / 1e18;
        
        // Transfer rewards
        pool.rewardToken.safeTransfer(msg.sender, pendingRewards);
        userTotalRewards[msg.sender] += pendingRewards;
        totalRewardsDistributed += pendingRewards;
        
        emit RewardsClaimed(poolId, msg.sender, pendingRewards);
    }
    
    /**
     * @notice Stake LP tokens for liquidity mining
     * @param lpToken LP token address
     * @param amount Amount to stake
     */
    function stakeLiquidity(address lpToken, uint256 amount) external nonReentrant {
        require(lpToken != address(0), "Invalid LP token");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer LP tokens from user
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create or update position
        bool found = false;
        for (uint256 i = 0; i < userLiquidityPositions[msg.sender].length; i++) {
            if (userLiquidityPositions[msg.sender][i].lpToken == lpToken) {
                userLiquidityPositions[msg.sender][i].amount += amount;
                found = true;
                break;
            }
        }
        
        if (!found) {
            userLiquidityPositions[msg.sender].push(LiquidityPosition({
                lpToken: lpToken,
                amount: amount,
                rewardDebt: 0,
                stakedAt: block.timestamp,
                isActive: true
            }));
        }
        
        emit LiquidityStaked(msg.sender, lpToken, amount);
    }
    
    /**
     * @notice Unstake LP tokens
     * @param lpToken LP token address
     * @param amount Amount to unstake
     */
    function unstakeLiquidity(address lpToken, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Find position
        for (uint256 i = 0; i < userLiquidityPositions[msg.sender].length; i++) {
            LiquidityPosition storage position = userLiquidityPositions[msg.sender][i];
            if (position.lpToken == lpToken && position.isActive) {
                require(position.amount >= amount, "Insufficient staked amount");
                
                position.amount -= amount;
                if (position.amount == 0) {
                    position.isActive = false;
                }
                
                // Transfer LP tokens back to user
                IERC20(lpToken).safeTransfer(msg.sender, amount);
                
                emit LiquidityUnstaked(msg.sender, lpToken, amount);
                break;
            }
        }
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param user User address
     * @param poolId Pool ID
     * @return Pending rewards
     */
    function calculatePendingRewards(address user, uint256 poolId) external view returns (uint256) {
        return _calculatePendingRewards(user, poolId);
    }
    
    /**
     * @notice Get user staking positions
     * @param user User address
     * @return Array of pool IDs
     */
    function getUserPoolIds(address user) external view returns (uint256[] memory) {
        return userPoolIds[user];
    }
    
    /**
     * @notice Get user liquidity positions
     * @param user User address
     * @return Array of liquidity positions
     */
    function getUserLiquidityPositions(address user) external view returns (LiquidityPosition[] memory) {
        return userLiquidityPositions[user];
    }
    
    /**
     * @notice Get pool information
     * @param poolId Pool ID
     * @return Pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (StakingPool memory) {
        return stakingPools[poolId];
    }
    
    /**
     * @notice Update pool reward rate
     * @param poolId Pool ID
     * @param newRewardRate New reward rate
     */
    function updatePoolRewardRate(uint256 poolId, uint256 newRewardRate) external onlyOwner poolExists(poolId) {
        stakingPools[poolId].rewardRate = newRewardRate;
        emit PoolUpdated(poolId, newRewardRate);
    }
    
    /**
     * @notice Toggle pool active status
     * @param poolId Pool ID
     */
    function togglePool(uint256 poolId) external onlyOwner poolExists(poolId) {
        stakingPools[poolId].isActive = !stakingPools[poolId].isActive;
    }
    
    /**
     * @notice Emergency withdraw (only for inactive pools)
     * @param poolId Pool ID
     */
    function emergencyWithdraw(uint256 poolId) external nonReentrant poolExists(poolId) {
        StakingPosition storage position = userPositions[msg.sender][poolId];
        require(position.isActive, "No active position");
        require(!stakingPools[poolId].isActive, "Pool is still active");
        
        uint256 amount = position.amount;
        position.amount = 0;
        position.isActive = false;
        
        StakingPool storage pool = stakingPools[poolId];
        pool.totalStaked -= amount;
        totalStaked -= amount;
        userTotalStaked[msg.sender] -= amount;
        
        pool.stakingToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    /**
     * @notice Calculate pending rewards (internal)
     * @param user User address
     * @param poolId Pool ID
     * @return Pending rewards
     */
    function _calculatePendingRewards(address user, uint256 poolId) internal view returns (uint256) {
        StakingPosition memory position = userPositions[user][poolId];
        if (!position.isActive || position.amount == 0) {
            return 0;
        }
        
        StakingPool memory pool = stakingPools[poolId];
        uint256 currentRewardPerToken = pool.rewardPerTokenStored;
        
        if (pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTime;
            uint256 rewards = timeElapsed * pool.rewardRate;
            currentRewardPerToken += (rewards * 1e18) / pool.totalStaked;
        }
        
        uint256 userRewardPerToken = (position.amount * currentRewardPerToken) / 1e18;
        return userRewardPerToken - position.rewardDebt;
    }
    
    /**
     * @notice Get total pools count
     * @return Total number of pools
     */
    function getTotalPools() external view returns (uint256) {
        return _poolCounter;
    }
    
    /**
     * @notice Get platform statistics
     * @return totalStaked Total staked amount
     * @return totalRewards Total rewards distributed
     * @return totalPools Total number of pools
     */
    function getPlatformStats() external view returns (uint256 totalStaked, uint256 totalRewards, uint256 totalPools) {
        return (totalStaked, totalRewardsDistributed, _poolCounter);
    }
}