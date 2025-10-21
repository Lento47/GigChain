// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./GigChainProfile.sol";

/**
 * @title GigChainConnections
 * @notice Manages professional connections and networking on GigChain
 * @dev Handles connection requests, approvals, and networking features
 */
contract GigChainConnections is Ownable, ReentrancyGuard {
    
    // Connection request status
    enum ConnectionStatus {
        Pending,    // 0
        Accepted,   // 1
        Rejected,   // 2
        Blocked     // 3
    }
    
    // Connection request
    struct ConnectionRequest {
        address from;
        address to;
        string message;
        uint256 timestamp;
        ConnectionStatus status;
        bool isActive;
    }
    
    // Professional recommendation
    struct Recommendation {
        address recommender;
        address recommended;
        string skill;
        string message;
        uint256 rating; // 1-5
        uint256 timestamp;
        bool isVerified;
    }
    
    // Endorsement for skills
    struct SkillEndorsement {
        address endorser;
        address endorsed;
        string skill;
        string message;
        uint256 timestamp;
        bool isVerified;
    }
    
    // Mappings
    mapping(address => mapping(address => ConnectionRequest)) public connectionRequests;
    mapping(address => address[]) public connections;
    mapping(address => mapping(address => bool)) public isConnected;
    mapping(address => mapping(address => bool)) public isBlocked;
    mapping(address => uint256) public connectionCount;
    
    // Recommendations and endorsements
    mapping(address => Recommendation[]) public userRecommendations;
    mapping(address => SkillEndorsement[]) public userEndorsements;
    mapping(address => mapping(string => uint256)) public skillEndorsementCount;
    
    // Events
    event ConnectionRequestSent(address indexed from, address indexed to, string message);
    event ConnectionRequestAccepted(address indexed from, address indexed to);
    event ConnectionRequestRejected(address indexed from, address indexed to);
    event ConnectionRemoved(address indexed from, address indexed to);
    event UserBlocked(address indexed blocker, address indexed blocked);
    event UserUnblocked(address indexed unblocker, address indexed unblocked);
    event RecommendationGiven(address indexed recommender, address indexed recommended, string skill, uint256 rating);
    event SkillEndorsed(address indexed endorser, address indexed endorsed, string skill);
    
    // Modifiers
    modifier onlyProfileOwner() {
        require(profileContract.hasProfile(msg.sender), "Must have GigChain profile");
        _;
    }
    
    modifier notBlocked(address user) {
        require(!isBlocked[msg.sender][user], "User is blocked");
        require(!isBlocked[user][msg.sender], "You are blocked by this user");
        _;
    }
    
    // State variables
    GigChainProfile public profileContract;
    
    constructor(address _profileContract) Ownable(msg.sender) {
        profileContract = GigChainProfile(_profileContract);
    }
    
    /**
     * @notice Send a connection request
     * @param to Address to connect with
     * @param message Connection message
     */
    function sendConnectionRequest(address to, string memory message) external onlyProfileOwner notBlocked(to) {
        require(to != msg.sender, "Cannot connect to self");
        require(profileContract.hasProfile(to), "Target must have profile");
        require(!isConnected[msg.sender][to], "Already connected");
        require(connectionRequests[msg.sender][to].from == address(0) || 
                connectionRequests[msg.sender][to].status == ConnectionStatus.Rejected, 
                "Connection request already exists");
        
        ConnectionRequest memory request = ConnectionRequest({
            from: msg.sender,
            to: to,
            message: message,
            timestamp: block.timestamp,
            status: ConnectionStatus.Pending,
            isActive: true
        });
        
        connectionRequests[msg.sender][to] = request;
        
        emit ConnectionRequestSent(msg.sender, to, message);
    }
    
    /**
     * @notice Accept a connection request
     * @param from Address that sent the request
     */
    function acceptConnectionRequest(address from) external onlyProfileOwner {
        require(connectionRequests[from][msg.sender].from == from, "No pending request");
        require(connectionRequests[from][msg.sender].status == ConnectionStatus.Pending, "Request not pending");
        
        // Update request status
        connectionRequests[from][msg.sender].status = ConnectionStatus.Accepted;
        
        // Add to connections
        connections[msg.sender].push(from);
        connections[from].push(msg.sender);
        
        // Update connection status
        isConnected[msg.sender][from] = true;
        isConnected[from][msg.sender] = true;
        
        // Update connection counts
        connectionCount[msg.sender]++;
        connectionCount[from]++;
        
        emit ConnectionRequestAccepted(from, msg.sender);
    }
    
    /**
     * @notice Reject a connection request
     * @param from Address that sent the request
     */
    function rejectConnectionRequest(address from) external onlyProfileOwner {
        require(connectionRequests[from][msg.sender].from == from, "No pending request");
        require(connectionRequests[from][msg.sender].status == ConnectionStatus.Pending, "Request not pending");
        
        connectionRequests[from][msg.sender].status = ConnectionStatus.Rejected;
        
        emit ConnectionRequestRejected(from, msg.sender);
    }
    
    /**
     * @notice Remove a connection
     * @param user Address to disconnect from
     */
    function removeConnection(address user) external onlyProfileOwner {
        require(isConnected[msg.sender][user], "Not connected");
        
        // Remove from connections array
        _removeFromArray(connections[msg.sender], user);
        _removeFromArray(connections[user], msg.sender);
        
        // Update connection status
        isConnected[msg.sender][user] = false;
        isConnected[user][msg.sender] = false;
        
        // Update connection counts
        if (connectionCount[msg.sender] > 0) {
            connectionCount[msg.sender]--;
        }
        if (connectionCount[user] > 0) {
            connectionCount[user]--;
        }
        
        emit ConnectionRemoved(msg.sender, user);
    }
    
    /**
     * @notice Block a user
     * @param user Address to block
     */
    function blockUser(address user) external onlyProfileOwner {
        require(user != msg.sender, "Cannot block self");
        require(profileContract.hasProfile(user), "User must have profile");
        
        isBlocked[msg.sender][user] = true;
        
        // Remove connection if exists
        if (isConnected[msg.sender][user]) {
            removeConnection(user);
        }
        
        emit UserBlocked(msg.sender, user);
    }
    
    /**
     * @notice Unblock a user
     * @param user Address to unblock
     */
    function unblockUser(address user) external onlyProfileOwner {
        require(isBlocked[msg.sender][user], "User not blocked");
        
        isBlocked[msg.sender][user] = false;
        
        emit UserUnblocked(msg.sender, user);
    }
    
    /**
     * @notice Give a professional recommendation
     * @param recommended Address being recommended
     * @param skill Skill being recommended for
     * @param message Recommendation message
     * @param rating Rating 1-5
     */
    function giveRecommendation(
        address recommended,
        string memory skill,
        string memory message,
        uint256 rating
    ) external onlyProfileOwner {
        require(isConnected[msg.sender][recommended], "Must be connected");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        require(bytes(skill).length > 0, "Skill cannot be empty");
        
        Recommendation memory recommendation = Recommendation({
            recommender: msg.sender,
            recommended: recommended,
            skill: skill,
            message: message,
            rating: rating,
            timestamp: block.timestamp,
            isVerified: false
        });
        
        userRecommendations[recommended].push(recommendation);
        
        emit RecommendationGiven(msg.sender, recommended, skill, rating);
    }
    
    /**
     * @notice Endorse a skill
     * @param endorsed Address being endorsed
     * @param skill Skill being endorsed
     * @param message Endorsement message
     */
    function endorseSkill(
        address endorsed,
        string memory skill,
        string memory message
    ) external onlyProfileOwner {
        require(isConnected[msg.sender][endorsed], "Must be connected");
        require(bytes(skill).length > 0, "Skill cannot be empty");
        
        SkillEndorsement memory endorsement = SkillEndorsement({
            endorser: msg.sender,
            endorsed: endorsed,
            skill: skill,
            message: message,
            timestamp: block.timestamp,
            isVerified: false
        });
        
        userEndorsements[endorsed].push(endorsement);
        skillEndorsementCount[endorsed][skill]++;
        
        emit SkillEndorsed(msg.sender, endorsed, skill);
    }
    
    /**
     * @notice Get user connections
     * @param user User address
     * @return Array of connected addresses
     */
    function getUserConnections(address user) external view returns (address[] memory) {
        return connections[user];
    }
    
    /**
     * @notice Get user recommendations
     * @param user User address
     * @return Array of recommendations
     */
    function getUserRecommendations(address user) external view returns (Recommendation[] memory) {
        return userRecommendations[user];
    }
    
    /**
     * @notice Get user skill endorsements
     * @param user User address
     * @return Array of skill endorsements
     */
    function getUserEndorsements(address user) external view returns (SkillEndorsement[] memory) {
        return userEndorsements[user];
    }
    
    /**
     * @notice Get skill endorsement count
     * @param user User address
     * @param skill Skill name
     * @return Number of endorsements for the skill
     */
    function getSkillEndorsementCount(address user, string memory skill) external view returns (uint256) {
        return skillEndorsementCount[user][skill];
    }
    
    /**
     * @notice Check if two users are connected
     * @param user1 First user
     * @param user2 Second user
     * @return True if connected
     */
    function areConnected(address user1, address user2) external view returns (bool) {
        return isConnected[user1][user2];
    }
    
    /**
     * @notice Get pending connection requests for a user
     * @param user User address
     * @return Array of pending requests
     */
    function getPendingRequests(address user) external view returns (ConnectionRequest[] memory) {
        uint256 totalRequests = 0;
        
        // Count pending requests
        for (uint256 i = 0; i < connections[user].length; i++) {
            address connectedUser = connections[user][i];
            if (connectionRequests[connectedUser][user].status == ConnectionStatus.Pending) {
                totalRequests++;
            }
        }
        
        // Create array with pending requests
        ConnectionRequest[] memory pendingRequests = new ConnectionRequest[](totalRequests);
        uint256 index = 0;
        
        for (uint256 i = 0; i < connections[user].length; i++) {
            address connectedUser = connections[user][i];
            if (connectionRequests[connectedUser][user].status == ConnectionStatus.Pending) {
                pendingRequests[index] = connectionRequests[connectedUser][user];
                index++;
            }
        }
        
        return pendingRequests;
    }
    
    /**
     * @notice Remove item from array
     */
    function _removeFromArray(address[] storage array, address item) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == item) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
    
    /**
     * @notice Update profile contract address
     * @param _profileContract New profile contract address
     */
    function updateProfileContract(address _profileContract) external onlyOwner {
        require(_profileContract != address(0), "Invalid address");
        profileContract = GigChainProfile(_profileContract);
    }
}