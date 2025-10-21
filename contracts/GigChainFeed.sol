// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./GigChainProfile.sol";
import "./GigChainConnections.sol";

/**
 * @title GigChainFeed
 * @notice Decentralized feed system for professional content on GigChain
 * @dev Handles posts, comments, likes, and professional content sharing
 */
contract GigChainFeed is Ownable, ReentrancyGuard {
    
    // Post types
    enum PostType {
        Text,           // 0
        Image,          // 1
        Video,          // 2
        Article,        // 3
        JobPosting,     // 4
        ProjectUpdate,  // 5
        Achievement,    // 6
        SkillShowcase   // 7
    }
    
    // Post visibility
    enum PostVisibility {
        Public,         // 0
        Connections,    // 1
        Private         // 2
    }
    
    // Post structure
    struct Post {
        uint256 postId;
        address author;
        string content;
        string mediaUrl;
        PostType postType;
        PostVisibility visibility;
        string[] tags;
        uint256 likes;
        uint256 comments;
        uint256 shares;
        uint256 timestamp;
        bool isActive;
        uint256 tipAmount; // in wei
    }
    
    // Comment structure
    struct Comment {
        uint256 commentId;
        uint256 postId;
        address author;
        string content;
        uint256 likes;
        uint256 timestamp;
        bool isActive;
    }
    
    // Like structure
    struct Like {
        address user;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Post) public posts;
    mapping(uint256 => Comment[]) public postComments;
    mapping(uint256 => Like[]) public postLikes;
    mapping(uint256 => Like[]) public commentLikes;
    mapping(address => uint256[]) public userPosts;
    mapping(address => mapping(uint256 => bool)) public userLikedPost;
    mapping(address => mapping(uint256 => bool)) public userLikedComment;
    mapping(string => uint256[]) public tagPosts;
    
    // Counters
    uint256 private _postCounter;
    uint256 private _commentCounter;
    
    // State variables
    GigChainProfile public profileContract;
    GigChainConnections public connectionsContract;
    
    // Events
    event PostCreated(uint256 indexed postId, address indexed author, PostType postType, string content);
    event PostLiked(uint256 indexed postId, address indexed user, uint256 totalLikes);
    event PostUnliked(uint256 indexed postId, address indexed user, uint256 totalLikes);
    event PostShared(uint256 indexed postId, address indexed user, uint256 totalShares);
    event CommentAdded(uint256 indexed postId, uint256 indexed commentId, address indexed author, string content);
    event CommentLiked(uint256 indexed commentId, address indexed user, uint256 totalLikes);
    event PostTipped(uint256 indexed postId, address indexed tipper, uint256 amount);
    event PostDeleted(uint256 indexed postId, address indexed author);
    
    // Modifiers
    modifier onlyProfileOwner() {
        require(profileContract.hasProfile(msg.sender), "Must have GigChain profile");
        _;
    }
    
    modifier postExists(uint256 postId) {
        require(posts[postId].isActive, "Post does not exist");
        _;
    }
    
    modifier commentExists(uint256 commentId) {
        require(commentId < _commentCounter, "Comment does not exist");
        _;
    }
    
    constructor(address _profileContract, address _connectionsContract) Ownable(msg.sender) {
        profileContract = GigChainProfile(_profileContract);
        connectionsContract = GigChainConnections(_connectionsContract);
    }
    
    /**
     * @notice Create a new post
     * @param content Post content
     * @param mediaUrl Media URL (optional)
     * @param postType Type of post
     * @param visibility Post visibility
     * @param tags Array of tags
     */
    function createPost(
        string memory content,
        string memory mediaUrl,
        PostType postType,
        PostVisibility visibility,
        string[] memory tags
    ) external onlyProfileOwner nonReentrant {
        require(bytes(content).length > 0, "Content cannot be empty");
        require(bytes(content).length <= 2000, "Content too long");
        
        uint256 postId = _postCounter;
        _postCounter++;
        
        Post memory newPost = Post({
            postId: postId,
            author: msg.sender,
            content: content,
            mediaUrl: mediaUrl,
            postType: postType,
            visibility: visibility,
            tags: tags,
            likes: 0,
            comments: 0,
            shares: 0,
            timestamp: block.timestamp,
            isActive: true,
            tipAmount: 0
        });
        
        posts[postId] = newPost;
        userPosts[msg.sender].push(postId);
        
        // Add to tag mappings
        for (uint256 i = 0; i < tags.length; i++) {
            tagPosts[tags[i]].push(postId);
        }
        
        emit PostCreated(postId, msg.sender, postType, content);
    }
    
    /**
     * @notice Like a post
     * @param postId Post ID
     */
    function likePost(uint256 postId) external onlyProfileOwner postExists(postId) {
        require(!userLikedPost[msg.sender][postId], "Already liked");
        
        // Check visibility
        Post memory post = posts[postId];
        if (post.visibility == PostVisibility.Connections) {
            require(connectionsContract.areConnected(msg.sender, post.author), "Must be connected to like");
        }
        
        Like memory like = Like({
            user: msg.sender,
            timestamp: block.timestamp
        });
        
        postLikes[postId].push(like);
        userLikedPost[msg.sender][postId] = true;
        posts[postId].likes++;
        
        emit PostLiked(postId, msg.sender, posts[postId].likes);
    }
    
    /**
     * @notice Unlike a post
     * @param postId Post ID
     */
    function unlikePost(uint256 postId) external onlyProfileOwner postExists(postId) {
        require(userLikedPost[msg.sender][postId], "Not liked");
        
        // Remove like from array
        _removeLikeFromArray(postLikes[postId], msg.sender);
        userLikedPost[msg.sender][postId] = false;
        posts[postId].likes--;
        
        emit PostUnliked(postId, msg.sender, posts[postId].likes);
    }
    
    /**
     * @notice Share a post
     * @param postId Post ID
     */
    function sharePost(uint256 postId) external onlyProfileOwner postExists(postId) {
        Post memory post = posts[postId];
        if (post.visibility == PostVisibility.Connections) {
            require(connectionsContract.areConnected(msg.sender, post.author), "Must be connected to share");
        }
        
        posts[postId].shares++;
        
        emit PostShared(postId, msg.sender, posts[postId].shares);
    }
    
    /**
     * @notice Add a comment to a post
     * @param postId Post ID
     * @param content Comment content
     */
    function addComment(uint256 postId, string memory content) external onlyProfileOwner postExists(postId) {
        require(bytes(content).length > 0, "Comment cannot be empty");
        require(bytes(content).length <= 500, "Comment too long");
        
        Post memory post = posts[postId];
        if (post.visibility == PostVisibility.Connections) {
            require(connectionsContract.areConnected(msg.sender, post.author), "Must be connected to comment");
        }
        
        uint256 commentId = _commentCounter;
        _commentCounter++;
        
        Comment memory newComment = Comment({
            commentId: commentId,
            postId: postId,
            author: msg.sender,
            content: content,
            likes: 0,
            timestamp: block.timestamp,
            isActive: true
        });
        
        postComments[postId].push(newComment);
        posts[postId].comments++;
        
        emit CommentAdded(postId, commentId, msg.sender, content);
    }
    
    /**
     * @notice Like a comment
     * @param commentId Comment ID
     */
    function likeComment(uint256 commentId) external onlyProfileOwner commentExists(commentId) {
        require(!userLikedComment[msg.sender][commentId], "Already liked");
        
        Like memory like = Like({
            user: msg.sender,
            timestamp: block.timestamp
        });
        
        commentLikes[commentId].push(like);
        userLikedComment[msg.sender][commentId] = true;
        
        // Find and update comment likes count
        for (uint256 i = 0; i < postComments[posts[commentId].postId].length; i++) {
            if (postComments[posts[commentId].postId][i].commentId == commentId) {
                postComments[posts[commentId].postId][i].likes++;
                break;
            }
        }
        
        emit CommentLiked(commentId, msg.sender, commentLikes[commentId].length);
    }
    
    /**
     * @notice Tip a post
     * @param postId Post ID
     */
    function tipPost(uint256 postId) external payable onlyProfileOwner postExists(postId) {
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        Post storage post = posts[postId];
        post.tipAmount += msg.value;
        
        // Transfer tip to post author
        payable(post.author).transfer(msg.value);
        
        emit PostTipped(postId, msg.sender, msg.value);
    }
    
    /**
     * @notice Delete a post
     * @param postId Post ID
     */
    function deletePost(uint256 postId) external onlyProfileOwner postExists(postId) {
        require(posts[postId].author == msg.sender, "Not post author");
        
        posts[postId].isActive = false;
        
        emit PostDeleted(postId, msg.sender);
    }
    
    /**
     * @notice Get posts by user
     * @param user User address
     * @param offset Starting index
     * @param limit Number of posts to return
     * @return Array of posts
     */
    function getUserPosts(address user, uint256 offset, uint256 limit) external view returns (Post[] memory) {
        uint256[] memory userPostIds = userPosts[user];
        uint256 totalPosts = userPostIds.length;
        
        if (offset >= totalPosts) {
            return new Post[](0);
        }
        
        uint256 endIndex = offset + limit;
        if (endIndex > totalPosts) {
            endIndex = totalPosts;
        }
        
        uint256 resultLength = endIndex - offset;
        Post[] memory result = new Post[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = posts[userPostIds[offset + i]];
        }
        
        return result;
    }
    
    /**
     * @notice Get feed posts (public and connections)
     * @param offset Starting index
     * @param limit Number of posts to return
     * @return Array of posts
     */
    function getFeedPosts(uint256 offset, uint256 limit) external view returns (Post[] memory) {
        uint256 totalPosts = _postCounter;
        uint256 resultCount = 0;
        uint256 currentIndex = 0;
        
        // Count visible posts
        for (uint256 i = 0; i < totalPosts; i++) {
            if (posts[i].isActive) {
                if (posts[i].visibility == PostVisibility.Public ||
                    (posts[i].visibility == PostVisibility.Connections && 
                     connectionsContract.areConnected(msg.sender, posts[i].author))) {
                    if (currentIndex >= offset && resultCount < limit) {
                        resultCount++;
                    }
                    currentIndex++;
                }
            }
        }
        
        // Create result array
        Post[] memory result = new Post[](resultCount);
        uint256 resultIndex = 0;
        currentIndex = 0;
        
        for (uint256 i = 0; i < totalPosts; i++) {
            if (posts[i].isActive) {
                if (posts[i].visibility == PostVisibility.Public ||
                    (posts[i].visibility == PostVisibility.Connections && 
                     connectionsContract.areConnected(msg.sender, posts[i].author))) {
                    if (currentIndex >= offset && resultIndex < limit) {
                        result[resultIndex] = posts[i];
                        resultIndex++;
                    }
                    currentIndex++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @notice Get posts by tag
     * @param tag Tag name
     * @param offset Starting index
     * @param limit Number of posts to return
     * @return Array of posts
     */
    function getPostsByTag(string memory tag, uint256 offset, uint256 limit) external view returns (Post[] memory) {
        uint256[] memory tagPostIds = tagPosts[tag];
        uint256 totalPosts = tagPostIds.length;
        
        if (offset >= totalPosts) {
            return new Post[](0);
        }
        
        uint256 endIndex = offset + limit;
        if (endIndex > totalPosts) {
            endIndex = totalPosts;
        }
        
        uint256 resultLength = endIndex - offset;
        Post[] memory result = new Post[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = posts[tagPostIds[offset + i]];
        }
        
        return result;
    }
    
    /**
     * @notice Get post comments
     * @param postId Post ID
     * @return Array of comments
     */
    function getPostComments(uint256 postId) external view returns (Comment[] memory) {
        return postComments[postId];
    }
    
    /**
     * @notice Get post likes
     * @param postId Post ID
     * @return Array of likes
     */
    function getPostLikes(uint256 postId) external view returns (Like[] memory) {
        return postLikes[postId];
    }
    
    /**
     * @notice Get comment likes
     * @param commentId Comment ID
     * @return Array of likes
     */
    function getCommentLikes(uint256 commentId) external view returns (Like[] memory) {
        return commentLikes[commentId];
    }
    
    /**
     * @notice Remove like from array
     */
    function _removeLikeFromArray(Like[] storage likes, address user) internal {
        for (uint256 i = 0; i < likes.length; i++) {
            if (likes[i].user == user) {
                likes[i] = likes[likes.length - 1];
                likes.pop();
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
    
    /**
     * @notice Update connections contract address
     * @param _connectionsContract New connections contract address
     */
    function updateConnectionsContract(address _connectionsContract) external onlyOwner {
        require(_connectionsContract != address(0), "Invalid address");
        connectionsContract = GigChainConnections(_connectionsContract);
    }
    
    /**
     * @notice Get total posts count
     * @return Total number of posts
     */
    function getTotalPosts() external view returns (uint256) {
        return _postCounter;
    }
    
    /**
     * @notice Get total comments count
     * @return Total number of comments
     */
    function getTotalComments() external view returns (uint256) {
        return _commentCounter;
    }
}