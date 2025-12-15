"""
Schemas de Pydantic para el sistema de inventario
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# Enums
class UnitTypeEnum(str, Enum):
    """Tipos de unidades de medida"""
    PIECES = "piezas"
    MILLILITERS = "ml"
    GRAMS = "g"
    BOXES = "cajas"
    BOTTLES = "frascos"
    VIALS = "viales"
    AMPOULES = "ampollas"
    TABLETS = "tabletas"
    CAPSULES = "cápsulas"
    METERS = "metros"


class MovementTypeEnum(str, Enum):
    """Tipos de movimientos de inventario"""
    IN_PURCHASE = "compra"
    IN_DONATION = "donacion"
    IN_RETURN = "devolucion"
    IN_ADJUSTMENT = "ajuste_entrada"
    OUT_USAGE = "uso"
    OUT_EXPIRED = "vencido"
    OUT_DAMAGED = "dañado"
    OUT_LOSS = "perdida"
    OUT_ADJUSTMENT = "ajuste_salida"


# InventoryCategory Schemas
class InventoryCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')  # Hex color
    icon: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class InventoryCategoryCreate(InventoryCategoryBase):
    pass


class InventoryCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class InventoryCategory(InventoryCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# InventoryProduct Schemas
class InventoryProductBase(BaseModel):
    category_id: str
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    unit_type: UnitTypeEnum = UnitTypeEnum.PIECES
    unit_size: float = Field(1.0, gt=0)
    current_stock: int = Field(0, ge=0)
    minimum_stock: int = Field(10, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    cost_per_unit: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=200)
    supplier_code: Optional[str] = Field(None, max_length=100)
    expiration_date: Optional[datetime] = None
    last_restock_date: Optional[datetime] = None
    is_active: bool = True
    requires_prescription: bool = False
    is_controlled: bool = False


class InventoryProductCreate(InventoryProductBase):
    pass


class InventoryProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=50)
    unit_type: Optional[UnitTypeEnum] = None
    unit_size: Optional[float] = Field(None, gt=0)
    minimum_stock: Optional[int] = Field(None, ge=0)
    maximum_stock: Optional[int] = Field(None, ge=0)
    cost_per_unit: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=200)
    supplier_code: Optional[str] = Field(None, max_length=100)
    expiration_date: Optional[datetime] = None
    last_restock_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    requires_prescription: Optional[bool] = None
    is_controlled: Optional[bool] = None


class InventoryProductStockUpdate(BaseModel):
    """Para actualizar solo el stock de un producto"""
    current_stock: int = Field(..., ge=0)
    movement_type: MovementTypeEnum
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    supplier: Optional[str] = None
    unit_cost: Optional[float] = Field(None, ge=0)


class InventoryProduct(InventoryProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    is_low_stock: bool
    stock_percentage: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Relaciones
    category: Optional[InventoryCategory] = None


class InventoryProductWithStats(InventoryProduct):
    """Producto con estadísticas adicionales"""
    total_movements: int = 0
    last_movement_date: Optional[datetime] = None
    total_used_this_month: int = 0
    days_until_expiry: Optional[int] = None


# InventoryMovement Schemas
class InventoryMovementBase(BaseModel):
    product_id: str
    movement_type: MovementTypeEnum
    quantity: int = Field(..., ne=0)  # No puede ser 0
    unit_cost: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    appointment_id: Optional[str] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    supplier: Optional[str] = Field(None, max_length=200)


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovement(InventoryMovementBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    user_id: str
    stock_after: int
    created_at: datetime
    
    # Relaciones
    product: Optional[InventoryProduct] = None


# ServiceProduct Schemas
class ServiceProductBase(BaseModel):
    service_id: str
    product_id: str
    default_quantity: int = Field(1, gt=0)
    is_required: bool = False
    is_active: bool = True


class ServiceProductCreate(ServiceProductBase):
    pass


class ServiceProductUpdate(BaseModel):
    default_quantity: Optional[int] = Field(None, gt=0)
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None


class ServiceProduct(ServiceProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Relaciones
    product: Optional[InventoryProduct] = None


# AppointmentInventoryUsage Schemas
class AppointmentInventoryUsageBase(BaseModel):
    appointment_id: str
    product_id: str
    quantity_used: int = Field(..., gt=0)
    notes: Optional[str] = None


class AppointmentInventoryUsageCreate(AppointmentInventoryUsageBase):
    pass


class AppointmentInventoryUsageUpdate(BaseModel):
    quantity_used: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None


class AppointmentInventoryUsage(AppointmentInventoryUsageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    recorded_by_id: str
    created_at: datetime
    
    # Relaciones
    product: Optional[InventoryProduct] = None


# InventoryAlert Schemas
class InventoryAlertBase(BaseModel):
    product_id: str
    alert_type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    message: str
    is_active: bool = True


class InventoryAlertCreate(InventoryAlertBase):
    pass


class InventoryAlertUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_acknowledged: Optional[bool] = None


class InventoryAlert(InventoryAlertBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    is_acknowledged: bool
    acknowledged_by_id: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime
    
    # Relaciones
    product: Optional[InventoryProduct] = None


# Schemas para reportes y estadísticas
class InventoryStats(BaseModel):
    """Estadísticas generales del inventario"""
    total_products: int
    total_categories: int
    products_low_stock: int
    products_out_of_stock: int
    products_expired: int
    products_expiring_soon: int
    total_inventory_value: float
    most_used_products: List[dict]
    recent_movements: List[dict]


class LowStockAlert(BaseModel):
    """Alerta de stock bajo"""
    product_id: str
    product_name: str
    current_stock: int
    minimum_stock: int
    category_name: str
    unit_type: str
    days_of_supply: Optional[int] = None


class ProductUsageReport(BaseModel):
    """Reporte de uso de producto"""
    product_id: str
    product_name: str
    category_name: str
    total_used: int
    total_purchased: int
    current_stock: int
    average_monthly_usage: float
    last_used_date: Optional[datetime] = None
    cost_per_unit: Optional[float] = None
    total_cost_consumed: Optional[float] = None


# Bulk operations
class BulkStockUpdate(BaseModel):
    """Actualización masiva de stock"""
    updates: List[dict] = Field(..., description="Lista de actualizaciones [{product_id, new_stock, movement_type, notes}]")
    movement_type: MovementTypeEnum
    notes: Optional[str] = None
    reference_number: Optional[str] = None


class ImportProductsRequest(BaseModel):
    """Importación masiva de productos"""
    products: List[InventoryProductCreate]
    category_id: Optional[str] = None
    create_category_if_not_exists: bool = False