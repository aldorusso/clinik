# Import all models here for Alembic to detect them
from app.db.session import Base
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.email_template import EmailTemplate, EmailTemplateType

__all__ = [
    "Base",
    "Tenant",
    "User",
    "UserRole",
    "EmailTemplate",
    "EmailTemplateType",
]
