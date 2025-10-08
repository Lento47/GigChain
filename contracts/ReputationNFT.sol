// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ReputationNFT
 * @notice Dynamic NFT representing user reputation on GigChain
 * @dev NFT metadata updates based on user's on-chain activity
 */
contract ReputationNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    Counters.Counter private _tokenIdCounter;
    
    // Reputation levels
    enum ReputationLevel {
        Novice,      // 0-99 points
        Apprentice,  // 100-499
        Professional,// 500-999
        Expert,      // 1000-2499
        Master,      // 2500-4999
        Legend       // 5000+
    }
    
    // User reputation data
    struct Reputation {
        uint256 points;
        uint256 contractsCompleted;
        uint256 totalEarned;
        uint256 trustScore;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 level;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // Mappings
    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => Reputation) public tokenIdToReputation;
    mapping(address => bool) public hasNFT;
    
    // Events
    event ReputationMinted(address indexed user, uint256 indexed tokenId, uint256 initialPoints);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newPoints, uint256 newLevel);
    event LevelUp(uint256 indexed tokenId, uint256 newLevel, address indexed user);
    event ContractCompleted(uint256 indexed tokenId, uint256 pointsEarned);
    event DisputeResolved(uint256 indexed tokenId, bool won, uint256 pointsChange);
    
    constructor() ERC721("GigChain Reputation", "GIGREP") Ownable(msg.sender) {}
    
    /**
     * @notice Mint a reputation NFT for a new user
     * @param to Address to mint the NFT to
     */
    function mintReputation(address to) public returns (uint256) {
        require(!hasNFT[to], "User already has reputation NFT");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        // Initialize reputation
        Reputation storage rep = tokenIdToReputation[tokenId];
        rep.points = 0;
        rep.contractsCompleted = 0;
        rep.totalEarned = 0;
        rep.trustScore = 50; // Start at neutral
        rep.disputesWon = 0;
        rep.disputesLost = 0;
        rep.level = uint256(ReputationLevel.Novice);
        rep.lastUpdated = block.timestamp;
        rep.isActive = true;
        
        userToTokenId[to] = tokenId;
        hasNFT[to] = true;
        
        // Set initial metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ReputationMinted(to, tokenId, 0);
        
        return tokenId;
    }
    
    /**
     * @notice Update reputation after contract completion
     * @param user User address
     * @param amountEarned Amount earned from contract
     * @param rating Contract rating (1-5)
     * @param onTime Whether contract was completed on time
     */
    function updateAfterContract(
        address user,
        uint256 amountEarned,
        uint8 rating,
        bool onTime
    ) external onlyOwner {
        require(hasNFT[user], "User has no reputation NFT");
        
        uint256 tokenId = userToTokenId[user];
        Reputation storage rep = tokenIdToReputation[tokenId];
        
        // Calculate points earned
        uint256 pointsEarned = _calculateContractPoints(amountEarned, rating, onTime);
        
        // Update reputation
        rep.points += pointsEarned;
        rep.contractsCompleted += 1;
        rep.totalEarned += amountEarned;
        rep.trustScore = _calculateTrustScore(rep);
        rep.lastUpdated = block.timestamp;
        
        // Check for level up
        uint256 newLevel = _calculateLevel(rep.points);
        if (newLevel > rep.level) {
            rep.level = newLevel;
            emit LevelUp(tokenId, newLevel, user);
        }
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ReputationUpdated(tokenId, rep.points, rep.level);
        emit ContractCompleted(tokenId, pointsEarned);
    }
    
    /**
     * @notice Update reputation after dispute resolution
     * @param user User address
     * @param won Whether user won the dispute
     */
    function updateAfterDispute(address user, bool won) external onlyOwner {
        require(hasNFT[user], "User has no reputation NFT");
        
        uint256 tokenId = userToTokenId[user];
        Reputation storage rep = tokenIdToReputation[tokenId];
        
        int256 pointsChange;
        
        if (won) {
            rep.disputesWon += 1;
            pointsChange = 50; // Gain points for winning dispute
        } else {
            rep.disputesLost += 1;
            pointsChange = -100; // Lose points for losing dispute
        }
        
        // Apply points change (prevent underflow)
        if (pointsChange < 0 && rep.points < uint256(-pointsChange)) {
            rep.points = 0;
        } else {
            rep.points = uint256(int256(rep.points) + pointsChange);
        }
        
        rep.trustScore = _calculateTrustScore(rep);
        rep.lastUpdated = block.timestamp;
        
        // Check for level change
        uint256 newLevel = _calculateLevel(rep.points);
        if (newLevel != rep.level) {
            rep.level = newLevel;
            if (newLevel > rep.level) {
                emit LevelUp(tokenId, newLevel, user);
            }
        }
        
        // Update metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ReputationUpdated(tokenId, rep.points, rep.level);
        emit DisputeResolved(tokenId, won, uint256(pointsChange < 0 ? -pointsChange : pointsChange));
    }
    
    /**
     * @notice Calculate points earned from a contract
     */
    function _calculateContractPoints(
        uint256 amount,
        uint8 rating,
        bool onTime
    ) internal pure returns (uint256) {
        // Base points from amount (1 point per $10)
        uint256 basePoints = amount / 10;
        
        // Rating multiplier (1.0x to 2.0x)
        uint256 ratingMultiplier = 100 + (uint256(rating) * 20); // 100-200
        
        // On-time bonus
        uint256 timeBonus = onTime ? 125 : 100; // 25% bonus if on time
        
        // Calculate total points
        uint256 points = (basePoints * ratingMultiplier * timeBonus) / 10000;
        
        // Minimum 10 points per contract
        return points < 10 ? 10 : points;
    }
    
    /**
     * @notice Calculate trust score (0-100)
     */
    function _calculateTrustScore(Reputation storage rep) internal view returns (uint256) {
        if (rep.contractsCompleted == 0) {
            return 50; // Neutral for new users
        }
        
        uint256 totalDisputes = rep.disputesWon + rep.disputesLost;
        
        // Base trust from completion rate (assume 95% completion)
        uint256 baseTrust = 95;
        
        // Adjust for disputes
        if (totalDisputes > 0) {
            uint256 disputeWinRate = (rep.disputesWon * 100) / totalDisputes;
            baseTrust = (baseTrust + disputeWinRate) / 2;
        }
        
        // Adjust for total contracts (bonus for experience)
        if (rep.contractsCompleted >= 100) {
            baseTrust = baseTrust > 95 ? 100 : baseTrust + 5;
        } else if (rep.contractsCompleted >= 50) {
            baseTrust = baseTrust > 97 ? 100 : baseTrust + 3;
        }
        
        return baseTrust > 100 ? 100 : baseTrust;
    }
    
    /**
     * @notice Calculate reputation level based on points
     */
    function _calculateLevel(uint256 points) internal pure returns (uint256) {
        if (points >= 5000) return uint256(ReputationLevel.Legend);
        if (points >= 2500) return uint256(ReputationLevel.Master);
        if (points >= 1000) return uint256(ReputationLevel.Expert);
        if (points >= 500) return uint256(ReputationLevel.Professional);
        if (points >= 100) return uint256(ReputationLevel.Apprentice);
        return uint256(ReputationLevel.Novice);
    }
    
    /**
     * @notice Generate dynamic token URI
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Reputation storage rep = tokenIdToReputation[tokenId];
        
        string memory levelName = _getLevelName(rep.level);
        string memory svg = _generateSVG(rep);
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "GigChain Reputation #',
                        tokenId.toString(),
                        '",',
                        '"description": "Dynamic reputation NFT representing user activity on GigChain",',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '",',
                        '"attributes": [',
                        '{"trait_type": "Level", "value": "', levelName, '"},',
                        '{"trait_type": "Points", "value": ', rep.points.toString(), '},',
                        '{"trait_type": "Contracts Completed", "value": ', rep.contractsCompleted.toString(), '},',
                        '{"trait_type": "Trust Score", "value": ', rep.trustScore.toString(), '},',
                        '{"trait_type": "Total Earned", "value": ', rep.totalEarned.toString(), '}',
                        ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    /**
     * @notice Generate SVG image for NFT
     */
    function _generateSVG(Reputation storage rep) internal view returns (string memory) {
        string memory levelName = _getLevelName(rep.level);
        string memory color = _getLevelColor(rep.level);
        
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
                '<text x="50%" y="40%" text-anchor="middle" font-size="48" fill="white" font-weight="bold">',
                levelName,
                '</text>',
                '<text x="50%" y="55%" text-anchor="middle" font-size="32" fill="white">',
                rep.points.toString(), ' Points',
                '</text>',
                '<text x="50%" y="70%" text-anchor="middle" font-size="24" fill="white">',
                rep.contractsCompleted.toString(), ' Contracts',
                '</text>',
                '<text x="50%" y="80%" text-anchor="middle" font-size="20" fill="white">',
                'Trust: ', rep.trustScore.toString(), '%',
                '</text>',
                '</svg>'
            )
        );
    }
    
    /**
     * @notice Get level name
     */
    function _getLevelName(uint256 level) internal pure returns (string memory) {
        if (level == uint256(ReputationLevel.Legend)) return "Legend";
        if (level == uint256(ReputationLevel.Master)) return "Master";
        if (level == uint256(ReputationLevel.Expert)) return "Expert";
        if (level == uint256(ReputationLevel.Professional)) return "Professional";
        if (level == uint256(ReputationLevel.Apprentice)) return "Apprentice";
        return "Novice";
    }
    
    /**
     * @notice Get level color
     */
    function _getLevelColor(uint256 level) internal pure returns (string memory) {
        if (level == uint256(ReputationLevel.Legend)) return "#FFD700"; // Gold
        if (level == uint256(ReputationLevel.Master)) return "#C0C0C0"; // Silver
        if (level == uint256(ReputationLevel.Expert)) return "#CD7F32"; // Bronze
        if (level == uint256(ReputationLevel.Professional)) return "#6366F1"; // Purple
        if (level == uint256(ReputationLevel.Apprentice)) return "#3B82F6"; // Blue
        return "#10B981"; // Green
    }
    
    /**
     * @notice Get user reputation
     */
    function getUserReputation(address user) external view returns (Reputation memory) {
        require(hasNFT[user], "User has no reputation NFT");
        uint256 tokenId = userToTokenId[user];
        return tokenIdToReputation[tokenId];
    }
    
    /**
     * @notice Override transfer to make NFT soulbound (optional)
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning, but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("Reputation NFTs are soulbound and cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Total supply of NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
