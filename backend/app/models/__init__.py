# Import all models here for Alembic to detect them
from app.db.session import Base
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.email_template import EmailTemplate, EmailTemplateType
from app.models.plan import Plan
from app.models.system_config import SystemConfig
from app.models.audit_log import AuditLog, AuditAction, AuditCategory

__all__ = [
    "Base",
    "Tenant",
    "User",
    "UserRole",
    "EmailTemplate",
    "EmailTemplateType",
    "Plan",
    "SystemConfig",
    "AuditLog",
    "AuditAction",
    "AuditCategory",
]
