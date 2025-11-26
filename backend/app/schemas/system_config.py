from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class SystemConfigBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    category: str = "general"
    value_type: Literal["string", "number", "boolean", "json"] = "string"


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    value_type: Optional[Literal["string", "number", "boolean", "json"]] = None


class SystemConfig(SystemConfigBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemConfigBulkUpdate(BaseModel):
    """Para actualizar múltiples configuraciones a la vez"""
    configs: dict[str, str]  # {key: value, key2: value2, ...}
