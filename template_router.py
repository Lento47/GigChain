"""Template Router - Template Security Endpoints"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
import json
import hashlib
from datetime import datetime
from typing import Optional

# Import template security
from security.template_security import validate_template_security

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/templates", tags=["templates"])

# Pydantic models
class TemplateValidationRequest(BaseModel):
    template_json: str = Field(..., min_length=1, max_length=1048576, description="Template JSON string")
    user_id: Optional[str] = Field(None, description="User ID for audit logging")

class TemplateUploadRequest(BaseModel):
    template_data: dict = Field(..., description="Template data object")
    user_id: Optional[str] = Field(None, description="User ID for audit logging")

@router.post("/validate")
async def validate_template(request: TemplateValidationRequest):
    """
    Valida la seguridad de una plantilla JSON antes de procesarla.
    Endpoint crítico para prevenir ejecución de código malicioso.
    """
    try:
        logger.info(f"Validating template for user: {request.user_id or 'anonymous'}")
        
        # Validar seguridad de la plantilla
        validation_result = validate_template_security(request.template_json)
        
        # Log de seguridad
        if not validation_result.is_valid:
            logger.warning(f"Template validation failed for user {request.user_id}: {validation_result.errors}")
        else:
            logger.info(f"Template validation successful for user {request.user_id}, score: {validation_result.security_score}")
        
        return {
            "valid": validation_result.is_valid,
            "security_score": validation_result.security_score,
            "sanitized_template": validation_result.sanitized_data,
            "errors": validation_result.errors or [],
            "warnings": validation_result.warnings or [],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Template validation error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "valid": False,
                "error": "Error interno validando plantilla",
                "security_score": 0,
                "timestamp": datetime.now().isoformat()
            }
        )

@router.post("/upload")
async def upload_template(request: TemplateUploadRequest):
    """
    Sube una plantilla validada de manera segura.
    Solo acepta plantillas pre-validadas por el endpoint /validate.
    """
    try:
        logger.info(f"Uploading template for user: {request.user_id or 'anonymous'}")
        
        # Convertir a JSON string para validación
        template_json = json.dumps(request.template_data, ensure_ascii=False)
        
        # Validar seguridad
        validation_result = validate_template_security(template_json)
        
        if not validation_result.is_valid:
            logger.warning(f"Template upload rejected for user {request.user_id}: {validation_result.errors}")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Plantilla no válida",
                    "details": validation_result.errors,
                    "security_score": validation_result.security_score
                }
            )
        
        # Generar ID único y metadatos
        template_id = hashlib.sha256(template_json.encode()).hexdigest()[:16]
        sanitized_template = validation_result.sanitized_data.copy()
        
        # Añadir metadatos de seguridad
        sanitized_template.update({
            "id": template_id,
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": request.user_id or "anonymous",
            "security_validated": True,
            "security_score": validation_result.security_score
        })
        
        # Aquí se guardaría en base de datos en producción
        # Por ahora solo retornamos el template sanitizado
        
        logger.info(f"Template uploaded successfully: {template_id}")
        
        return {
            "success": True,
            "template_id": template_id,
            "template": sanitized_template,
            "security_score": validation_result.security_score,
            "warnings": validation_result.warnings or [],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Template upload error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Error interno subiendo plantilla",
                "timestamp": datetime.now().isoformat()
            }
        )

@router.get("/security/info")
async def template_security_info():
    """
    Información sobre las medidas de seguridad implementadas.
    """
    return {
        "security_measures": [
            "Validación de estructura JSON estricta",
            "Whitelist de campos permitidos",
            "Sanitización de contenido HTML/JS",
            "Detección de patrones peligrosos",
            "Límites de tamaño de archivo",
            "Validación de tipos de datos",
            "Escapado de caracteres especiales",
            "Audit logging de seguridad"
        ],
        "allowed_fields": [
            "name", "description", "category", "projectType", "skills",
            "pricing", "timeline", "deliverables", "terms", "createdAt",
            "id", "uploadedAt", "author", "rating", "downloads", "thumbnail"
        ],
        "max_file_size": "1MB",
        "max_field_length": "10KB",
        "security_score_threshold": 70,
        "version": "1.0.0"
    }
