"""
GigChain.io - Template Marketplace API
REST API endpoints for template marketplace.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from template_marketplace import marketplace, TemplateCategory, TemplateLicense

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/marketplace", tags=["Template Marketplace"])

class ListTemplateRequest(BaseModel):
    """Request model for listing a template."""
    author: str = Field(..., description="Author's wallet address")
    title: str = Field(..., min_length=3, max_length=200, description="Template title")
    description: str = Field(..., min_length=10, max_length=2000, description="Template description")
    category: str = Field(..., description="Template category")
    price: float = Field(..., ge=0, description="Sale price (0 for free)")
    license_type: str = Field(..., description="License type")
    template_data: Dict[str, Any] = Field(..., description="Template JSON data")
    preview_image: Optional[str] = Field(None, description="Preview image URL")
    tags: Optional[List[str]] = Field(None, description="Template tags")

class PurchaseTemplateRequest(BaseModel):
    """Request model for purchasing a template."""
    template_id: str = Field(..., description="Template ID")
    buyer: str = Field(..., description="Buyer's wallet address")
    transaction_hash: Optional[str] = Field(None, description="Blockchain transaction hash")

class SubmitReviewRequest(BaseModel):
    """Request model for submitting a review."""
    template_id: str = Field(..., description="Template ID")
    reviewer: str = Field(..., description="Reviewer's wallet address")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5)")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")

@router.post("/list")
async def list_template(request: ListTemplateRequest):
    """
    List a new template for sale on the marketplace.
    
    Authors can monetize their contract templates by listing them for sale.
    """
    try:
        # Validate category
        if request.category not in [cat.value for cat in TemplateCategory]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {[cat.value for cat in TemplateCategory]}"
            )
        
        # Validate license type
        if request.license_type not in [lic.value for lic in TemplateLicense]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid license type. Must be one of: {[lic.value for lic in TemplateLicense]}"
            )
        
        template_id = marketplace.list_template(
            author=request.author,
            title=request.title,
            description=request.description,
            category=request.category,
            price=request.price,
            license_type=request.license_type,
            template_data=request.template_data,
            preview_image=request.preview_image,
            tags=request.tags
        )
        
        logger.info(f"Template {template_id} listed by {request.author}")
        
        return {
            "success": True,
            "template_id": template_id,
            "message": "Template listed successfully on marketplace",
            "marketplace_url": f"/marketplace/template/{template_id}",
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purchase")
async def purchase_template(request: PurchaseTemplateRequest):
    """
    Purchase a template from the marketplace.
    
    Buyers receive the full template data and license to use it.
    """
    try:
        purchase_id = marketplace.purchase_template(
            template_id=request.template_id,
            buyer=request.buyer,
            transaction_hash=request.transaction_hash
        )
        
        # Get template data
        template = marketplace.get_template(request.template_id)
        
        logger.info(f"Template {request.template_id} purchased by {request.buyer}")
        
        return {
            "success": True,
            "purchase_id": purchase_id,
            "template": template,
            "message": "Template purchased successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error purchasing template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/review")
async def submit_review(request: SubmitReviewRequest):
    """
    Submit a review for a purchased template.
    
    Helps other users make informed purchasing decisions.
    """
    try:
        review_id = marketplace.submit_review(
            template_id=request.template_id,
            reviewer=request.reviewer,
            rating=request.rating,
            comment=request.comment
        )
        
        return {
            "success": True,
            "review_id": review_id,
            "message": "Review submitted successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/template/{template_id}")
async def get_template(template_id: str):
    """
    Get detailed information about a template.
    
    Returns template metadata, preview, and reviews.
    """
    try:
        template = marketplace.get_template(template_id)
        
        if not template:
            raise HTTPException(
                status_code=404,
                detail=f"Template {template_id} not found"
            )
        
        return {
            "success": True,
            "template": template,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_rating: Optional[float] = Query(None, description="Minimum rating"),
    search_query: Optional[str] = Query(None, description="Search in title/description"),
    sort_by: str = Query("downloads", description="Sort by: downloads, rating, price_low, price_high, newest"),
    limit: int = Query(20, ge=1, le=100, description="Results limit")
):
    """
    Search templates with filters.
    
    Powerful search with category, price, and rating filters.
    """
    try:
        templates = marketplace.search_templates(
            category=category,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            search_query=search_query,
            sort_by=sort_by,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(templates),
            "templates": templates,
            "filters": {
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "min_rating": min_rating,
                "search_query": search_query,
                "sort_by": sort_by
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error searching templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_address}/purchases")
async def get_user_purchases(user_address: str):
    """
    Get all templates purchased by a user.
    
    Returns complete purchase history with template data.
    """
    try:
        purchases = marketplace.get_user_purchases(user_address)
        
        return {
            "success": True,
            "user_address": user_address,
            "purchase_count": len(purchases),
            "purchases": purchases,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user purchases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/author/{author_address}/templates")
async def get_author_templates(author_address: str):
    """
    Get all templates created by an author.
    
    Returns author's complete template catalog.
    """
    try:
        templates = marketplace.get_author_templates(author_address)
        
        return {
            "success": True,
            "author": author_address,
            "template_count": len(templates),
            "templates": templates,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting author templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/author/{author_address}/earnings")
async def get_author_earnings(author_address: str):
    """
    Get earnings statistics for an author.
    
    Returns sales, revenue, and rating data.
    """
    try:
        earnings = marketplace.get_author_earnings(author_address)
        
        return {
            "success": True,
            "earnings": earnings,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting author earnings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_marketplace_statistics():
    """
    Get marketplace statistics.
    
    Returns aggregate data about the marketplace.
    """
    try:
        stats = marketplace.get_marketplace_statistics()
        
        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting marketplace statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_categories():
    """
    Get all available template categories.
    
    Returns list of valid categories for filtering and listing.
    """
    categories = [
        {"value": cat.value, "label": cat.value.replace("_", " ").title()}
        for cat in TemplateCategory
    ]
    
    return {
        "success": True,
        "categories": categories,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/licenses")
async def get_license_types():
    """
    Get all available license types.
    
    Returns list of valid license types with descriptions.
    """
    licenses = [
        {
            "value": TemplateLicense.SINGLE_USE.value,
            "label": "Single Use",
            "description": "One-time use only"
        },
        {
            "value": TemplateLicense.MULTI_USE.value,
            "label": "Multi Use",
            "description": "Unlimited uses"
        },
        {
            "value": TemplateLicense.COMMERCIAL.value,
            "label": "Commercial",
            "description": "Commercial use allowed"
        },
        {
            "value": TemplateLicense.PERSONAL.value,
            "label": "Personal",
            "description": "Personal use only"
        }
    ]
    
    return {
        "success": True,
        "licenses": licenses,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health")
async def marketplace_health():
    """Health check for marketplace system."""
    try:
        stats = marketplace.get_marketplace_statistics()
        
        return {
            "status": "healthy",
            "service": "Template Marketplace",
            "version": "1.0.0",
            "total_templates": stats["total_templates"],
            "total_sales": stats["total_sales"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Marketplace health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "Template Marketplace",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
