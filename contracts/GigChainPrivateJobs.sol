// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GigChainPrivateJobs
 * @dev Smart contract para manejar trabajos privados y grupos de colaboración
 * @author GigChain.io
 */
contract GigChainPrivateJobs is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // ==================== STRUCTS ====================
    
    struct PrivateJob {
        uint256 jobId;
        address client;
        string title;
        string description;
        string[] requirements;
        uint256 budgetMin;
        uint256 budgetMax;
        string currency;
        string timeline;
        string[] skills;
        JobStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        mapping(address => bool) invitedFreelancers;
        mapping(address => bool) hasApplied;
        mapping(address => bool) isInGroup;
    }
    
    struct JobInvitation {
        uint256 invitationId;
        uint256 jobId;
        address client;
        address freelancer;
        string message;
        InvitationStatus status;
        uint256 invitedAt;
        uint256 respondedAt;
    }
    
    struct JobApplication {
        uint256 applicationId;
        uint256 jobId;
        address applicant;
        string coverLetter;
        uint256 proposedRate;
        string estimatedTime;
        string[] relevantExperience;
        string[] portfolio;
        uint256 appliedAt;
        ApplicationStatus status;
    }
    
    struct CollaborationGroup {
        uint256 groupId;
        uint256 jobId;
        address client;
        address[] applicants;
        GroupStatus status;
        uint256 createdAt;
        uint256 decidedAt;
        address[] selectedApplicants;
        string[] projectGoals;
        uint256[] deadlines;
        string githubRepo;
    }
    
    struct GroupProposal {
        uint256 proposalId;
        uint256 groupId;
        address proposer;
        string title;
        string description;
        address[] selectedApplicants;
        string reasoning;
        mapping(address => VoteType) votes;
        ProposalStatus status;
        uint256 deadline;
        uint256 createdAt;
    }
    
    // ==================== ENUMS ====================
    
    enum JobStatus {
        Draft,
        Published,
        InProgress,
        Completed
    }
    
    enum InvitationStatus {
        Pending,
        Accepted,
        Declined
    }
    
    enum ApplicationStatus {
        Pending,
        InGroup,
        Selected,
        Rejected
    }
    
    enum GroupStatus {
        Active,
        Decided,
        Completed
    }
    
    enum ProposalStatus {
        Active,
        Passed,
        Rejected
    }
    
    enum VoteType {
        None,
        Yes,
        No,
        Abstain
    }
    
    // ==================== STATE VARIABLES ====================
    
    Counters.Counter private _jobIds;
    Counters.Counter private _invitationIds;
    Counters.Counter private _applicationIds;
    Counters.Counter private _groupId;
    Counters.Counter private _proposalIds;
    
    mapping(uint256 => PrivateJob) public privateJobs;
    mapping(uint256 => JobInvitation) public jobInvitations;
    mapping(uint256 => JobApplication) public jobApplications;
    mapping(uint256 => CollaborationGroup) public collaborationGroups;
    mapping(uint256 => GroupProposal) public groupProposals;
    
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerApplications;
    mapping(address => uint256[]) public freelancerInvitations;
    mapping(uint256 => uint256) public jobToGroup;
    mapping(uint256 => uint256[]) public groupProposalsList;
    
    // ==================== EVENTS ====================
    
    event PrivateJobCreated(
        uint256 indexed jobId,
        address indexed client,
        string title,
        uint256 budgetMin,
        uint256 budgetMax
    );
    
    event JobInvitationSent(
        uint256 indexed invitationId,
        uint256 indexed jobId,
        address indexed freelancer,
        string message
    );
    
    event InvitationResponded(
        uint256 indexed invitationId,
        address indexed freelancer,
        InvitationStatus status
    );
    
    event JobApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed applicant,
        uint256 proposedRate
    );
    
    event CollaborationGroupCreated(
        uint256 indexed groupId,
        uint256 indexed jobId,
        address[] applicants
    );
    
    event GroupDecisionMade(
        uint256 indexed groupId,
        address[] selectedApplicants,
        string[] projectGoals
    );
    
    event GroupProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed groupId,
        address indexed proposer,
        string title
    );
    
    event ProposalVoted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType vote
    );
    
    event ProposalDecided(
        uint256 indexed proposalId,
        ProposalStatus status
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyJobClient(uint256 _jobId) {
        require(privateJobs[_jobId].client == msg.sender, "Solo el cliente puede realizar esta accion");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(privateJobs[_jobId].jobId != 0, "Trabajo no existe");
        _;
    }
    
    modifier invitationExists(uint256 _invitationId) {
        require(jobInvitations[_invitationId].invitationId != 0, "Invitacion no existe");
        _;
    }
    
    modifier applicationExists(uint256 _applicationId) {
        require(jobApplications[_applicationId].applicationId != 0, "Aplicacion no existe");
        _;
    }
    
    modifier groupExists(uint256 _groupId) {
        require(collaborationGroups[_groupId].groupId != 0, "Grupo no existe");
        _;
    }
    
    modifier onlyGroupParticipant(uint256 _groupId) {
        CollaborationGroup storage group = collaborationGroups[_groupId];
        bool isParticipant = false;
        
        for (uint i = 0; i < group.applicants.length; i++) {
            if (group.applicants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        
        require(isParticipant || group.client == msg.sender, "Solo participantes del grupo");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {}
    
    // ==================== PRIVATE JOB FUNCTIONS ====================
    
    /**
     * @dev Crear un nuevo trabajo privado
     */
    function createPrivateJob(
        string memory _title,
        string memory _description,
        string[] memory _requirements,
        uint256 _budgetMin,
        uint256 _budgetMax,
        string memory _currency,
        string memory _timeline,
        string[] memory _skills
    ) external returns (uint256) {
        require(_budgetMin < _budgetMax, "Presupuesto minimo debe ser menor al maximo");
        require(bytes(_title).length > 0, "Titulo no puede estar vacio");
        require(bytes(_description).length > 0, "Descripcion no puede estar vacia");
        
        _jobIds.increment();
        uint256 newJobId = _jobIds.current();
        
        PrivateJob storage job = privateJobs[newJobId];
        job.jobId = newJobId;
        job.client = msg.sender;
        job.title = _title;
        job.description = _description;
        job.requirements = _requirements;
        job.budgetMin = _budgetMin;
        job.budgetMax = _budgetMax;
        job.currency = _currency;
        job.timeline = _timeline;
        job.skills = _skills;
        job.status = JobStatus.Draft;
        job.createdAt = block.timestamp;
        job.expiresAt = block.timestamp + 30 days;
        job.isActive = true;
        
        clientJobs[msg.sender].push(newJobId);
        
        emit PrivateJobCreated(newJobId, msg.sender, _title, _budgetMin, _budgetMax);
        
        return newJobId;
    }
    
    /**
     * @dev Actualizar un trabajo privado
     */
    function updatePrivateJob(
        uint256 _jobId,
        string memory _title,
        string memory _description,
        string[] memory _requirements,
        uint256 _budgetMin,
        uint256 _budgetMax,
        string memory _currency,
        string memory _timeline,
        string[] memory _skills
    ) external onlyJobClient(_jobId) jobExists(_jobId) {
        require(_budgetMin < _budgetMax, "Presupuesto minimo debe ser menor al maximo");
        
        PrivateJob storage job = privateJobs[_jobId];
        job.title = _title;
        job.description = _description;
        job.requirements = _requirements;
        job.budgetMin = _budgetMin;
        job.budgetMax = _budgetMax;
        job.currency = _currency;
        job.timeline = _timeline;
        job.skills = _skills;
    }
    
    /**
     * @dev Publicar un trabajo privado
     */
    function publishPrivateJob(uint256 _jobId) external onlyJobClient(_jobId) jobExists(_jobId) {
        privateJobs[_jobId].status = JobStatus.Published;
    }
    
    // ==================== INVITATION FUNCTIONS ====================
    
    /**
     * @dev Invitar un freelancer a un trabajo privado
     */
    function inviteFreelancer(
        uint256 _jobId,
        address _freelancer,
        string memory _message
    ) external onlyJobClient(_jobId) jobExists(_jobId) {
        require(_freelancer != address(0), "Direccion invalida");
        require(!privateJobs[_jobId].invitedFreelancers[_freelancer], "Freelancer ya fue invitado");
        
        _invitationIds.increment();
        uint256 newInvitationId = _invitationIds.current();
        
        JobInvitation storage invitation = jobInvitations[newInvitationId];
        invitation.invitationId = newInvitationId;
        invitation.jobId = _jobId;
        invitation.client = msg.sender;
        invitation.freelancer = _freelancer;
        invitation.message = _message;
        invitation.status = InvitationStatus.Pending;
        invitation.invitedAt = block.timestamp;
        
        privateJobs[_jobId].invitedFreelancers[_freelancer] = true;
        freelancerInvitations[_freelancer].push(newInvitationId);
        
        emit JobInvitationSent(newInvitationId, _jobId, _freelancer, _message);
    }
    
    /**
     * @dev Responder a una invitación
     */
    function respondToInvitation(
        uint256 _invitationId,
        InvitationStatus _status
    ) external invitationExists(_invitationId) {
        JobInvitation storage invitation = jobInvitations[_invitationId];
        require(invitation.freelancer == msg.sender, "Solo el freelancer invitado puede responder");
        require(invitation.status == InvitationStatus.Pending, "Invitacion ya fue respondida");
        
        invitation.status = _status;
        invitation.respondedAt = block.timestamp;
        
        emit InvitationResponded(_invitationId, msg.sender, _status);
    }
    
    // ==================== APPLICATION FUNCTIONS ====================
    
    /**
     * @dev Aplicar a un trabajo privado (solo freelancers invitados)
     */
    function applyToPrivateJob(
        uint256 _jobId,
        string memory _coverLetter,
        uint256 _proposedRate,
        string memory _estimatedTime,
        string[] memory _relevantExperience,
        string[] memory _portfolio
    ) external jobExists(_jobId) {
        require(privateJobs[_jobId].invitedFreelancers[msg.sender], "No estas invitado a este trabajo");
        require(!privateJobs[_jobId].hasApplied[msg.sender], "Ya aplicaste a este trabajo");
        require(bytes(_coverLetter).length > 0, "Carta de presentacion no puede estar vacia");
        require(_proposedRate > 0, "Tarifa propuesta debe ser mayor a 0");
        
        _applicationIds.increment();
        uint256 newApplicationId = _applicationIds.current();
        
        JobApplication storage application = jobApplications[newApplicationId];
        application.applicationId = newApplicationId;
        application.jobId = _jobId;
        application.applicant = msg.sender;
        application.coverLetter = _coverLetter;
        application.proposedRate = _proposedRate;
        application.estimatedTime = _estimatedTime;
        application.relevantExperience = _relevantExperience;
        application.portfolio = _portfolio;
        application.appliedAt = block.timestamp;
        application.status = ApplicationStatus.Pending;
        
        privateJobs[_jobId].hasApplied[msg.sender] = true;
        freelancerApplications[msg.sender].push(newApplicationId);
        
        emit JobApplicationSubmitted(newApplicationId, _jobId, msg.sender, _proposedRate);
    }
    
    // ==================== COLLABORATION GROUP FUNCTIONS ====================
    
    /**
     * @dev Crear un grupo de colaboración
     */
    function createCollaborationGroup(
        uint256 _jobId,
        address[] memory _applicants
    ) external onlyJobClient(_jobId) jobExists(_jobId) {
        require(_applicants.length >= 2, "Se necesitan al menos 2 aplicantes");
        
        // Verificar que todos los aplicantes aplicaron al trabajo
        for (uint i = 0; i < _applicants.length; i++) {
            require(privateJobs[_jobId].hasApplied[_applicants[i]], "Aplicante no aplico al trabajo");
        }
        
        _groupId.increment();
        uint256 newGroupId = _groupId.current();
        
        CollaborationGroup storage group = collaborationGroups[newGroupId];
        group.groupId = newGroupId;
        group.jobId = _jobId;
        group.client = msg.sender;
        group.applicants = _applicants;
        group.status = GroupStatus.Active;
        group.createdAt = block.timestamp;
        
        // Marcar aplicantes como en grupo
        for (uint i = 0; i < _applicants.length; i++) {
            privateJobs[_jobId].isInGroup[_applicants[i]] = true;
        }
        
        jobToGroup[_jobId] = newGroupId;
        
        emit CollaborationGroupCreated(newGroupId, _jobId, _applicants);
    }
    
    /**
     * @dev Tomar una decisión final del grupo
     */
    function makeGroupDecision(
        uint256 _groupId,
        address[] memory _selectedApplicants,
        string[] memory _projectGoals,
        uint256[] memory _deadlines,
        string memory _githubRepo
    ) external onlyGroupParticipant(_groupId) groupExists(_groupId) {
        CollaborationGroup storage group = collaborationGroups[_groupId];
        require(group.status == GroupStatus.Active, "Grupo no esta activo");
        
        group.selectedApplicants = _selectedApplicants;
        group.projectGoals = _projectGoals;
        group.deadlines = _deadlines;
        group.githubRepo = _githubRepo;
        group.status = GroupStatus.Decided;
        group.decidedAt = block.timestamp;
        
        emit GroupDecisionMade(_groupId, _selectedApplicants, _projectGoals);
    }
    
    // ==================== PROPOSAL FUNCTIONS ====================
    
    /**
     * @dev Crear una propuesta en el grupo
     */
    function createGroupProposal(
        uint256 _groupId,
        string memory _title,
        string memory _description,
        address[] memory _selectedApplicants,
        string memory _reasoning,
        uint256 _deadline
    ) external onlyGroupParticipant(_groupId) groupExists(_groupId) {
        require(bytes(_title).length > 0, "Titulo no puede estar vacio");
        require(_selectedApplicants.length > 0, "Debe seleccionar al menos un aplicante");
        
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();
        
        GroupProposal storage proposal = groupProposals[newProposalId];
        proposal.proposalId = newProposalId;
        proposal.groupId = _groupId;
        proposal.proposer = msg.sender;
        proposal.title = _title;
        proposal.description = _description;
        proposal.selectedApplicants = _selectedApplicants;
        proposal.reasoning = _reasoning;
        proposal.status = ProposalStatus.Active;
        proposal.deadline = _deadline;
        proposal.createdAt = block.timestamp;
        
        groupProposalsList[_groupId].push(newProposalId);
        
        emit GroupProposalCreated(newProposalId, _groupId, msg.sender, _title);
    }
    
    /**
     * @dev Votar en una propuesta
     */
    function voteOnProposal(
        uint256 _proposalId,
        VoteType _vote
    ) external {
        GroupProposal storage proposal = groupProposals[_proposalId];
        require(proposal.proposalId != 0, "Propuesta no existe");
        require(proposal.status == ProposalStatus.Active, "Propuesta no esta activa");
        require(block.timestamp <= proposal.deadline, "Tiempo de votacion expirado");
        
        // Verificar que el votante es participante del grupo
        CollaborationGroup storage group = collaborationGroups[proposal.groupId];
        bool isParticipant = false;
        
        for (uint i = 0; i < group.applicants.length; i++) {
            if (group.applicants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        
        require(isParticipant || group.client == msg.sender, "Solo participantes del grupo pueden votar");
        
        proposal.votes[msg.sender] = _vote;
        
        emit ProposalVoted(_proposalId, msg.sender, _vote);
    }
    
    /**
     * @dev Finalizar una propuesta (solo el cliente)
     */
    function finalizeProposal(uint256 _proposalId) external {
        GroupProposal storage proposal = groupProposals[_proposalId];
        require(proposal.proposalId != 0, "Propuesta no existe");
        require(proposal.status == ProposalStatus.Active, "Propuesta no esta activa");
        
        CollaborationGroup storage group = collaborationGroups[proposal.groupId];
        require(group.client == msg.sender, "Solo el cliente puede finalizar propuestas");
        
        // Contar votos
        uint256 yesVotes = 0;
        uint256 noVotes = 0;
        uint256 totalVotes = 0;
        
        for (uint i = 0; i < group.applicants.length; i++) {
            VoteType vote = proposal.votes[group.applicants[i]];
            if (vote == VoteType.Yes) yesVotes++;
            else if (vote == VoteType.No) noVotes++;
            if (vote != VoteType.None) totalVotes++;
        }
        
        // Verificar voto del cliente
        VoteType clientVote = proposal.votes[group.client];
        if (clientVote == VoteType.Yes) yesVotes++;
        else if (clientVote == VoteType.No) noVotes++;
        if (clientVote != VoteType.None) totalVotes++;
        
        // Decidir resultado
        if (yesVotes > noVotes) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
        
        emit ProposalDecided(_proposalId, proposal.status);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Obtener trabajos privados de un cliente
     */
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    /**
     * @dev Obtener aplicaciones de un freelancer
     */
    function getFreelancerApplications(address _freelancer) external view returns (uint256[] memory) {
        return freelancerApplications[_freelancer];
    }
    
    /**
     * @dev Obtener invitaciones de un freelancer
     */
    function getFreelancerInvitations(address _freelancer) external view returns (uint256[] memory) {
        return freelancerInvitations[_freelancer];
    }
    
    /**
     * @dev Obtener propuestas de un grupo
     */
    function getGroupProposals(uint256 _groupId) external view returns (uint256[] memory) {
        return groupProposalsList[_groupId];
    }
    
    /**
     * @dev Verificar si un freelancer fue invitado a un trabajo
     */
    function isFreelancerInvited(uint256 _jobId, address _freelancer) external view returns (bool) {
        return privateJobs[_jobId].invitedFreelancers[_freelancer];
    }
    
    /**
     * @dev Verificar si un freelancer aplicó a un trabajo
     */
    function hasFreelancerApplied(uint256 _jobId, address _freelancer) external view returns (bool) {
        return privateJobs[_jobId].hasApplied[_freelancer];
    }
    
    /**
     * @dev Obtener detalles de un trabajo privado
     */
    function getPrivateJobDetails(uint256 _jobId) external view returns (
        uint256 jobId,
        address client,
        string memory title,
        string memory description,
        uint256 budgetMin,
        uint256 budgetMax,
        string memory currency,
        string memory timeline,
        JobStatus status,
        uint256 createdAt,
        uint256 expiresAt,
        bool isActive
    ) {
        PrivateJob storage job = privateJobs[_jobId];
        return (
            job.jobId,
            job.client,
            job.title,
            job.description,
            job.budgetMin,
            job.budgetMax,
            job.currency,
            job.timeline,
            job.status,
            job.createdAt,
            job.expiresAt,
            job.isActive
        );
    }
}