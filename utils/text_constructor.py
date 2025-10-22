"""
Text Constructor for Structured Contract Data
Converts form data into text format for AI processing
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pydantic import BaseModel


def construct_text_from_structured_data(data: 'BaseModel') -> str:
    """
    Construct text input from structured form data.
    
    Args:
        data: Structured contract request with all form fields
        
    Returns:
        str: Formatted text for AI contract generation
    """
    # Determine contract type based on role if not explicitly set
    contract_type = data.contractType or ("project" if data.role == "client" else "service")
    
    # Start with appropriate title
    text = ""
    if data.projectTitle:
        if contract_type == "service":
            text = f"Servicio: {data.projectTitle}. "
        else:
            text = f"Proyecto: {data.projectTitle}. "
    
    # Add description with context
    if contract_type == "service":
        text += f"Ofrezco: {data.description}"
    else:
        text += f"Necesito: {data.description}"
    
    # Add profile information
    if data.role == 'freelancer':
        if data.freelancerName:
            text += f" Freelancer: {data.freelancerName}"
        if data.freelancerTitle:
            text += f", {data.freelancerTitle}"
        if data.freelancerLocation:
            text += f" ({data.freelancerLocation})"
        if data.freelancerBio:
            text += f". {data.freelancerBio}"
        if data.freelancerSkills:
            text += f" Habilidades: {data.freelancerSkills}"
        if data.freelancerExperience:
            text += f" Experiencia: {data.freelancerExperience} años"
        if data.freelancerRate:
            text += f" Tarifa: ${data.freelancerRate}/hora"
        
        # For freelancer services, emphasize what they offer
        if contract_type == "service":
            if data.offeredAmount:
                text += f" Precio: ${data.offeredAmount} dolares."
            elif data.hourlyRate:
                text += f" Tarifa: ${data.hourlyRate}/hora."
        else:
            # For freelancer projects (rare case)
            if data.offeredAmount:
                text += f" Ofrezco ${data.offeredAmount} dolares."
            if data.requestedAmount:
                text += f" Cliente solicita ${data.requestedAmount} dolares."
    else:
        # Client profile information
        if data.clientName:
            text += f" Cliente: {data.clientName}"
        if data.clientCompany:
            text += f" ({data.clientCompany})"
        if data.clientLocation:
            text += f" - {data.clientLocation}"
        if data.clientBio:
            text += f". {data.clientBio}"
        
        # For client projects, emphasize budget
        if contract_type == "project":
            if data.requestedAmount:
                text += f" Presupuesto disponible: ${data.requestedAmount} dolares."
            elif data.fixedBudget:
                text += f" Presupuesto: ${data.fixedBudget} dolares."
        
        if data.offeredAmount:
            text += f" Freelancer ofrezco ${data.offeredAmount} dolares."
    
    if data.days:
        text += f" Proyecto de {data.days} días."
    
    # Add wallet information
    if data.freelancerWallet:
        text += f" Wallet freelancer: {data.freelancerWallet}."
    if data.clientWallet:
        text += f" Wallet cliente: {data.clientWallet}."
    
    # Add social links for credibility
    social_links = []
    if data.freelancerLinkedIn:
        social_links.append(f"LinkedIn: {data.freelancerLinkedIn}")
    if data.freelancerGithub:
        social_links.append(f"GitHub: {data.freelancerGithub}")
    if data.freelancerPortfolio:
        social_links.append(f"Portfolio: {data.freelancerPortfolio}")
    if data.freelancerX:
        social_links.append(f"X: {data.freelancerX}")
    
    if social_links:
        text += f" Enlaces: {', '.join(social_links)}."
    
    # Add frontend form fields
    if data.category:
        text += f" Categoría: {data.category}."
    
    if data.budgetType == 'fixed' and data.fixedBudget:
        text += f" Presupuesto fijo: ${data.fixedBudget}"
    elif data.budgetType == 'hourly' and data.hourlyRate:
        text += f" Tarifa por hora: ${data.hourlyRate}"
        if data.estimatedHours:
            text += f" Horas estimadas: {data.estimatedHours}"
    
    if data.projectDuration:
        text += f" Duración: {data.projectDuration} días"
    
    if data.requiredSkills:
        text += f" Habilidades requeridas: {data.requiredSkills}."
    
    if data.experienceLevel:
        text += f" Nivel de experiencia: {data.experienceLevel}."
    
    if data.deliverables:
        text += f" Entregables: {data.deliverables}."
    
    if data.milestones:
        text += f" Hitos: {data.milestones}."
    
    if data.additionalRequirements:
        text += f" Requisitos adicionales: {data.additionalRequirements}."
    
    if data.deadline:
        text += f" Fecha límite: {data.deadline}."
    
    return text

