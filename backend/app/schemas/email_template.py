from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.models.email_template import EmailTemplateType


class EmailTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    template_type: EmailTemplateType
    subject: str = Field(..., min_length=1, max_length=500)
    html_content: str = Field(..., min_length=1)
    variables: Optional[str] = None
    is_active: bool = True


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    html_content: Optional[str] = Field(None, min_length=1)
    variables: Optional[str] = None
    is_active: Optional[bool] = None


class EmailTemplate(EmailTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
