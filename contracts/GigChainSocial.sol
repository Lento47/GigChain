// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GigChainSocial
 * @notice Decentralized social network for professionals on blockchain
 * @dev Main contract for GigChain social network with profiles, connections, and content
 * 
 * Features:
 * - Professional profiles as NFTs (soulbound)
 * - On-chain connections and networking
 * - Decentralized content feed
 * - Skill verification and endorsement
 * - Token rewards for engagement
 * - DAO governance participation
 * - Cross-platform interoperability
 */
contract GigChainSocial is ERC721URIStorage, Ownable, ReentrancyGuard {
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
    
    // Content types
    enum ContentType {
        Post,           // 0
        Article,        // 1
        Video,          // 2
        Image,          // 3
        Poll,           // 4
        Event,          // 5
        Job,            // 6
        Achievement,    // 7
        SkillShowcase   // 8
    }
    
    // Professional profile
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
        uint256 postsCount;
        uint256 connectionsCount;
        uint256 followersCount;
        uint256 followingCount;
        uint256 reputationScore;
        uint256 engagementScore;
        ProfessionalLevel level;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
        uint256 lastActiveAt;
    }
    
    // Social connection
    struct Connection {
        address user;
        address connectedTo;
        uint256 connectedAt;
        bool isActive;
        string message;
        bool isMutual;
    }
    
    // Content post
    struct Content {
        uint256 contentId;
        address author;
        string content;
        string mediaUrl;
        ContentType contentType;
        string[] tags;
        uint256 likes;
        uint256 comments;
        uint256 shares;
        uint256 views;
        uint256 timestamp;
        bool isActive;
        uint256 tipAmount; // in wei
        mapping(address => bool) hasLiked;
        mapping(address => bool) hasShared;
    }
    
    // Comment
    struct Comment {
        uint256 commentId;
        uint256 contentId;
        address author;
        string content;
        uint256 likes;
        uint256 timestamp;
        bool isActive;
        mapping(address => bool) hasLiked;
    }
    
    // Skill endorsement
    struct SkillEndorsement {
        address endorser;
        address endorsed;
        string skill;
        string message;
        uint256 timestamp;
        bool isVerified;
    }
    
    // Mappings
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => Profile) public tokenIdToProfile;
    mapping(address => bool) public hasProfile;
    mapping(uint256 => Connection[]) public userConnections;
    mapping(address => mapping(address => bool)) public isConnected;
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => uint256) public connectionCount;
    mapping(address => uint256) public followersCount;
    mapping(address => uint256) public followingCount;
    
    // Content mappings
    mapping(uint256 => Content) public contents;
    mapping(uint256 => Comment[]) public contentComments;
    mapping(address => uint256[]) public userContents;
    mapping(string => uint256[]) public tagContents;
    
    // Skill mappings
    mapping(address => SkillEndorsement[]) public userEndorsements;
    mapping(address => mapping(string => uint256)) public skillEndorsementCount;
    mapping(address => mapping(string => bool)) public verifiedSkills;
    
    // Counters
    Counters.Counter private _contentCounter;
    Counters.Counter private _commentCounter;
    
    // State variables
    IERC20 public socialToken;
    uint256 public engagementRewardRate = 1; // 1 token per engagement
    uint256 public contentCreationReward = 10; // 10 tokens per content
    uint256 public connectionReward = 5; // 5 tokens per connection
    
    // Events
    event ProfileCreated(address indexed user, uint256 indexed tokenId, string name);
    event ProfileUpdated(uint256 indexed tokenId, string field, string value);
    event ConnectionMade(address indexed from, address indexed to, uint256 timestamp);
    event ConnectionRemoved(address indexed from, address indexed to);
    event ContentCreated(uint256 indexed contentId, address indexed author, ContentType contentType);
    event ContentLiked(uint256 indexed contentId, address indexed user, uint256 totalLikes);
    event ContentShared(uint256 indexed contentId, address indexed user, uint256 totalShares);
    event CommentAdded(uint256 indexed contentId, uint256 indexed commentId, address indexed author);
    event SkillEndorsed(address indexed endorser, address indexed endorsed, string skill);
    event EngagementRewarded(address indexed user, uint256 amount, string reason);
    event ContentTipped(uint256 indexed contentId, address indexed tipper, uint256 amount);
    
    // Modifiers
    modifier onlyProfileOwner() {
        require(hasProfile[msg.sender], "Must have GigChain profile");
        _;
    }
    
    modifier profileExists(address user) {
        require(hasProfile[user], "Profile does not exist");
        _;
    }
    
    modifier contentExists(uint256 contentId) {
        require(contents[contentId].isActive, "Content does not exist");
        _;
    }
    
    constructor(address _socialToken) ERC721("GigChain Profile", "GCHP") Ownable(msg.sender) {
        socialToken = IERC20(_socialToken);
    }
    
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
        profile.postsCount = 0;
        profile.connectionsCount = 0;
        profile.followersCount = 0;
        profile.followingCount = 0;
        profile.reputationScore = 50; // Start at neutral
        profile.engagementScore = 0;
        profile.level = _calculateLevel(experienceYears);
        profile.isVerified = false;
        profile.isActive = true;
        profile.createdAt = block.timestamp;
        profile.lastActiveAt = block.timestamp;
        
        userToTokenId[msg.sender] = tokenId;
        hasProfile[msg.sender] = true;
        
        // Set initial metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        // Reward for profile creation
        _rewardUser(msg.sender, contentCreationReward, "Profile creation");
        
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
    ) external onlyProfileOwner {
        require(ownerOf(tokenId) == msg.sender, "Not profile owner");
        
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
        
        profile.lastActiveAt = block.timestamp;
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileUpdated(tokenId, field, value);
    }
    
    /**
     * @notice Add a skill to profile
     * @param tokenId Profile token ID
     * @param skill Skill to add
     */
    function addSkill(uint256 tokenId, string memory skill) external onlyProfileOwner {
        require(ownerOf(tokenId) == msg.sender, "Not profile owner");
        
        Profile storage profile = tokenIdToProfile[tokenId];
        profile.skills.push(skill);
        profile.lastActiveAt = block.timestamp;
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ProfileUpdated(tokenId, "skills", skill);
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
            message: message,
            isMutual: false
        });
        
        userConnections[fromTokenId].push(newConnection);
        isConnected[msg.sender][to] = true;
        
        // Update connection counts
        tokenIdToProfile[fromTokenId].connectionsCount++;
        tokenIdToProfile[fromTokenId].lastActiveAt = block.timestamp;
        
        // Reward for connection
        _rewardUser(msg.sender, connectionReward, "New connection");
        
        // Update metadata
        _setTokenURI(fromTokenId, _generateTokenURI(fromTokenId));
        
        emit ConnectionMade(msg.sender, to, block.timestamp);
    }
    
    /**
     * @notice Follow another user
     * @param to Address to follow
     */
    function followUser(address to) external profileExists(msg.sender) profileExists(to) {
        require(to != msg.sender, "Cannot follow self");
        require(!isFollowing[msg.sender][to], "Already following");
        
        isFollowing[msg.sender][to] = true;
        followingCount[msg.sender]++;
        followersCount[to]++;
        
        // Update profile counts
        uint256 fromTokenId = userToTokenId[msg.sender];
        uint256 toTokenId = userToTokenId[to];
        
        tokenIdToProfile[fromTokenId].followingCount++;
        tokenIdToProfile[toTokenId].followersCount++;
        
        // Reward for following
        _rewardUser(msg.sender, connectionReward, "Following user");
        
        // Update metadata
        _setTokenURI(fromTokenId, _generateTokenURI(fromTokenId));
        _setTokenURI(toTokenId, _generateTokenURI(toTokenId));
    }
    
    /**
     * @notice Create content (post, article, etc.)
     * @param content Content text
     * @param mediaUrl Media URL (optional)
     * @param contentType Type of content
     * @param tags Array of tags
     */
    function createContent(
        string memory content,
        string memory mediaUrl,
        ContentType contentType,
        string[] memory tags
    ) external onlyProfileOwner nonReentrant {
        require(bytes(content).length > 0, "Content cannot be empty");
        require(bytes(content).length <= 2000, "Content too long");
        
        uint256 contentId = _contentCounter.current();
        _contentCounter.increment();
        
        Content storage newContent = contents[contentId];
        newContent.contentId = contentId;
        newContent.author = msg.sender;
        newContent.content = content;
        newContent.mediaUrl = mediaUrl;
        newContent.contentType = contentType;
        newContent.tags = tags;
        newContent.likes = 0;
        newContent.comments = 0;
        newContent.shares = 0;
        newContent.views = 0;
        newContent.timestamp = block.timestamp;
        newContent.isActive = true;
        newContent.tipAmount = 0;
        
        userContents[msg.sender].push(contentId);
        
        // Add to tag mappings
        for (uint256 i = 0; i < tags.length; i++) {
            tagContents[tags[i]].push(contentId);
        }
        
        // Update profile
        uint256 tokenId = userToTokenId[msg.sender];
        tokenIdToProfile[tokenId].postsCount++;
        tokenIdToProfile[tokenId].lastActiveAt = block.timestamp;
        
        // Reward for content creation
        _rewardUser(msg.sender, contentCreationReward, "Content creation");
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ContentCreated(contentId, msg.sender, contentType);
    }
    
    /**
     * @notice Like content
     * @param contentId Content ID
     */
    function likeContent(uint256 contentId) external onlyProfileOwner contentExists(contentId) {
        require(!contents[contentId].hasLiked[msg.sender], "Already liked");
        
        contents[contentId].hasLiked[msg.sender] = true;
        contents[contentId].likes++;
        
        // Reward for engagement
        _rewardUser(msg.sender, engagementRewardRate, "Content like");
        
        emit ContentLiked(contentId, msg.sender, contents[contentId].likes);
    }
    
    /**
     * @notice Share content
     * @param contentId Content ID
     */
    function shareContent(uint256 contentId) external onlyProfileOwner contentExists(contentId) {
        require(!contents[contentId].hasShared[msg.sender], "Already shared");
        
        contents[contentId].hasShared[msg.sender] = true;
        contents[contentId].shares++;
        
        // Reward for engagement
        _rewardUser(msg.sender, engagementRewardRate, "Content share");
        
        emit ContentShared(contentId, msg.sender, contents[contentId].shares);
    }
    
    /**
     * @notice Add comment to content
     * @param contentId Content ID
     * @param commentContent Comment content
     */
    function addComment(uint256 contentId, string memory commentContent) external onlyProfileOwner contentExists(contentId) {
        require(bytes(commentContent).length > 0, "Comment cannot be empty");
        require(bytes(commentContent).length <= 500, "Comment too long");
        
        uint256 commentId = _commentCounter.current();
        _commentCounter.increment();
        
        Comment storage newComment = contentComments[contentId].push();
        newComment.commentId = commentId;
        newComment.contentId = contentId;
        newComment.author = msg.sender;
        newComment.content = commentContent;
        newComment.likes = 0;
        newComment.timestamp = block.timestamp;
        newComment.isActive = true;
        
        contents[contentId].comments++;
        
        // Reward for engagement
        _rewardUser(msg.sender, engagementRewardRate, "Comment");
        
        emit CommentAdded(contentId, commentId, msg.sender);
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
        require(isConnected[msg.sender][endorsed], "Must be connected to endorse");
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
        
        // Reward for endorsement
        _rewardUser(msg.sender, engagementRewardRate, "Skill endorsement");
        
        emit SkillEndorsed(msg.sender, endorsed, skill);
    }
    
    /**
     * @notice Tip content creator
     * @param contentId Content ID
     */
    function tipContent(uint256 contentId) external payable onlyProfileOwner contentExists(contentId) {
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        Content storage content = contents[contentId];
        content.tipAmount += msg.value;
        
        // Transfer tip to content author
        payable(content.author).transfer(msg.value);
        
        emit ContentTipped(contentId, msg.sender, msg.value);
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
     * @notice Reward user with tokens
     * @param user User address
     * @param amount Reward amount
     * @param reason Reward reason
     */
    function _rewardUser(address user, uint256 amount, string memory reason) internal {
        if (address(socialToken) != address(0)) {
            socialToken.transfer(user, amount);
            emit EngagementRewarded(user, amount, reason);
        }
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
                        '{"trait_type": "Followers", "value": ', profile.followersCount.toString(), '},',
                        '{"trait_type": "Posts", "value": ', profile.postsCount.toString(), '},',
                        '{"trait_type": "Reputation Score", "value": ', profile.reputationScore.toString(), '},',
                        '{"trait_type": "Engagement Score", "value": ', profile.engagementScore.toString(), '},',
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
                profile.followersCount.toString(), ' followers',
                '</text>',
                '<text x="200" y="350" text-anchor="middle" font-size="14" fill="white">',
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
     * @notice Get user contents
     */
    function getUserContents(address user) external view returns (uint256[] memory) {
        return userContents[user];
    }
    
    /**
     * @notice Get content by ID
     */
    function getContent(uint256 contentId) external view returns (Content memory) {
        require(contents[contentId].isActive, "Content does not exist");
        return contents[contentId];
    }
    
    /**
     * @notice Get content comments
     */
    function getContentComments(uint256 contentId) external view returns (Comment[] memory) {
        return contentComments[contentId];
    }
    
    /**
     * @notice Get skill endorsements
     */
    function getSkillEndorsements(address user) external view returns (SkillEndorsement[] memory) {
        return userEndorsements[user];
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
     * @notice Update social token address
     * @param _socialToken New token address
     */
    function updateSocialToken(address _socialToken) external onlyOwner {
        require(_socialToken != address(0), "Invalid address");
        socialToken = IERC20(_socialToken);
    }
    
    /**
     * @notice Update reward rates
     * @param _engagementRewardRate New engagement reward rate
     * @param _contentCreationReward New content creation reward
     * @param _connectionReward New connection reward
     */
    function updateRewardRates(
        uint256 _engagementRewardRate,
        uint256 _contentCreationReward,
        uint256 _connectionReward
    ) external onlyOwner {
        engagementRewardRate = _engagementRewardRate;
        contentCreationReward = _contentCreationReward;
        connectionReward = _connectionReward;
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}