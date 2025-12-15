from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base


class MedicalHistory(Base):
    __tablename__ = "medical_histories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    medic_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="medical_histories")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="patient_histories")
    medic = relationship("User", foreign_keys=[medic_id], back_populates="medic_histories")
    attachments = relationship("MedicalAttachment", back_populates="medical_history", cascade="all, delete-orphan")


class MedicalAttachment(Base):
    __tablename__ = "medical_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    medical_history_id = Column(UUID(as_uuid=True), ForeignKey("medical_histories.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, image, etc
    file_size = Column(String(50))
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="medical_attachments")
    medical_history = relationship("MedicalHistory", back_populates="attachments")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])