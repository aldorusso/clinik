from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class MedicalHistoryBase(BaseModel):
    content: str = Field(..., description="Medical history content/notes")


class MedicalHistoryCreate(MedicalHistoryBase):
    patient_id: UUID = Field(..., description="Patient ID")


class MedicalHistoryUpdate(MedicalHistoryBase):
    content: Optional[str] = None


class MedicalAttachmentBase(BaseModel):
    filename: str
    file_type: str
    file_size: Optional[str] = None


class MedicalAttachmentCreate(MedicalAttachmentBase):
    file_path: str


class MedicalAttachmentResponse(MedicalAttachmentBase):
    id: UUID
    uploaded_at: datetime
    uploaded_by_id: UUID
    
    class Config:
        from_attributes = True


class MedicalHistoryResponse(MedicalHistoryBase):
    id: UUID
    patient_id: UUID
    medic_id: UUID
    created_at: datetime
    updated_at: datetime
    attachments: List[MedicalAttachmentResponse] = []
    
    class Config:
        from_attributes = True


class MedicalHistoryListResponse(BaseModel):
    items: List[MedicalHistoryResponse]
    total: int
    page: int
    per_page: int
    pages: int