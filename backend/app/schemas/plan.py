from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class PlanBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price_monthly: Decimal = Decimal("0")
    price_yearly: Decimal = Decimal("0")
    currency: str = "USD"
    max_users: int = 5
    max_clients: int = 10
    max_storage_gb: int = 1
    features: Optional[str] = None
    is_active: bool = True
    is_default: bool = False
    display_order: int = 0


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[Decimal] = None
    price_yearly: Optional[Decimal] = None
    currency: Optional[str] = None
    max_users: Optional[int] = None
    max_clients: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    display_order: Optional[int] = None


class Plan(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
