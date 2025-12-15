# Import all models here for Alembic to detect them
from app.db.session import Base
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.email_template import EmailTemplate, EmailTemplateType
from app.models.plan import Plan
from app.models.system_config import SystemConfig
from app.models.audit_log import AuditLog, AuditAction, AuditCategory
from app.models.notification import Notification, NotificationType

# Lead Management System Models
from app.models.lead import (
    Lead, LeadSource, LeadStatus, LeadPriority,
    LeadInteraction, LeadAssignment
)
from app.models.service import (
    ServiceCategory, Service, ServicePackage, ServiceProvider
)
from app.models.appointment import (
    Appointment, AppointmentStatus, AppointmentType,
    AppointmentAvailability, AppointmentBlock
)
from app.models.treatment import (
    Treatment, TreatmentStatus, TreatmentSession, MedicalRecord
)
from app.models.medical_history import (
    MedicalHistory, MedicalAttachment
)

__all__ = [
    # Base
    "Base",
    
    # Core Models
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
    "Notification",
    "NotificationType",
    
    # Lead Management Models
    "Lead",
    "LeadSource",
    "LeadStatus", 
    "LeadPriority",
    "LeadInteraction",
    "LeadAssignment",
    
    # Service Models
    "ServiceCategory",
    "Service",
    "ServicePackage",
    "ServiceProvider",
    
    # Appointment Models
    "Appointment",
    "AppointmentStatus",
    "AppointmentType",
    "AppointmentAvailability",
    "AppointmentBlock",
    
    # Treatment Models
    "Treatment",
    "TreatmentStatus",
    "TreatmentSession",
    "MedicalRecord",
    
    # Medical History Models
    "MedicalHistory",
    "MedicalAttachment",
]
