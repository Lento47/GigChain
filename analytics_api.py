"""
GigChain.io - Advanced Analytics API
REST API endpoints for analytics and metrics.
"""

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
import json
import asyncio

from analytics_system import (
    analytics_db,
    track_event,
    MetricType,
    TimePeriod,
    AnalyticsReport
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

# WebSocket connections for real-time updates
active_connections: List[WebSocket] = []

class EventTrackRequest(BaseModel):
    """Request model for tracking events."""
    metric_type: str = Field(..., description="Type of metric to track")
    value: float = Field(default=1.0, description="Metric value")
    user_id: Optional[str] = Field(None, description="User ID")
    contract_id: Optional[str] = Field(None, description="Contract ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class ContractTrackRequest(BaseModel):
    """Request model for tracking contracts."""
    contract_id: str
    contract_type: Optional[str] = None
    amount: Optional[float] = None
    duration_days: Optional[int] = None
    status: Optional[str] = None
    freelancer_id: Optional[str] = None
    client_id: Optional[str] = None
    category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/track/event")
async def track_event_endpoint(request: EventTrackRequest):
    """
    Track a custom event.
    
    This endpoint allows tracking any type of metric with custom metadata.
    """
    try:
        # Validate metric type
        try:
            metric_enum = MetricType(request.metric_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid metric type: {request.metric_type}"
            )
        
        # Track the event
        track_event(
            metric_type=metric_enum,
            value=request.value,
            user_id=request.user_id,
            contract_id=request.contract_id,
            **(request.metadata or {})
        )
        
        # Broadcast to WebSocket clients
        await broadcast_event({
            "type": "event_tracked",
            "metric_type": request.metric_type,
            "value": request.value,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "message": "Event tracked successfully",
            "metric_type": request.metric_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error tracking event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track/contract")
async def track_contract_endpoint(request: ContractTrackRequest):
    """
    Track contract data for analytics.
    
    This endpoint stores contract information for detailed analytics.
    """
    try:
        analytics_db.track_contract(
            contract_id=request.contract_id,
            contract_type=request.contract_type,
            amount=request.amount,
            duration_days=request.duration_days,
            status=request.status,
            created_at=datetime.now().isoformat(),
            freelancer_id=request.freelancer_id,
            client_id=request.client_id,
            category=request.category,
            metadata=request.metadata
        )
        
        # Broadcast to WebSocket clients
        await broadcast_event({
            "type": "contract_tracked",
            "contract_id": request.contract_id,
            "status": request.status,
            "amount": request.amount,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "message": "Contract tracked successfully",
            "contract_id": request.contract_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error tracking contract: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_metrics(
    metric_type: Optional[str] = Query(None, description="Filter by metric type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    contract_id: Optional[str] = Query(None, description="Filter by contract ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results")
):
    """
    Get metrics with optional filters.
    
    Returns a list of metrics matching the specified criteria.
    """
    try:
        metrics = analytics_db.get_metrics(
            metric_type=metric_type,
            start_date=start_date,
            end_date=end_date,
            user_id=user_id,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(metrics),
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/realtime")
async def get_realtime_metrics():
    """
    Get real-time metrics from cache.
    
    Returns the latest metrics for real-time dashboard updates.
    """
    try:
        metrics = analytics_db.get_realtime_metrics()
        
        return {
            "success": True,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/{period}")
async def get_analytics_report(period: str):
    """
    Generate comprehensive analytics report for a time period.
    
    Available periods: hour, day, week, month, year, all_time
    """
    try:
        # Validate period
        try:
            period_enum = TimePeriod(period)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid period: {period}. Must be one of: {[p.value for p in TimePeriod]}"
            )
        
        # Generate report
        report = analytics_db.generate_report(period_enum)
        
        return {
            "success": True,
            "report": {
                "period": report.period,
                "start_date": report.start_date,
                "end_date": report.end_date,
                "summary": {
                    "total_contracts": report.total_contracts,
                    "completed_contracts": report.completed_contracts,
                    "disputed_contracts": report.disputed_contracts,
                    "cancelled_contracts": report.cancelled_contracts,
                    "success_rate": round(report.success_rate, 2),
                    "total_volume": round(report.total_volume, 2),
                    "total_revenue": round(report.total_revenue, 2),
                    "active_users": report.active_users,
                    "new_users": report.new_users,
                    "avg_completion_time": round(report.avg_completion_time, 2),
                    "growth_rate": round(report.growth_rate, 2),
                    "user_retention": round(report.user_retention, 2)
                },
                "details": {
                    "top_categories": report.top_categories,
                    "ai_agent_usage": report.ai_agent_usage
                }
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/overview")
async def get_dashboard_overview():
    """
    Get overview data for the main dashboard.
    
    Returns key metrics and charts data for the dashboard.
    """
    try:
        # Get reports for multiple periods
        day_report = analytics_db.generate_report(TimePeriod.DAY)
        week_report = analytics_db.generate_report(TimePeriod.WEEK)
        month_report = analytics_db.generate_report(TimePeriod.MONTH)
        
        # Get real-time metrics
        realtime_metrics = analytics_db.get_realtime_metrics()
        
        return {
            "success": True,
            "overview": {
                "today": {
                    "contracts": day_report.total_contracts,
                    "volume": round(day_report.total_volume, 2),
                    "users": day_report.active_users,
                    "success_rate": round(day_report.success_rate, 2)
                },
                "this_week": {
                    "contracts": week_report.total_contracts,
                    "volume": round(week_report.total_volume, 2),
                    "users": week_report.active_users,
                    "growth": round(week_report.growth_rate, 2)
                },
                "this_month": {
                    "contracts": month_report.total_contracts,
                    "volume": round(month_report.total_volume, 2),
                    "revenue": round(month_report.total_revenue, 2),
                    "retention": round(month_report.user_retention, 2)
                }
            },
            "realtime": realtime_metrics,
            "charts": {
                "top_categories": month_report.top_categories[:5],
                "ai_agent_usage": month_report.ai_agent_usage
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/stats")
async def get_user_stats(user_id: str):
    """
    Get analytics stats for a specific user.
    
    Returns user-specific metrics and activity.
    """
    try:
        # Get user metrics
        metrics = analytics_db.get_metrics(user_id=user_id, limit=500)
        
        # Calculate user stats
        total_events = len(metrics)
        event_types = {}
        
        for metric in metrics:
            event_type = metric['metric_type']
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        return {
            "success": True,
            "user_id": user_id,
            "stats": {
                "total_events": total_events,
                "event_breakdown": event_types,
                "recent_activity": metrics[:10]
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def analytics_health_check():
    """Health check for analytics system."""
    try:
        # Try to get realtime metrics to verify database connection
        metrics = analytics_db.get_realtime_metrics()
        
        return {
            "status": "healthy",
            "service": "Analytics System",
            "version": "1.0.0",
            "database": "connected",
            "cached_metrics": len(metrics),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Analytics health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "Analytics System",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# WebSocket endpoint for real-time updates
@router.websocket("/ws/realtime")
async def websocket_realtime_analytics(websocket: WebSocket):
    """
    WebSocket endpoint for real-time analytics updates.
    
    Sends real-time metrics to connected clients.
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Send real-time metrics every 5 seconds
            metrics = analytics_db.get_realtime_metrics()
            
            await websocket.send_json({
                "type": "metrics_update",
                "metrics": metrics,
                "timestamp": datetime.now().isoformat()
            })
            
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected from analytics")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        active_connections.remove(websocket)

async def broadcast_event(event: Dict[str, Any]):
    """Broadcast event to all connected WebSocket clients."""
    for connection in active_connections[:]:  # Copy list to avoid modification issues
        try:
            await connection.send_json(event)
        except Exception as e:
            logger.error(f"Error broadcasting to WebSocket client: {str(e)}")
            try:
                active_connections.remove(connection)
            except ValueError:
                pass  # Already removed
