// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./GigChainSocial.sol";

/**
 * @title GigChainMarketplace
 * @notice Marketplace for professional services and skills on GigChain
 * @dev Handles service listings, bookings, payments, and reviews
 * 
 * Features:
 * - Service listings with skill requirements
 * - Escrow-based payments
 * - Review and rating system
 * - Skill verification integration
 * - Dispute resolution
 * - Commission-based monetization
 */
contract GigChainMarketplace is Ownable, ReentrancyGuard {
    
    // Service categories
    enum ServiceCategory {
        Development,     // 0
        Design,         // 1
        Marketing,      // 2
        Consulting,     // 3
        Writing,        // 4
        Translation,    // 5
        Data,           // 6
        Other           // 7
    }
    
    // Service status
    enum ServiceStatus {
        Active,         // 0
        Paused,         // 1
        Completed,      // 2
        Cancelled,      // 3
        Disputed        // 4
    }
    
    // Booking status
    enum BookingStatus {
        Pending,        // 0
        Accepted,       // 1
        InProgress,     // 2
        Completed,      // 3
        Cancelled,      // 4
        Disputed        // 5
    }
    
    // Service listing
    struct Service {
        uint256 serviceId;
        address provider;
        string title;
        string description;
        ServiceCategory category;
        string[] requiredSkills;
        uint256 price; // in wei
        uint256 duration; // in days
        ServiceStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 totalBookings;
        uint256 averageRating;
        bool isVerified;
    }
    
    // Booking
    struct Booking {
        uint256 bookingId;
        uint256 serviceId;
        address client;
        address provider;
        uint256 amount;
        uint256 deadline;
        BookingStatus status;
        uint256 createdAt;
        uint256 completedAt;
        string clientMessage;
        string providerMessage;
    }
    
    // Review
    struct Review {
        uint256 reviewId;
        uint256 serviceId;
        uint256 bookingId;
        address reviewer;
        address reviewee;
        uint256 rating; // 1-5
        string comment;
        uint256 timestamp;
        bool isVerified;
    }
    
    // Mappings
    mapping(uint256 => Service) public services;
    mapping(uint256 => Booking) public bookings;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) public userServices;
    mapping(address => uint256[]) public userBookings;
    mapping(address => uint256[]) public userReviews;
    mapping(ServiceCategory => uint256[]) public categoryServices;
    mapping(string => uint256[]) public skillServices;
    
    // Counters
    Counters.Counter private _serviceCounter;
    Counters.Counter private _bookingCounter;
    Counters.Counter private _reviewCounter;
    
    // State variables
    GigChainSocial public socialContract;
    IERC20 public paymentToken;
    
    // Marketplace fees (in basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    uint256 public totalFeesCollected;
    
    // Escrow period (in days)
    uint256 public escrowPeriod = 7;
    
    // Minimum service price
    uint256 public minimumPrice = 0.001 ether;
    
    // Events
    event ServiceCreated(uint256 indexed serviceId, address indexed provider, ServiceCategory category, uint256 price);
    event ServiceUpdated(uint256 indexed serviceId, address indexed provider);
    event ServicePaused(uint256 indexed serviceId, address indexed provider);
    event ServiceResumed(uint256 indexed serviceId, address indexed provider);
    event BookingCreated(uint256 indexed bookingId, uint256 indexed serviceId, address indexed client, uint256 amount);
    event BookingAccepted(uint256 indexed bookingId, address indexed provider);
    event BookingCompleted(uint256 indexed bookingId, address indexed client, address indexed provider);
    event BookingCancelled(uint256 indexed bookingId, address indexed canceller);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed serviceId, address indexed reviewer, uint256 rating);
    event PaymentReleased(uint256 indexed bookingId, address indexed provider, uint256 amount);
    event PaymentRefunded(uint256 indexed bookingId, address indexed client, uint256 amount);
    event DisputeCreated(uint256 indexed bookingId, address indexed disputer, string reason);
    event PlatformFeeUpdated(uint256 newFee);
    event EscrowPeriodUpdated(uint256 newPeriod);
    
    // Modifiers
    modifier onlyServiceProvider(uint256 serviceId) {
        require(services[serviceId].provider == msg.sender, "Not service provider");
        _;
    }
    
    modifier onlyBookingParticipant(uint256 bookingId) {
        require(
            bookings[bookingId].client == msg.sender || 
            bookings[bookingId].provider == msg.sender,
            "Not booking participant"
        );
        _;
    }
    
    modifier serviceExists(uint256 serviceId) {
        require(serviceId < _serviceCounter.current(), "Service does not exist");
        _;
    }
    
    modifier bookingExists(uint256 bookingId) {
        require(bookingId < _bookingCounter.current(), "Booking does not exist");
        _;
    }
    
    constructor(address _socialContract, address _paymentToken) Ownable(msg.sender) {
        socialContract = GigChainSocial(_socialContract);
        paymentToken = IERC20(_paymentToken);
    }
    
    /**
     * @notice Create a new service listing
     * @param title Service title
     * @param description Service description
     * @param category Service category
     * @param requiredSkills Required skills
     * @param price Service price in wei
     * @param duration Service duration in days
     */
    function createService(
        string memory title,
        string memory description,
        ServiceCategory category,
        string[] memory requiredSkills,
        uint256 price,
        uint256 duration
    ) external nonReentrant {
        require(socialContract.hasProfile(msg.sender), "Must have GigChain profile");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(price >= minimumPrice, "Price below minimum");
        require(duration > 0, "Duration must be positive");
        
        uint256 serviceId = _serviceCounter.current();
        _serviceCounter.increment();
        
        Service storage service = services[serviceId];
        service.serviceId = serviceId;
        service.provider = msg.sender;
        service.title = title;
        service.description = description;
        service.category = category;
        service.requiredSkills = requiredSkills;
        service.price = price;
        service.duration = duration;
        service.status = ServiceStatus.Active;
        service.createdAt = block.timestamp;
        service.updatedAt = block.timestamp;
        service.totalBookings = 0;
        service.averageRating = 0;
        service.isVerified = false;
        
        userServices[msg.sender].push(serviceId);
        categoryServices[category].push(serviceId);
        
        // Add to skill mappings
        for (uint256 i = 0; i < requiredSkills.length; i++) {
            skillServices[requiredSkills[i]].push(serviceId);
        }
        
        emit ServiceCreated(serviceId, msg.sender, category, price);
    }
    
    /**
     * @notice Update service information
     * @param serviceId Service ID
     * @param title New title
     * @param description New description
     * @param price New price
     * @param duration New duration
     */
    function updateService(
        uint256 serviceId,
        string memory title,
        string memory description,
        uint256 price,
        uint256 duration
    ) external onlyServiceProvider(serviceId) serviceExists(serviceId) {
        require(services[serviceId].status == ServiceStatus.Active, "Service not active");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(price >= minimumPrice, "Price below minimum");
        require(duration > 0, "Duration must be positive");
        
        Service storage service = services[serviceId];
        service.title = title;
        service.description = description;
        service.price = price;
        service.duration = duration;
        service.updatedAt = block.timestamp;
        
        emit ServiceUpdated(serviceId, msg.sender);
    }
    
    /**
     * @notice Pause a service
     * @param serviceId Service ID
     */
    function pauseService(uint256 serviceId) external onlyServiceProvider(serviceId) serviceExists(serviceId) {
        require(services[serviceId].status == ServiceStatus.Active, "Service not active");
        
        services[serviceId].status = ServiceStatus.Paused;
        services[serviceId].updatedAt = block.timestamp;
        
        emit ServicePaused(serviceId, msg.sender);
    }
    
    /**
     * @notice Resume a paused service
     * @param serviceId Service ID
     */
    function resumeService(uint256 serviceId) external onlyServiceProvider(serviceId) serviceExists(serviceId) {
        require(services[serviceId].status == ServiceStatus.Paused, "Service not paused");
        
        services[serviceId].status = ServiceStatus.Active;
        services[serviceId].updatedAt = block.timestamp;
        
        emit ServiceResumed(serviceId, msg.sender);
    }
    
    /**
     * @notice Book a service
     * @param serviceId Service ID
     * @param clientMessage Message to provider
     */
    function bookService(
        uint256 serviceId,
        string memory clientMessage
    ) external nonReentrant serviceExists(serviceId) {
        Service storage service = services[serviceId];
        require(service.status == ServiceStatus.Active, "Service not active");
        require(service.provider != msg.sender, "Cannot book own service");
        require(socialContract.hasProfile(msg.sender), "Must have GigChain profile");
        
        uint256 bookingId = _bookingCounter.current();
        _bookingCounter.increment();
        
        Booking storage booking = bookings[bookingId];
        booking.bookingId = bookingId;
        booking.serviceId = serviceId;
        booking.client = msg.sender;
        booking.provider = service.provider;
        booking.amount = service.price;
        booking.deadline = block.timestamp + (service.duration * 1 days);
        booking.status = BookingStatus.Pending;
        booking.createdAt = block.timestamp;
        booking.clientMessage = clientMessage;
        
        userBookings[msg.sender].push(bookingId);
        userBookings[service.provider].push(bookingId);
        
        // Transfer payment to escrow
        paymentToken.transferFrom(msg.sender, address(this), service.price);
        
        emit BookingCreated(bookingId, serviceId, msg.sender, service.price);
    }
    
    /**
     * @notice Accept a booking
     * @param bookingId Booking ID
     * @param providerMessage Message to client
     */
    function acceptBooking(
        uint256 bookingId,
        string memory providerMessage
    ) external onlyBookingParticipant(bookingId) bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(booking.provider == msg.sender, "Not service provider");
        require(booking.status == BookingStatus.Pending, "Booking not pending");
        
        booking.status = BookingStatus.Accepted;
        booking.providerMessage = providerMessage;
        
        emit BookingAccepted(bookingId, msg.sender);
    }
    
    /**
     * @notice Start work on a booking
     * @param bookingId Booking ID
     */
    function startWork(uint256 bookingId) external onlyBookingParticipant(bookingId) bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(booking.provider == msg.sender, "Not service provider");
        require(booking.status == BookingStatus.Accepted, "Booking not accepted");
        
        booking.status = BookingStatus.InProgress;
    }
    
    /**
     * @notice Complete a booking
     * @param bookingId Booking ID
     */
    function completeBooking(uint256 bookingId) external onlyBookingParticipant(bookingId) bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(booking.provider == msg.sender, "Not service provider");
        require(booking.status == BookingStatus.InProgress, "Booking not in progress");
        
        booking.status = BookingStatus.Completed;
        booking.completedAt = block.timestamp;
        
        // Calculate fees
        uint256 fee = (booking.amount * platformFee) / 10000;
        uint256 providerAmount = booking.amount - fee;
        
        // Transfer payment to provider
        paymentToken.transfer(booking.provider, providerAmount);
        
        // Update service stats
        services[booking.serviceId].totalBookings++;
        
        // Update fees collected
        totalFeesCollected += fee;
        
        emit BookingCompleted(bookingId, booking.client, booking.provider);
        emit PaymentReleased(bookingId, booking.provider, providerAmount);
    }
    
    /**
     * @notice Cancel a booking
     * @param bookingId Booking ID
     */
    function cancelBooking(uint256 bookingId) external onlyBookingParticipant(bookingId) bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(
            booking.status == BookingStatus.Pending || 
            booking.status == BookingStatus.Accepted,
            "Cannot cancel booking"
        );
        
        booking.status = BookingStatus.Cancelled;
        
        // Refund payment to client
        paymentToken.transfer(booking.client, booking.amount);
        
        emit BookingCancelled(bookingId, msg.sender);
        emit PaymentRefunded(bookingId, booking.client, booking.amount);
    }
    
    /**
     * @notice Submit a review
     * @param bookingId Booking ID
     * @param rating Rating 1-5
     * @param comment Review comment
     */
    function submitReview(
        uint256 bookingId,
        uint256 rating,
        string memory comment
    ) external onlyBookingParticipant(bookingId) bookingExists(bookingId) {
        Booking storage booking = bookings[bookingId];
        require(booking.status == BookingStatus.Completed, "Booking not completed");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        
        uint256 reviewId = _reviewCounter.current();
        _reviewCounter.increment();
        
        Review storage review = reviews[reviewId];
        review.reviewId = reviewId;
        review.serviceId = booking.serviceId;
        review.bookingId = bookingId;
        review.reviewer = msg.sender;
        review.reviewee = (msg.sender == booking.client) ? booking.provider : booking.client;
        review.rating = rating;
        review.comment = comment;
        review.timestamp = block.timestamp;
        review.isVerified = true;
        
        userReviews[review.reviewee].push(reviewId);
        
        // Update service average rating
        Service storage service = services[booking.serviceId];
        uint256 totalRating = service.averageRating * service.totalBookings;
        service.averageRating = (totalRating + rating) / (service.totalBookings + 1);
        
        emit ReviewSubmitted(reviewId, booking.serviceId, msg.sender, rating);
    }
    
    /**
     * @notice Get services by category
     * @param category Service category
     * @param offset Starting index
     * @param limit Number of services to return
     * @return Array of service IDs
     */
    function getServicesByCategory(
        ServiceCategory category,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory categoryServiceIds = categoryServices[category];
        uint256 totalServices = categoryServiceIds.length;
        
        if (offset >= totalServices) {
            return new uint256[](0);
        }
        
        uint256 endIndex = offset + limit;
        if (endIndex > totalServices) {
            endIndex = totalServices;
        }
        
        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = categoryServiceIds[offset + i];
        }
        
        return result;
    }
    
    /**
     * @notice Get services by skill
     * @param skill Skill name
     * @param offset Starting index
     * @param limit Number of services to return
     * @return Array of service IDs
     */
    function getServicesBySkill(
        string memory skill,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory skillServiceIds = skillServices[skill];
        uint256 totalServices = skillServiceIds.length;
        
        if (offset >= totalServices) {
            return new uint256[](0);
        }
        
        uint256 endIndex = offset + limit;
        if (endIndex > totalServices) {
            endIndex = totalServices;
        }
        
        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = skillServiceIds[offset + i];
        }
        
        return result;
    }
    
    /**
     * @notice Get user services
     * @param user User address
     * @return Array of service IDs
     */
    function getUserServices(address user) external view returns (uint256[] memory) {
        return userServices[user];
    }
    
    /**
     * @notice Get user bookings
     * @param user User address
     * @return Array of booking IDs
     */
    function getUserBookings(address user) external view returns (uint256[] memory) {
        return userBookings[user];
    }
    
    /**
     * @notice Get user reviews
     * @param user User address
     * @return Array of review IDs
     */
    function getUserReviews(address user) external view returns (uint256[] memory) {
        return userReviews[user];
    }
    
    /**
     * @notice Update platform fee
     * @param newFee New fee in basis points
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }
    
    /**
     * @notice Update escrow period
     * @param newPeriod New period in days
     */
    function updateEscrowPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Period must be positive");
        escrowPeriod = newPeriod;
        emit EscrowPeriodUpdated(newPeriod);
    }
    
    /**
     * @notice Update minimum price
     * @param newPrice New minimum price in wei
     */
    function updateMinimumPrice(uint256 newPrice) external onlyOwner {
        minimumPrice = newPrice;
    }
    
    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        paymentToken.transfer(owner(), amount);
    }
    
    /**
     * @notice Get total services count
     * @return Total number of services
     */
    function getTotalServices() external view returns (uint256) {
        return _serviceCounter.current();
    }
    
    /**
     * @notice Get total bookings count
     * @return Total number of bookings
     */
    function getTotalBookings() external view returns (uint256) {
        return _bookingCounter.current();
    }
    
    /**
     * @notice Get total reviews count
     * @return Total number of reviews
     */
    function getTotalReviews() external view returns (uint256) {
        return _reviewCounter.current();
    }
}