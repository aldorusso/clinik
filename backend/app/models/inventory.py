"""
Modelos para el sistema de inventario médico
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.db.session import Base


class InventoryCategory(Base):
    """Categorías de productos del inventario"""
    __tablename__ = "inventory_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100), nullable=False)  # Ej: Gasas, Jeringas, Medicamentos
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Color hex para UI (#FF5733)
    icon = Column(String(50), nullable=True)  # Nombre del ícono
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="inventory_categories")
    products = relationship("InventoryProduct", back_populates="category")


class UnitType(str, enum.Enum):
    """Tipos de unidades de medida"""
    PIECES = "piezas"          # piezas (gasas, jeringas)
    MILLILITERS = "ml"         # mililitros (líquidos)
    GRAMS = "g"                # gramos (cremas, polvos)
    BOXES = "cajas"            # cajas (medicamentos)
    BOTTLES = "frascos"        # frascos
    VIALS = "viales"           # viales
    AMPOULES = "ampollas"      # ampollas
    TABLETS = "tabletas"       # tabletas
    CAPSULES = "cápsulas"      # cápsulas
    METERS = "metros"          # metros (vendas)


class InventoryProduct(Base):
    """Productos del inventario"""
    __tablename__ = "inventory_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("inventory_categories.id"), nullable=False)
    
    # Información básica
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(50), nullable=True)  # Código del producto
    barcode = Column(String(50), nullable=True)  # Código de barras
    
    # Unidades y medidas
    unit_type = Column(Enum(UnitType), nullable=False, default=UnitType.PIECES)
    unit_size = Column(Float, nullable=False, default=1.0)  # Tamaño de la unidad
    
    # Stock y alertas
    current_stock = Column(Integer, nullable=False, default=0)
    minimum_stock = Column(Integer, nullable=False, default=10)  # Alerta cuando esté por debajo
    maximum_stock = Column(Integer, nullable=True)  # Stock máximo recomendado
    
    # Información comercial
    cost_per_unit = Column(Float, nullable=True)  # Costo por unidad
    supplier = Column(String(200), nullable=True)  # Proveedor
    supplier_code = Column(String(100), nullable=True)  # Código del proveedor
    
    # Fechas importantes
    expiration_date = Column(DateTime(timezone=True), nullable=True)
    last_restock_date = Column(DateTime(timezone=True), nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    requires_prescription = Column(Boolean, default=False, nullable=False)  # Requiere receta
    is_controlled = Column(Boolean, default=False, nullable=False)  # Sustancia controlada
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="inventory_products")
    category = relationship("InventoryCategory", back_populates="products")
    stock_movements = relationship("InventoryMovement", back_populates="product")
    service_products = relationship("ServiceProduct", back_populates="product")
    appointment_usages = relationship("AppointmentInventoryUsage", back_populates="product")

    @property
    def is_low_stock(self) -> bool:
        """Verifica si el stock está bajo"""
        return self.current_stock <= self.minimum_stock

    @property
    def stock_percentage(self) -> float:
        """Porcentaje de stock actual vs máximo"""
        if self.maximum_stock and self.maximum_stock > 0:
            return (self.current_stock / self.maximum_stock) * 100
        return 100.0 if self.current_stock > self.minimum_stock else 0.0


class MovementType(str, enum.Enum):
    """Tipos de movimientos de inventario"""
    IN_PURCHASE = "compra"           # Compra de productos
    IN_DONATION = "donacion"         # Donación
    IN_RETURN = "devolucion"         # Devolución de paciente
    IN_ADJUSTMENT = "ajuste_entrada" # Ajuste de inventario (entrada)
    OUT_USAGE = "uso"                # Uso en servicio médico
    OUT_EXPIRED = "vencido"          # Producto vencido
    OUT_DAMAGED = "dañado"           # Producto dañado
    OUT_LOSS = "perdida"             # Pérdida de producto
    OUT_ADJUSTMENT = "ajuste_salida" # Ajuste de inventario (salida)


class InventoryMovement(Base):
    """Movimientos del inventario (entradas y salidas)"""
    __tablename__ = "inventory_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory_products.id"), nullable=False)
    
    # Detalles del movimiento
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)  # Positivo para entrada, negativo para salida
    unit_cost = Column(Float, nullable=True)  # Costo por unidad en este movimiento
    total_cost = Column(Float, nullable=True)  # Costo total del movimiento
    
    # Referencias
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # Quien hizo el movimiento
    
    # Información adicional
    notes = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)  # Número de factura, orden, etc.
    supplier = Column(String(200), nullable=True)  # Proveedor en caso de compra
    
    # Stock después del movimiento (para auditoría)
    stock_after = Column(Integer, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant = relationship("Tenant")
    product = relationship("InventoryProduct", back_populates="stock_movements")
    appointment = relationship("Appointment")
    user = relationship("User")


class ServiceProduct(Base):
    """Relación entre servicios médicos y productos de inventario"""
    __tablename__ = "service_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory_products.id"), nullable=False)
    
    # Cantidad que se usa por defecto en este servicio
    default_quantity = Column(Integer, nullable=False, default=1)
    is_required = Column(Boolean, default=False, nullable=False)  # Producto obligatorio para el servicio
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant")
    service = relationship("Service", back_populates="service_products")
    product = relationship("InventoryProduct", back_populates="service_products")


class AppointmentInventoryUsage(Base):
    """Uso de inventario en citas médicas"""
    __tablename__ = "appointment_inventory_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory_products.id"), nullable=False)
    
    # Detalles del uso
    quantity_used = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)  # Notas del doctor sobre el uso
    
    # Quien registró el uso
    recorded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant = relationship("Tenant")
    appointment = relationship("Appointment")
    product = relationship("InventoryProduct", back_populates="appointment_usages")
    recorded_by = relationship("User")


class InventoryAlert(Base):
    """Alertas de inventario"""
    __tablename__ = "inventory_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("inventory_products.id"), nullable=False)
    
    # Tipo de alerta
    alert_type = Column(String(50), nullable=False)  # "low_stock", "expired", "out_of_stock"
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Estado
    is_active = Column(Boolean, default=True, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant = relationship("Tenant")
    product = relationship("InventoryProduct")
    acknowledged_by = relationship("User")