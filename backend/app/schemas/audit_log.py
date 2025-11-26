from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuditLogBase(BaseModel):
    action: str
    category: str = "auth"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    tenant_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    id: UUID
    timestamp: datetime
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    tenant_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditLogFilter(BaseModel):
    action: Optional[str] = None
    category: Optional[str] = None
    user_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    entity_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AuditStats(BaseModel):
    total_logs: int
    logins_today: int
    failed_logins_today: int
    actions_by_category: dict[str, int]
    recent_critical_actions: list[AuditLogResponse]
