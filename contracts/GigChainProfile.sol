// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title GigChainProfile
 * @notice NFT representing professional profiles on GigChain
 * @dev Each professional gets a unique NFT with their skills, experience, and social data
 * 
 * Features:
 * - Professional profile as NFT
 * - Skills verification and tokenization
 * - Social connections on-chain
 * - Reputation and experience tracking
 * - Bounty and referral system integration
 * - Soulbound (non-transferable) profiles
 */
contract GigChainProfile is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    Counters.Counter private _tokenIdCounter;
    
    // Professional levels
    enum ProfessionalLevel {
        Junior,        // 0-2 years
        Mid,          // 2-5 years
        Senior,       // 5-10 years
        Lead,         // 10-15 years
        Principal,    // 15+ years
        Expert        // Industry recognized expert
    }
    
    // Professional profile data
    struct Profile {
        string name;
        string title;
        string bio;
        string location;
        string email;
        string website;
        string[] skills;
        string[] socialLinks;
        uint256 experienceYears;
        uint256 hourlyRate; // in wei
        uint256 totalEarned; // in wei
        uint256 projectsCompleted;
        uint256 connectionsCount;
        uint256 referralsGiven;
        uint256 referralsReceived;
        uint256 reputationScore;
        ProfessionalLevel level;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
    }
    
    // Connection system
    struct Connection {
        address user;
        address connectedTo;
        uint256 connectedAt;
        bool isActive;
        string message;
    }
    
    // Bounty system
    struct Bounty {
        uint256 bountyId;
        address creator;
        string title;
        string description;
        uint256 reward; // in wei
        string[] requiredSkills;
        uint256 deadline;
        bool isActive;
        address winner;
        uint256 createdAt;
    }
    
    // Mappings
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => Profile) public tokenIdToProfile;
    mapping(address => bool) public hasProfile;
    mapping(uint256 => Connection[]) public userConnections;
    mapping(address => mapping(address => bool)) public isConnected;
    mapping(uint256 => Bounty) public bounties;
    mapping(address => uint256[]) public userBounties;
    
    // Counters
    Counters.Counter private _bountyCounter;
    
    // Events
    event ProfileCreated(address indexed user, uint256 indexed tokenId, string name);
    event ProfileUpdated(uint256 indexed tokenId, string field, string value);
    event ConnectionMade(address indexed from, address indexed to, uint256 timestamp);
    event ConnectionRemoved(address indexed from, address indexed to);
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward);
    event BountyCompleted(uint256 indexed bountyId, address indexed winner, uint256 reward);
    event ReferralMade(address indexed referrer, address indexed referred, uint256 reward);
    event SkillVerified(uint256 indexed tokenId, string skill, bool verified);
    
    // Modifiers
    modifier onlyProfileOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not profile owner");
        _;
    }
    
    modifier profileExists(address user) {
        require(hasProfile[user], "Profile does not exist");
        _;
    }
    
    constructor() ERC721("GigChain Profile", "GCHP") Ownable(msg.sender) {}
    
    /**
     * @notice Create a new professional profile
     * @param name Professional name
     * @param title Professional title
     * @param bio Professional bio
     * @param location Location
     * @param email Contact email
     * @param skills Array of skills
     * @param experienceYears Years of experience
     * @param hourlyRate Hourly rate in wei
     */
    function createProfile(
        string memory name,
        string memory title,
        string memory bio,
        string memory location,
        string memory email,
        string[] memory skills,
        uint256 experienceYears,
        uint256 hourlyRate
    ) external returns (uint256) {
        require(!hasProfile[msg.sender], "Profile already exists");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(experienceYears <= 50, "Invalid experience years");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(msg.sender, tokenId);
        
        // Initialize profile
        Profile storage profile = tokenIdToProfile[tokenId];
        profile.name = name;
        profile.title = title;
        profile.bio = bio;
        profile.location = location;
        profile.email = email;
        profile.skills = skills;
        profile.experienceYears = experienceYears;
        profile.hourlyRate = hourlyRate;
        profile.totalEarned = 0;
        profile.projectsCompleted = 0;
        profile.connectionsCount = 0;
        profile.referralsGiven = 0;
        profile.referralsReceived = 0;
        profile.reputationScore = 50; // Start at neutral
        profile.level = _calculateLevel(experienceYears);
        profile.isVerified = false;
        profile.isActive = true;
        profile.createdAt = block.timestamp;
        profile.lastUpdated = block.timestamp;
        
        userToTokenId[msg.sender] = tokenId;
        hasProfile[msg.sender] = true;
        
        // Set initial metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileCreated(msg.sender, tokenId, name);
        
        return tokenId;
    }
    
    /**
     * @notice Update profile information
     * @param tokenId Profile token ID
     * @param field Field to update
     * @param value New value
     */
    function updateProfile(
        uint256 tokenId,
        string memory field,
        string memory value
    ) external onlyProfileOwner(tokenId) {
        Profile storage profile = tokenIdToProfile[tokenId];
        
        if (keccak256(bytes(field)) == keccak256("name")) {
            profile.name = value;
        } else if (keccak256(bytes(field)) == keccak256("title")) {
            profile.title = value;
        } else if (keccak256(bytes(field)) == keccak256("bio")) {
            profile.bio = value;
        } else if (keccak256(bytes(field)) == keccak256("location")) {
            profile.location = value;
        } else if (keccak256(bytes(field)) == keccak256("email")) {
            profile.email = value;
        } else if (keccak256(bytes(field)) == keccak256("website")) {
            profile.website = value;
        } else {
            revert("Invalid field");
        }
        
        profile.lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileUpdated(tokenId, field, value);
    }
    
    /**
     * @notice Add a skill to profile
     * @param tokenId Profile token ID
     * @param skill Skill to add
     */
    function addSkill(uint256 tokenId, string memory skill) external onlyProfileOwner(tokenId) {
        Profile storage profile = tokenIdToProfile[tokenId];
        profile.skills.push(skill);
        profile.lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileUpdated(tokenId, "skills", skill);
    }
    
    /**
     * @notice Add social link to profile
     * @param tokenId Profile token ID
     * @param socialLink Social media link
     */
    function addSocialLink(uint256 tokenId, string memory socialLink) external onlyProfileOwner(tokenId) {
        Profile storage profile = tokenIdToProfile[tokenId];
        profile.socialLinks.push(socialLink);
        profile.lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileUpdated(tokenId, "socialLinks", socialLink);
    }
    
    /**
     * @notice Connect with another professional
     * @param to Address to connect with
     * @param message Connection message
     */
    function connectWith(address to, string memory message) external profileExists(msg.sender) profileExists(to) {
        require(to != msg.sender, "Cannot connect to self");
        require(!isConnected[msg.sender][to], "Already connected");
        
        uint256 fromTokenId = userToTokenId[msg.sender];
        uint256 toTokenId = userToTokenId[to];
        
        // Create connection
        Connection memory newConnection = Connection({
            user: msg.sender,
            connectedTo: to,
            connectedAt: block.timestamp,
            isActive: true,
            message: message
        });
        
        userConnections[fromTokenId].push(newConnection);
        isConnected[msg.sender][to] = true;
        
        // Update connection counts
        tokenIdToProfile[fromTokenId].connectionsCount++;
        tokenIdToProfile[fromTokenId].lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(fromTokenId, _generateTokenURI(fromTokenId));
        
        emit ConnectionMade(msg.sender, to, block.timestamp);
    }
    
    /**
     * @notice Remove connection
     * @param to Address to disconnect from
     */
    function disconnectFrom(address to) external profileExists(msg.sender) {
        require(isConnected[msg.sender][to], "Not connected");
        
        uint256 fromTokenId = userToTokenId[msg.sender];
        
        // Find and deactivate connection
        for (uint256 i = 0; i < userConnections[fromTokenId].length; i++) {
            if (userConnections[fromTokenId][i].connectedTo == to) {
                userConnections[fromTokenId][i].isActive = false;
                break;
            }
        }
        
        isConnected[msg.sender][to] = false;
        
        // Update connection count
        if (tokenIdToProfile[fromTokenId].connectionsCount > 0) {
            tokenIdToProfile[fromTokenId].connectionsCount--;
        }
        tokenIdToProfile[fromTokenId].lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(fromTokenId, _generateTokenURI(fromTokenId));
        
        emit ConnectionRemoved(msg.sender, to);
    }
    
    /**
     * @notice Create a bounty for referrals
     * @param title Bounty title
     * @param description Bounty description
     * @param requiredSkills Required skills
     * @param reward Reward amount in wei
     * @param deadline Deadline timestamp
     */
    function createBounty(
        string memory title,
        string memory description,
        string[] memory requiredSkills,
        uint256 reward,
        uint256 deadline
    ) external payable profileExists(msg.sender) nonReentrant {
        require(msg.value >= reward, "Insufficient payment");
        require(deadline > block.timestamp, "Invalid deadline");
        require(bytes(title).length > 0, "Title cannot be empty");
        
        uint256 bountyId = _bountyCounter.current();
        _bountyCounter.increment();
        
        bounties[bountyId] = Bounty({
            bountyId: bountyId,
            creator: msg.sender,
            title: title,
            description: description,
            reward: reward,
            requiredSkills: requiredSkills,
            deadline: deadline,
            isActive: true,
            winner: address(0),
            createdAt: block.timestamp
        });
        
        userBounties[msg.sender].push(bountyId);
        
        emit BountyCreated(bountyId, msg.sender, reward);
    }
    
    /**
     * @notice Complete a bounty
     * @param bountyId Bounty ID
     * @param winner Address of the winner
     */
    function completeBounty(uint256 bountyId, address winner) external onlyOwner {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.isActive, "Bounty not active");
        require(block.timestamp <= bounty.deadline, "Bounty expired");
        require(hasProfile[winner], "Winner must have profile");
        
        bounty.isActive = false;
        bounty.winner = winner;
        
        // Transfer reward
        payable(winner).transfer(bounty.reward);
        
        // Update winner's profile
        uint256 winnerTokenId = userToTokenId[winner];
        tokenIdToProfile[winnerTokenId].totalEarned += bounty.reward;
        tokenIdToProfile[winnerTokenId].reputationScore += 10; // Bonus for completing bounty
        tokenIdToProfile[winnerTokenId].lastUpdated = block.timestamp;
        
        // Update metadata
        _setTokenURI(winnerTokenId, _generateTokenURI(winnerTokenId));
        
        emit BountyCompleted(bountyId, winner, bounty.reward);
    }
    
    /**
     * @notice Make a referral
     * @param referred Address being referred
     * @param reward Referral reward in wei
     */
    function makeReferral(address referred, uint256 reward) external payable profileExists(msg.sender) nonReentrant {
        require(msg.value >= reward, "Insufficient payment");
        require(hasProfile[referred], "Referred must have profile");
        require(referred != msg.sender, "Cannot refer self");
        
        // Transfer reward
        payable(referred).transfer(reward);
        
        // Update profiles
        uint256 referrerTokenId = userToTokenId[msg.sender];
        uint256 referredTokenId = userToTokenId[referred];
        
        tokenIdToProfile[referrerTokenId].referralsGiven++;
        tokenIdToProfile[referredTokenId].referralsReceived++;
        tokenIdToProfile[referredTokenId].totalEarned += reward;
        tokenIdToProfile[referredTokenId].reputationScore += 5; // Bonus for being referred
        
        // Update metadata
        _setTokenURI(referrerTokenId, _generateTokenURI(referrerTokenId));
        _setTokenURI(referredTokenId, _generateTokenURI(referredTokenId));
        
        emit ReferralMade(msg.sender, referred, reward);
    }
    
    /**
     * @notice Calculate professional level based on experience
     */
    function _calculateLevel(uint256 experienceYears) internal pure returns (ProfessionalLevel) {
        if (experienceYears >= 15) return ProfessionalLevel.Expert;
        if (experienceYears >= 10) return ProfessionalLevel.Principal;
        if (experienceYears >= 5) return ProfessionalLevel.Senior;
        if (experienceYears >= 2) return ProfessionalLevel.Mid;
        return ProfessionalLevel.Junior;
    }
    
    /**
     * @notice Generate token URI with profile metadata
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Profile memory profile = tokenIdToProfile[tokenId];
        
        string memory levelName = _getLevelName(profile.level);
        string memory svg = _generateSVG(profile);
        
        // Create skills array JSON
        string memory skillsJson = "[";
        for (uint256 i = 0; i < profile.skills.length; i++) {
            skillsJson = string(abi.encodePacked(skillsJson, '"', profile.skills[i], '"'));
            if (i < profile.skills.length - 1) {
                skillsJson = string(abi.encodePacked(skillsJson, ","));
            }
        }
        skillsJson = string(abi.encodePacked(skillsJson, "]"));
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "GigChain Profile #',
                        tokenId.toString(),
                        '",',
                        '"description": "Professional profile NFT on GigChain - the decentralized social network for professionals",',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Name", "value": "', profile.name, '"},',
                        '{"trait_type": "Title", "value": "', profile.title, '"},',
                        '{"trait_type": "Level", "value": "', levelName, '"},',
                        '{"trait_type": "Experience", "value": ', profile.experienceYears.toString(), '},',
                        '{"trait_type": "Location", "value": "', profile.location, '"},',
                        '{"trait_type": "Connections", "value": ', profile.connectionsCount.toString(), '},',
                        '{"trait_type": "Projects Completed", "value": ', profile.projectsCompleted.toString(), '},',
                        '{"trait_type": "Reputation Score", "value": ', profile.reputationScore.toString(), '},',
                        '{"trait_type": "Skills", "value": ', skillsJson, '},',
                        '{"trait_type": "Verified", "value": ', profile.isVerified ? 'true' : 'false', '}',
                        ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    /**
     * @notice Generate SVG image for profile NFT
     */
    function _generateSVG(Profile memory profile) internal pure returns (string memory) {
        string memory levelName = _getLevelName(profile.level);
        string memory color = _getLevelColor(profile.level);
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<defs>',
                '<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:', color, ';stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#000;stop-opacity:1" />',
                '</linearGradient>',
                '</defs>',
                '<rect width="400" height="400" fill="url(#grad)"/>',
                '<circle cx="200" cy="120" r="60" fill="white" opacity="0.9"/>',
                '<text x="200" y="130" text-anchor="middle" font-size="24" fill="black" font-weight="bold">',
                _truncateString(profile.name, 15),
                '</text>',
                '<text x="200" y="200" text-anchor="middle" font-size="32" fill="white" font-weight="bold">',
                levelName,
                '</text>',
                '<text x="200" y="230" text-anchor="middle" font-size="18" fill="white">',
                profile.title,
                '</text>',
                '<text x="200" y="260" text-anchor="middle" font-size="16" fill="white">',
                profile.experienceYears.toString(), ' years exp',
                '</text>',
                '<text x="200" y="290" text-anchor="middle" font-size="14" fill="white">',
                profile.connectionsCount.toString(), ' connections',
                '</text>',
                '<text x="200" y="320" text-anchor="middle" font-size="14" fill="white">',
                'Score: ', profile.reputationScore.toString(),
                '</text>',
                '</svg>'
            )
        );
    }
    
    /**
     * @notice Get level name
     */
    function _getLevelName(ProfessionalLevel level) internal pure returns (string memory) {
        if (level == ProfessionalLevel.Expert) return "Expert";
        if (level == ProfessionalLevel.Principal) return "Principal";
        if (level == ProfessionalLevel.Senior) return "Senior";
        if (level == ProfessionalLevel.Mid) return "Mid-Level";
        return "Junior";
    }
    
    /**
     * @notice Get level color
     */
    function _getLevelColor(ProfessionalLevel level) internal pure returns (string memory) {
        if (level == ProfessionalLevel.Expert) return "#FFD700"; // Gold
        if (level == ProfessionalLevel.Principal) return "#C0C0C0"; // Silver
        if (level == ProfessionalLevel.Senior) return "#CD7F32"; // Bronze
        if (level == ProfessionalLevel.Mid) return "#6366F1"; // Purple
        return "#10B981"; // Green
    }
    
    /**
     * @notice Truncate string to max length
     */
    function _truncateString(string memory str, uint256 maxLength) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length <= maxLength) {
            return str;
        }
        
        bytes memory result = new bytes(maxLength);
        for (uint256 i = 0; i < maxLength; i++) {
            result[i] = strBytes[i];
        }
        return string(result);
    }
    
    /**
     * @notice Get user profile
     */
    function getUserProfile(address user) external view returns (Profile memory) {
        require(hasProfile[user], "Profile does not exist");
        uint256 tokenId = userToTokenId[user];
        return tokenIdToProfile[tokenId];
    }
    
    /**
     * @notice Get user connections
     */
    function getUserConnections(address user) external view returns (Connection[] memory) {
        require(hasProfile[user], "Profile does not exist");
        uint256 tokenId = userToTokenId[user];
        return userConnections[tokenId];
    }
    
    /**
     * @notice Get active bounties
     */
    function getActiveBounties() external view returns (Bounty[] memory) {
        uint256 totalBounties = _bountyCounter.current();
        uint256 activeCount = 0;
        
        // Count active bounties
        for (uint256 i = 0; i < totalBounties; i++) {
            if (bounties[i].isActive && block.timestamp <= bounties[i].deadline) {
                activeCount++;
            }
        }
        
        // Create array with active bounties
        Bounty[] memory activeBounties = new Bounty[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalBounties; i++) {
            if (bounties[i].isActive && block.timestamp <= bounties[i].deadline) {
                activeBounties[index] = bounties[i];
                index++;
            }
        }
        
        return activeBounties;
    }
    
    /**
     * @notice Override transfer to make NFT soulbound
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning, but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("GigChain profiles are soulbound and cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Total supply of profiles
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}