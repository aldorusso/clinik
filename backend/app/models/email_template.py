from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.db.session import Base


class EmailTemplateType(str, enum.Enum):
    PASSWORD_RESET = "password_reset"
    WELCOME = "welcome"
    NOTIFICATION = "notification"
    USER_INVITATION = "user_invitation"


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    template_type = Column(SQLEnum(EmailTemplateType), unique=True, nullable=False)
    subject = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    variables = Column(Text, nullable=True)  # JSON string with available variables
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<EmailTemplate {self.name} ({self.template_type})>"
