"""
GigChain Private Jobs API - Sistema de trabajos privados con grupos de colaboración
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
import logging
import json
import uuid
from datetime import datetime, timedelta

# Importar dependencias
from auth import get_database, get_current_wallet
from models.private_jobs import (
    PrivateJob, PrivateJobInvitation, JobApplication, 
    CollaborationGroup, GroupChatMessage, GroupProposal
)
from schemas.private_jobs import (
    PrivateJobCreate, PrivateJobUpdate, PrivateJobResponse,
    InvitationCreate, InvitationResponse, InvitationUpdate,
    JobApplicationCreate, JobApplicationResponse, ApplicationUpdate,
    CollaborationGroupCreate, CollaborationGroupResponse, GroupDecision,
    GroupChatMessageCreate, GroupChatMessageResponse,
    GroupProposalCreate, GroupProposalResponse, ProposalVote,
    PrivateJobStats, GroupStats
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router principal
router = APIRouter(prefix="/api/private-jobs", tags=["Private Jobs"])

# WebSocket connections para chat grupal
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)
        logger.info(f"Cliente conectado al grupo {group_id}")
    
    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
        logger.info(f"Cliente desconectado del grupo {group_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_group(self, message: str, group_id: str):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remover conexiones cerradas
                    self.active_connections[group_id].remove(connection)

manager = ConnectionManager()

# Middleware para verificar acceso a trabajos privados
async def verify_private_job_access(
    job_id: str,
    user_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database)
):
    """Verificar que el usuario tiene acceso al trabajo privado"""
    job = db.query(PrivateJob).filter(PrivateJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    
    # El cliente siempre tiene acceso
    if job.client_wallet == user_wallet:
        return job
    
    # Verificar si el freelancer fue invitado
    invitation = db.query(PrivateJobInvitation).filter(
        and_(
            PrivateJobInvitation.job_id == job_id,
            PrivateJobInvitation.freelancer_wallet == user_wallet,
            PrivateJobInvitation.status == "accepted"
        )
    ).first()
    
    if invitation:
        return job
    
    raise HTTPException(status_code=403, detail="Acceso denegado: Trabajo privado")

# ==================== TRABAJOS PRIVADOS ====================

@router.post("/", response_model=PrivateJobResponse)
async def create_private_job(
    job_data: PrivateJobCreate,
    client_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database)
):
    """Crear un nuevo trabajo privado"""
    try:
        # Validar que el presupuesto mínimo sea menor al máximo
        if job_data.budget_min >= job_data.budget_max:
            raise HTTPException(
                status_code=400, 
                detail="El presupuesto mínimo debe ser menor al máximo"
            )
        
        # Crear el trabajo privado
        private_job = PrivateJob(
            client_id=str(uuid.uuid4()),
            client_wallet=client_wallet,
            title=job_data.title,
            description=job_data.description,
            requirements=job_data.requirements,
            budget_min=job_data.budget_min,
            budget_max=job_data.budget_max,
            currency=job_data.currency,
            timeline=job_data.timeline,
            skills=job_data.skills,
            visibility="private",
            status="draft"
        )
        
        db.add(private_job)
        db.commit()
        db.refresh(private_job)
        
        logger.info(f"Trabajo privado creado: {private_job.id} por {client_wallet}")
        
        return PrivateJobResponse(
            id=private_job.id,
            client_id=private_job.client_id,
            client_wallet=private_job.client_wallet,
            title=private_job.title,
            description=private_job.description,
            requirements=private_job.requirements,
            budget_min=private_job.budget_min,
            budget_max=private_job.budget_max,
            currency=private_job.currency,
            timeline=private_job.timeline,
            skills=private_job.skills,
            visibility=private_job.visibility,
            status=private_job.status,
            created_at=private_job.created_at,
            expires_at=private_job.expires_at,
            is_active=private_job.is_active,
            applications_count=0,
            invitations_count=0
        )
        
    except Exception as e:
        logger.error(f"Error creando trabajo privado: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/", response_model=List[PrivateJobResponse])
async def get_private_jobs(
    client_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Obtener trabajos privados del cliente"""
    try:
        jobs = db.query(PrivateJob).filter(
            PrivateJob.client_wallet == client_wallet
        ).offset(skip).limit(limit).all()
        
        result = []
        for job in jobs:
            applications_count = db.query(JobApplication).filter(
                JobApplication.job_id == job.id
            ).count()
            
            invitations_count = db.query(PrivateJobInvitation).filter(
                PrivateJobInvitation.job_id == job.id
            ).count()
            
            result.append(PrivateJobResponse(
                id=job.id,
                client_id=job.client_id,
                client_wallet=job.client_wallet,
                title=job.title,
                description=job.description,
                requirements=job.requirements,
                budget_min=job.budget_min,
                budget_max=job.budget_max,
                currency=job.currency,
                timeline=job.timeline,
                skills=job.skills,
                visibility=job.visibility,
                status=job.status,
                created_at=job.created_at,
                expires_at=job.expires_at,
                is_active=job.is_active,
                applications_count=applications_count,
                invitations_count=invitations_count
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error obteniendo trabajos privados: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/{job_id}", response_model=PrivateJobResponse)
async def get_private_job(
    job_id: str,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Obtener un trabajo privado específico"""
    try:
        applications_count = db.query(JobApplication).filter(
            JobApplication.job_id == job_id
        ).count()
        
        invitations_count = db.query(PrivateJobInvitation).filter(
            PrivateJobInvitation.job_id == job_id
        ).count()
        
        return PrivateJobResponse(
            id=job.id,
            client_id=job.client_id,
            client_wallet=job.client_wallet,
            title=job.title,
            description=job.description,
            requirements=job.requirements,
            budget_min=job.budget_min,
            budget_max=job.budget_max,
            currency=job.currency,
            timeline=job.timeline,
            skills=job.skills,
            visibility=job.visibility,
            status=job.status,
            created_at=job.created_at,
            expires_at=job.expires_at,
            is_active=job.is_active,
            applications_count=applications_count,
            invitations_count=invitations_count
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo trabajo privado: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/{job_id}", response_model=PrivateJobResponse)
async def update_private_job(
    job_id: str,
    job_update: PrivateJobUpdate,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Actualizar un trabajo privado"""
    try:
        # Solo el cliente puede actualizar
        if job.client_wallet != get_current_wallet():
            raise HTTPException(status_code=403, detail="Solo el cliente puede actualizar el trabajo")
        
        # Actualizar campos proporcionados
        update_data = job_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)
        
        job.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(job)
        
        logger.info(f"Trabajo privado actualizado: {job_id}")
        
        return PrivateJobResponse(
            id=job.id,
            client_id=job.client_id,
            client_wallet=job.client_wallet,
            title=job.title,
            description=job.description,
            requirements=job.requirements,
            budget_min=job.budget_min,
            budget_max=job.budget_max,
            currency=job.currency,
            timeline=job.timeline,
            skills=job.skills,
            visibility=job.visibility,
            status=job.status,
            created_at=job.created_at,
            expires_at=job.expires_at,
            is_active=job.is_active,
            applications_count=0,
            invitations_count=0
        )
        
    except Exception as e:
        logger.error(f"Error actualizando trabajo privado: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== INVITACIONES ====================

@router.post("/{job_id}/invitations", response_model=InvitationResponse)
async def invite_freelancer(
    job_id: str,
    invitation_data: InvitationCreate,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Invitar un freelancer a un trabajo privado"""
    try:
        # Solo el cliente puede invitar
        if job.client_wallet != get_current_wallet():
            raise HTTPException(status_code=403, detail="Solo el cliente puede invitar freelancers")
        
        # Verificar que no esté ya invitado
        existing_invitation = db.query(PrivateJobInvitation).filter(
            and_(
                PrivateJobInvitation.job_id == job_id,
                PrivateJobInvitation.freelancer_wallet == invitation_data.freelancer_wallet
            )
        ).first()
        
        if existing_invitation:
            raise HTTPException(status_code=400, detail="El freelancer ya fue invitado a este trabajo")
        
        # Crear invitación
        invitation = PrivateJobInvitation(
            job_id=job_id,
            client_id=job.client_id,
            freelancer_id=str(uuid.uuid4()),
            freelancer_wallet=invitation_data.freelancer_wallet,
            message=invitation_data.message
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        logger.info(f"Invitación enviada a {invitation_data.freelancer_wallet} para trabajo {job_id}")
        
        return InvitationResponse(
            id=invitation.id,
            job_id=invitation.job_id,
            client_id=invitation.client_id,
            freelancer_id=invitation.freelancer_id,
            freelancer_wallet=invitation.freelancer_wallet,
            message=invitation.message,
            status=invitation.status,
            invited_at=invitation.invited_at,
            responded_at=invitation.responded_at
        )
        
    except Exception as e:
        logger.error(f"Error enviando invitación: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/{job_id}/invitations", response_model=List[InvitationResponse])
async def get_job_invitations(
    job_id: str,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Obtener invitaciones de un trabajo privado"""
    try:
        invitations = db.query(PrivateJobInvitation).filter(
            PrivateJobInvitation.job_id == job_id
        ).all()
        
        return [
            InvitationResponse(
                id=inv.id,
                job_id=inv.job_id,
                client_id=inv.client_id,
                freelancer_id=inv.freelancer_id,
                freelancer_wallet=inv.freelancer_wallet,
                message=inv.message,
                status=inv.status,
                invited_at=inv.invited_at,
                responded_at=inv.responded_at
            ) for inv in invitations
        ]
        
    except Exception as e:
        logger.error(f"Error obteniendo invitaciones: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== APLICACIONES ====================

@router.post("/{job_id}/apply", response_model=JobApplicationResponse)
async def apply_to_private_job(
    job_id: str,
    application_data: JobApplicationCreate,
    freelancer_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database)
):
    """Aplicar a un trabajo privado (solo freelancers invitados)"""
    try:
        # Verificar que el freelancer fue invitado
        invitation = db.query(PrivateJobInvitation).filter(
            and_(
                PrivateJobInvitation.job_id == job_id,
                PrivateJobInvitation.freelancer_wallet == freelancer_wallet,
                PrivateJobInvitation.status == "accepted"
            )
        ).first()
        
        if not invitation:
            raise HTTPException(status_code=403, detail="Debes ser invitado para aplicar a este trabajo")
        
        # Verificar que no haya aplicado ya
        existing_application = db.query(JobApplication).filter(
            and_(
                JobApplication.job_id == job_id,
                JobApplication.applicant_wallet == freelancer_wallet
            )
        ).first()
        
        if existing_application:
            raise HTTPException(status_code=400, detail="Ya aplicaste a este trabajo")
        
        # Crear aplicación
        application = JobApplication(
            job_id=job_id,
            applicant_id=str(uuid.uuid4()),
            applicant_wallet=freelancer_wallet,
            cover_letter=application_data.cover_letter,
            proposed_rate=application_data.proposed_rate,
            estimated_time=application_data.estimated_time,
            relevant_experience=application_data.relevant_experience,
            portfolio=application_data.portfolio
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        logger.info(f"Aplicación creada por {freelancer_wallet} para trabajo {job_id}")
        
        return JobApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            applicant_id=application.applicant_id,
            applicant_wallet=application.applicant_wallet,
            cover_letter=application.cover_letter,
            proposed_rate=application.proposed_rate,
            estimated_time=application.estimated_time,
            relevant_experience=application.relevant_experience,
            portfolio=application.portfolio,
            applied_at=application.applied_at,
            status=application.status
        )
        
    except Exception as e:
        logger.error(f"Error creando aplicación: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/{job_id}/applications", response_model=List[JobApplicationResponse])
async def get_job_applications(
    job_id: str,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Obtener aplicaciones de un trabajo privado"""
    try:
        applications = db.query(JobApplication).filter(
            JobApplication.job_id == job_id
        ).all()
        
        return [
            JobApplicationResponse(
                id=app.id,
                job_id=app.job_id,
                applicant_id=app.applicant_id,
                applicant_wallet=app.applicant_wallet,
                cover_letter=app.cover_letter,
                proposed_rate=app.proposed_rate,
                estimated_time=app.estimated_time,
                relevant_experience=app.relevant_experience,
                portfolio=app.portfolio,
                applied_at=app.applied_at,
                status=app.status
            ) for app in applications
        ]
        
    except Exception as e:
        logger.error(f"Error obteniendo aplicaciones: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== GRUPOS DE COLABORACIÓN ====================

@router.post("/{job_id}/collaboration-group", response_model=CollaborationGroupResponse)
async def create_collaboration_group(
    job_id: str,
    group_data: CollaborationGroupCreate,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Crear un grupo de colaboración para múltiples aplicaciones"""
    try:
        # Solo el cliente puede crear grupos
        if job.client_wallet != get_current_wallet():
            raise HTTPException(status_code=403, detail="Solo el cliente puede crear grupos de colaboración")
        
        # Verificar que hay al menos 2 aplicaciones
        applications = db.query(JobApplication).filter(
            JobApplication.job_id == job_id
        ).all()
        
        if len(applications) < 2:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 2 aplicaciones para crear un grupo")
        
        # Crear grupo de colaboración
        group = CollaborationGroup(
            job_id=job_id,
            client_id=job.client_id,
            applicants=group_data.applicants
        )
        
        db.add(group)
        db.commit()
        db.refresh(group)
        
        # Actualizar estado de aplicaciones a "in_group"
        for applicant_wallet in group_data.applicants:
            application = db.query(JobApplication).filter(
                and_(
                    JobApplication.job_id == job_id,
                    JobApplication.applicant_wallet == applicant_wallet
                )
            ).first()
            if application:
                application.status = "in_group"
        
        db.commit()
        
        logger.info(f"Grupo de colaboración creado: {group.id} para trabajo {job_id}")
        
        return CollaborationGroupResponse(
            id=group.id,
            job_id=group.job_id,
            client_id=group.client_id,
            applicants=group.applicants,
            group_chat_id=group.group_chat_id,
            status=group.status,
            created_at=group.created_at,
            decided_at=group.decided_at,
            selected_applicants=group.selected_applicants,
            project_goals=group.project_goals,
            deadlines=group.deadlines,
            github_repo=group.github_repo
        )
        
    except Exception as e:
        logger.error(f"Error creando grupo de colaboración: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/{job_id}/collaboration-group", response_model=CollaborationGroupResponse)
async def get_collaboration_group(
    job_id: str,
    job: PrivateJob = Depends(verify_private_job_access),
    db: Session = Depends(get_database)
):
    """Obtener el grupo de colaboración de un trabajo"""
    try:
        group = db.query(CollaborationGroup).filter(
            CollaborationGroup.job_id == job_id
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="No hay grupo de colaboración para este trabajo")
        
        return CollaborationGroupResponse(
            id=group.id,
            job_id=group.job_id,
            client_id=group.client_id,
            applicants=group.applicants,
            group_chat_id=group.group_chat_id,
            status=group.status,
            created_at=group.created_at,
            decided_at=group.decided_at,
            selected_applicants=group.selected_applicants,
            project_goals=group.project_goals,
            deadlines=group.deadlines,
            github_repo=group.github_repo
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo grupo de colaboración: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== CHAT GRUPAL ====================

@router.websocket("/{group_id}/chat")
async def websocket_endpoint(websocket: WebSocket, group_id: str):
    """WebSocket para chat grupal"""
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Guardar mensaje en base de datos
            message = GroupChatMessage(
                group_id=group_id,
                sender_id=message_data.get("sender_id"),
                message=message_data.get("message"),
                message_type=message_data.get("message_type", "text"),
                metadata=message_data.get("metadata")
            )
            
            db = next(get_database())
            db.add(message)
            db.commit()
            
            # Broadcast a todos los participantes del grupo
            await manager.broadcast_to_group(data, group_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)

@router.get("/{group_id}/messages", response_model=List[GroupChatMessageResponse])
async def get_group_messages(
    group_id: str,
    user_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Obtener mensajes del chat grupal"""
    try:
        # Verificar que el usuario tiene acceso al grupo
        group = db.query(CollaborationGroup).filter(
            CollaborationGroup.id == group_id
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Grupo no encontrado")
        
        if user_wallet not in group.applicants and user_wallet != group.client_id:
            raise HTTPException(status_code=403, detail="Acceso denegado al grupo")
        
        messages = db.query(GroupChatMessage).filter(
            GroupChatMessage.group_id == group_id
        ).order_by(GroupChatMessage.timestamp.desc()).offset(skip).limit(limit).all()
        
        return [
            GroupChatMessageResponse(
                id=msg.id,
                group_id=msg.group_id,
                sender_id=msg.sender_id,
                message=msg.message,
                message_type=msg.message_type,
                timestamp=msg.timestamp,
                encrypted=msg.encrypted,
                metadata=msg.metadata
            ) for msg in messages
        ]
        
    except Exception as e:
        logger.error(f"Error obteniendo mensajes del grupo: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== ESTADÍSTICAS ====================

@router.get("/stats/overview", response_model=PrivateJobStats)
async def get_private_jobs_stats(
    client_wallet: str = Depends(get_current_wallet),
    db: Session = Depends(get_database)
):
    """Obtener estadísticas de trabajos privados"""
    try:
        total_jobs = db.query(PrivateJob).filter(
            PrivateJob.client_wallet == client_wallet
        ).count()
        
        active_jobs = db.query(PrivateJob).filter(
            and_(
                PrivateJob.client_wallet == client_wallet,
                PrivateJob.status == "published"
            )
        ).count()
        
        completed_jobs = db.query(PrivateJob).filter(
            and_(
                PrivateJob.client_wallet == client_wallet,
                PrivateJob.status == "completed"
            )
        ).count()
        
        total_applications = db.query(JobApplication).join(PrivateJob).filter(
            PrivateJob.client_wallet == client_wallet
        ).count()
        
        total_invitations = db.query(PrivateJobInvitation).join(PrivateJob).filter(
            PrivateJob.client_wallet == client_wallet
        ).count()
        
        total_groups = db.query(CollaborationGroup).join(PrivateJob).filter(
            PrivateJob.client_wallet == client_wallet
        ).count()
        
        active_groups = db.query(CollaborationGroup).join(PrivateJob).filter(
            and_(
                PrivateJob.client_wallet == client_wallet,
                CollaborationGroup.status == "active"
            )
        ).count()
        
        return PrivateJobStats(
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            completed_jobs=completed_jobs,
            total_applications=total_applications,
            total_invitations=total_invitations,
            total_groups=total_groups,
            active_groups=active_groups
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")