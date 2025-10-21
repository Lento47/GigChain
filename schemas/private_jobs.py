from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    IN_GROUP = "in_group"
    SELECTED = "selected"
    REJECTED = "rejected"

class GroupStatus(str, Enum):
    ACTIVE = "active"
    DECIDED = "decided"
    COMPLETED = "completed"

class MessageType(str, Enum):
    TEXT = "text"
    DECISION = "decision"
    PROPOSAL = "proposal"
    FILE = "file"

class VoteType(str, Enum):
    YES = "yes"
    NO = "no"
    ABSTAIN = "abstain"

# Esquemas para Trabajos Privados
class PrivateJobCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=50, max_length=5000)
    requirements: List[str] = Field(default_factory=list)
    budget_min: int = Field(..., gt=0)
    budget_max: int = Field(..., gt=0)
    currency: str = Field(default="USD")
    timeline: str = Field(..., min_length=10, max_length=100)
    skills: List[str] = Field(default_factory=list)

class PrivateJobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=5000)
    requirements: Optional[List[str]] = None
    budget_min: Optional[int] = Field(None, gt=0)
    budget_max: Optional[int] = Field(None, gt=0)
    currency: Optional[str] = None
    timeline: Optional[str] = Field(None, min_length=10, max_length=100)
    skills: Optional[List[str]] = None
    status: Optional[JobStatus] = None

class PrivateJobResponse(BaseModel):
    id: str
    client_id: str
    client_wallet: str
    title: str
    description: str
    requirements: List[str]
    budget_min: int
    budget_max: int
    currency: str
    timeline: str
    skills: List[str]
    visibility: str
    status: str
    created_at: datetime
    expires_at: datetime
    is_active: bool
    applications_count: int = 0
    invitations_count: int = 0

    class Config:
        from_attributes = True

# Esquemas para Invitaciones
class InvitationCreate(BaseModel):
    freelancer_wallet: str = Field(..., min_length=42, max_length=42)
    message: Optional[str] = Field(None, max_length=1000)

class InvitationResponse(BaseModel):
    id: str
    job_id: str
    client_id: str
    freelancer_id: str
    freelancer_wallet: str
    message: Optional[str]
    status: str
    invited_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True

class InvitationUpdate(BaseModel):
    status: InvitationStatus

# Esquemas para Aplicaciones
class JobApplicationCreate(BaseModel):
    cover_letter: str = Field(..., min_length=100, max_length=2000)
    proposed_rate: int = Field(..., gt=0)
    estimated_time: str = Field(..., min_length=5, max_length=50)
    relevant_experience: List[str] = Field(default_factory=list)
    portfolio: List[str] = Field(default_factory=list)

class JobApplicationResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    applicant_wallet: str
    cover_letter: str
    proposed_rate: int
    estimated_time: str
    relevant_experience: List[str]
    portfolio: List[str]
    applied_at: datetime
    status: str

    class Config:
        from_attributes = True

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus

# Esquemas para Grupos de Colaboración
class CollaborationGroupCreate(BaseModel):
    job_id: str
    applicants: List[str] = Field(..., min_items=2)

class CollaborationGroupResponse(BaseModel):
    id: str
    job_id: str
    client_id: str
    applicants: List[str]
    group_chat_id: Optional[str]
    status: str
    created_at: datetime
    decided_at: Optional[datetime]
    selected_applicants: Optional[List[str]]
    project_goals: Optional[List[str]]
    deadlines: Optional[List[str]]
    github_repo: Optional[str]

    class Config:
        from_attributes = True

class GroupDecision(BaseModel):
    selected_applicants: List[str] = Field(..., min_items=1)
    project_goals: List[str] = Field(..., min_items=1)
    deadlines: List[str] = Field(..., min_items=1)
    github_repo: Optional[str] = None

# Esquemas para Chat Grupal
class GroupChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[Dict[str, Any]] = None

class GroupChatMessageResponse(BaseModel):
    id: str
    group_id: str
    sender_id: str
    message: str
    message_type: str
    timestamp: datetime
    encrypted: bool
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

# Esquemas para Propuestas
class GroupProposalCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=50, max_length=2000)
    selected_applicants: List[str] = Field(..., min_items=1)
    reasoning: Optional[str] = Field(None, max_length=1000)
    deadline: Optional[datetime] = None

class GroupProposalResponse(BaseModel):
    id: str
    group_id: str
    proposer_id: str
    title: str
    description: str
    selected_applicants: List[str]
    reasoning: Optional[str]
    votes: Dict[str, str]
    status: str
    deadline: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ProposalVote(BaseModel):
    vote: VoteType

# Esquemas para Estadísticas
class PrivateJobStats(BaseModel):
    total_jobs: int
    active_jobs: int
    completed_jobs: int
    total_applications: int
    total_invitations: int
    total_groups: int
    active_groups: int

class GroupStats(BaseModel):
    group_id: str
    total_messages: int
    total_proposals: int
    active_proposals: int
    participants_count: int
    created_at: datetime
    last_activity: Optional[datetime]