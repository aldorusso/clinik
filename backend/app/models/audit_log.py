import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Who performed the action
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)  # Stored separately in case user is deleted

    # Tenant context (null for superadmin actions)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True)

    # Action details
    action = Column(String(50), nullable=False, index=True)  # LOGIN_SUCCESS, LOGIN_FAILED, etc.
    category = Column(String(30), nullable=False, default="auth", index=True)  # auth, tenant, user, system

    # Target entity (optional)
    entity_type = Column(String(50), nullable=True)  # user, tenant, plan, etc.
    entity_id = Column(String(50), nullable=True)  # UUID as string for flexibility

    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)

    # Additional details (JSON)
    details = Column(Text, nullable=True)  # JSON string for extra metadata

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    tenant = relationship("Tenant", foreign_keys=[tenant_id])


# Action constants
class AuditAction:
    # Authentication
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"

    # Tenant management
    TENANT_CREATED = "TENANT_CREATED"
    TENANT_UPDATED = "TENANT_UPDATED"
    TENANT_DELETED = "TENANT_DELETED"
    TENANT_SUSPENDED = "TENANT_SUSPENDED"
    TENANT_ACTIVATED = "TENANT_ACTIVATED"

    # User management
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DELETED = "USER_DELETED"
    USER_ACTIVATED = "USER_ACTIVATED"
    USER_DEACTIVATED = "USER_DEACTIVATED"

    # Plan/Subscription
    PLAN_CHANGED = "PLAN_CHANGED"

    # System
    SYSTEM_CONFIG_CHANGED = "SYSTEM_CONFIG_CHANGED"


class AuditCategory:
    AUTH = "auth"
    TENANT = "tenant"
    USER = "user"
    SYSTEM = "system"
    BILLING = "billing"
