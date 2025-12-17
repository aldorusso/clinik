from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID
import json

from app.db.session import get_db
from app.models.audit_log import AuditLog, AuditAction, AuditCategory
from app.models.user import User, UserRole
from app.schemas.audit_log import (
    AuditLogResponse,
    AuditLogListResponse,
    AuditLogCreate,
    AuditStats,
)
from app.core.security import get_current_user

router = APIRouter()


# Helper function to create audit logs
def create_audit_log(
    db: Session,
    action: str,
    category: str = AuditCategory.AUTH,
    user_id: UUID = None,
    user_email: str = None,
    tenant_id: UUID = None,
    entity_type: str = None,
    entity_id: str = None,
    ip_address: str = None,
    user_agent: str = None,
    details: dict = None,
) -> AuditLog:
    """Helper function to create an audit log entry."""
    audit_log = AuditLog(
        action=action,
        category=category,
        user_id=user_id,
        user_email=user_email,
        tenant_id=tenant_id,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        ip_address=ip_address,
        user_agent=user_agent,
        details=json.dumps(details) if details else None,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    category: Optional[str] = None,
    user_id: Optional[UUID] = None,
    tenant_id: Optional[UUID] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List audit logs with filtering and pagination. Superadmin only."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can access audit logs")

    query = db.query(AuditLog)

    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    if category:
        query = query.filter(AuditLog.category == category)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    if search:
        query = query.filter(
            AuditLog.user_email.ilike(f"%{search}%")
            | AuditLog.ip_address.ilike(f"%{search}%")
            | AuditLog.details.ilike(f"%{search}%")
        )

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    logs = (
        query.order_by(desc(AuditLog.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats", response_model=AuditStats)
async def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get audit log statistics. Superadmin only."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can access audit stats")

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Total logs
    total_logs = db.query(func.count(AuditLog.id)).scalar()

    # Logins today
    logins_today = (
        db.query(func.count(AuditLog.id))
        .filter(
            and_(
                AuditLog.action == AuditAction.LOGIN_SUCCESS,
                AuditLog.timestamp >= today_start,
            )
        )
        .scalar()
    )

    # Failed logins today
    failed_logins_today = (
        db.query(func.count(AuditLog.id))
        .filter(
            and_(
                AuditLog.action == AuditAction.LOGIN_FAILED,
                AuditLog.timestamp >= today_start,
            )
        )
        .scalar()
    )

    # Actions by category
    category_counts = (
        db.query(AuditLog.category, func.count(AuditLog.id))
        .group_by(AuditLog.category)
        .all()
    )
    actions_by_category = {cat: count for cat, count in category_counts}

    # Recent critical actions (last 10)
    critical_actions = [
        AuditAction.TENANT_CREATED,
        AuditAction.TENANT_DELETED,
        AuditAction.TENANT_SUSPENDED,
        AuditAction.USER_DELETED,
        AuditAction.SYSTEM_CONFIG_CHANGED,
        AuditAction.PLAN_CHANGED,
    ]
    recent_critical = (
        db.query(AuditLog)
        .filter(AuditLog.action.in_(critical_actions))
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
        .all()
    )

    return AuditStats(
        total_logs=total_logs or 0,
        logins_today=logins_today or 0,
        failed_logins_today=failed_logins_today or 0,
        actions_by_category=actions_by_category,
        recent_critical_actions=[AuditLogResponse.model_validate(log) for log in recent_critical],
    )


@router.get("/actions", response_model=list[str])
async def list_available_actions(
    current_user: User = Depends(get_current_user),
):
    """List all available audit action types."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can access this")

    return [
        AuditAction.LOGIN_SUCCESS,
        AuditAction.LOGIN_FAILED,
        AuditAction.LOGOUT,
        AuditAction.PASSWORD_CHANGED,
        AuditAction.PASSWORD_RESET_REQUESTED,
        AuditAction.TENANT_CREATED,
        AuditAction.TENANT_UPDATED,
        AuditAction.TENANT_DELETED,
        AuditAction.TENANT_SUSPENDED,
        AuditAction.TENANT_ACTIVATED,
        AuditAction.USER_CREATED,
        AuditAction.USER_UPDATED,
        AuditAction.USER_DELETED,
        AuditAction.USER_ACTIVATED,
        AuditAction.USER_DEACTIVATED,
        AuditAction.PLAN_CHANGED,
        AuditAction.SYSTEM_CONFIG_CHANGED,
    ]


@router.get("/categories", response_model=list[str])
async def list_available_categories(
    current_user: User = Depends(get_current_user),
):
    """List all available audit categories."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can access this")

    return [
        AuditCategory.AUTH,
        AuditCategory.TENANT,
        AuditCategory.USER,
        AuditCategory.SYSTEM,
        AuditCategory.BILLING,
    ]


@router.get("/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single audit log entry. Superadmin only."""
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can access audit logs")

    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")

    return AuditLogResponse.model_validate(log)


# Tenant-specific activity log endpoints (for tenant_admin)
@router.get("/tenant/activity", response_model=AuditLogListResponse)
async def list_tenant_activity_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    category: Optional[str] = None,
    user_id: Optional[UUID] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List activity logs for the current tenant.
    Accessible by tenant_admin, manager, and user roles.
    Automatically filters by the user's tenant_id.
    """
    # Only allow tenant users (not superadmin or clients)
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=403,
            detail="Superadmin should use the main audit logs endpoint"
        )

    if current_user.role == UserRole.closer:
        raise HTTPException(
            status_code=403,
            detail="Clients cannot access activity logs"
        )

    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="User does not belong to a tenant"
        )

    query = db.query(AuditLog)

    # IMPORTANT: Always filter by tenant_id for security
    query = query.filter(AuditLog.tenant_id == current_user.tenant_id)

    # Apply additional filters
    if action:
        query = query.filter(AuditLog.action == action)
    if category:
        query = query.filter(AuditLog.category == category)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    if search:
        query = query.filter(
            AuditLog.user_email.ilike(f"%{search}%")
            | AuditLog.ip_address.ilike(f"%{search}%")
            | AuditLog.details.ilike(f"%{search}%")
        )

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    logs = (
        query.order_by(desc(AuditLog.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/tenant/stats", response_model=AuditStats)
async def get_tenant_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get activity log statistics for the current tenant.
    Accessible by tenant_admin, manager, and user roles.
    """
    # Only allow tenant users (not superadmin or clients)
    if current_user.role == UserRole.superadmin:
        raise HTTPException(
            status_code=403,
            detail="Superadmin should use the main audit stats endpoint"
        )

    if current_user.role == UserRole.closer:
        raise HTTPException(
            status_code=403,
            detail="Clients cannot access activity stats"
        )

    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="User does not belong to a tenant"
        )

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # All queries filtered by tenant_id
    tenant_filter = AuditLog.tenant_id == current_user.tenant_id

    # Total logs for this tenant
    total_logs = db.query(func.count(AuditLog.id)).filter(tenant_filter).scalar()

    # Logins today
    logins_today = (
        db.query(func.count(AuditLog.id))
        .filter(
            and_(
                tenant_filter,
                AuditLog.action == AuditAction.LOGIN_SUCCESS,
                AuditLog.timestamp >= today_start,
            )
        )
        .scalar()
    )

    # Failed logins today
    failed_logins_today = (
        db.query(func.count(AuditLog.id))
        .filter(
            and_(
                tenant_filter,
                AuditLog.action == AuditAction.LOGIN_FAILED,
                AuditLog.timestamp >= today_start,
            )
        )
        .scalar()
    )

    # Actions by category
    category_counts = (
        db.query(AuditLog.category, func.count(AuditLog.id))
        .filter(tenant_filter)
        .group_by(AuditLog.category)
        .all()
    )
    actions_by_category = {cat: count for cat, count in category_counts}

    # Recent important actions (last 10) - exclude some superadmin-only actions
    important_actions = [
        AuditAction.USER_CREATED,
        AuditAction.USER_DELETED,
        AuditAction.USER_ACTIVATED,
        AuditAction.USER_DEACTIVATED,
        AuditAction.PASSWORD_CHANGED,
        AuditAction.LOGIN_FAILED,  # Security concern
    ]
    recent_important = (
        db.query(AuditLog)
        .filter(
            and_(
                tenant_filter,
                AuditLog.action.in_(important_actions)
            )
        )
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
        .all()
    )

    return AuditStats(
        total_logs=total_logs or 0,
        logins_today=logins_today or 0,
        failed_logins_today=failed_logins_today or 0,
        actions_by_category=actions_by_category,
        recent_critical_actions=[AuditLogResponse.model_validate(log) for log in recent_important],
    )
