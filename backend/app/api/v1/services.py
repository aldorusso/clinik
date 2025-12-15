from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_tenant_admin, get_current_tenant_member
from app.models.user import User
from app.models.service import Service, ServiceCategory
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    Service as ServiceResponse,
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
    ServiceCategory as ServiceCategoryResponse
)

router = APIRouter()


# ============================================
# SERVICE CATEGORIES ENDPOINTS
# ============================================

@router.get("/categories", response_model=List[ServiceCategoryResponse])
async def get_service_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    active_only: bool = Query(True, description="Show only active categories")
):
    """
    Get all service categories for the current tenant.
    Accessible by all tenant members.
    """
    query = db.query(ServiceCategory).filter(
        ServiceCategory.tenant_id == current_user.tenant_id
    )
    
    if active_only:
        query = query.filter(ServiceCategory.is_active == True)
    
    categories = query.order_by(ServiceCategory.display_order, ServiceCategory.name).all()
    return categories


@router.post("/categories", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_service_category(
    category_in: ServiceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a new service category.
    Only accessible by tenant admins.
    """
    # Check if category name already exists in this tenant
    existing = db.query(ServiceCategory).filter(
        ServiceCategory.tenant_id == current_user.tenant_id,
        ServiceCategory.name == category_in.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre"
        )
    
    category = ServiceCategory(
        tenant_id=current_user.tenant_id,
        name=category_in.name,
        description=category_in.description,
        icon=category_in.icon,
        color=category_in.color,
        display_order=category_in.display_order or 0,
        is_active=True
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@router.put("/categories/{category_id}", response_model=ServiceCategoryResponse)
async def update_service_category(
    category_id: UUID,
    category_in: ServiceCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Update a service category.
    Only accessible by tenant admins.
    """
    category = db.query(ServiceCategory).filter(
        ServiceCategory.id == category_id,
        ServiceCategory.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Update fields
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Delete a service category.
    Only accessible by tenant admins.
    """
    category = db.query(ServiceCategory).filter(
        ServiceCategory.id == category_id,
        ServiceCategory.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Check if category has services
    services_count = db.query(Service).filter(Service.category_id == category_id).count()
    if services_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar la categoría porque tiene {services_count} servicios asociados"
        )
    
    db.delete(category)
    db.commit()


# ============================================
# SERVICES ENDPOINTS
# ============================================

@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    category_id: Optional[UUID] = Query(None, description="Filter by category"),
    active_only: bool = Query(True, description="Show only active services"),
    featured_only: bool = Query(False, description="Show only featured services"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    order_by: str = Query("display_order", pattern=r"^(name|price_min|duration_minutes|created_at|display_order)$"),
    order_direction: str = Query("asc", pattern=r"^(asc|desc)$")
):
    """
    Get all services for the current tenant.
    Accessible by all tenant members.
    """
    query = db.query(Service).options(
        joinedload(Service.category)
    ).filter(
        Service.tenant_id == current_user.tenant_id
    )
    
    # Apply filters
    if category_id:
        query = query.filter(Service.category_id == category_id)
    
    if active_only:
        query = query.filter(Service.is_active == True)
    
    if featured_only:
        query = query.filter(Service.is_featured == True)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            Service.name.ilike(search_term) |
            Service.description.ilike(search_term) |
            Service.short_description.ilike(search_term)
        )
    
    # Apply ordering
    order_func = desc if order_direction == "desc" else asc
    if order_by == "name":
        query = query.order_by(order_func(Service.name))
    elif order_by == "price_min":
        query = query.order_by(order_func(Service.price_min))
    elif order_by == "duration_minutes":
        query = query.order_by(order_func(Service.duration_minutes))
    elif order_by == "created_at":
        query = query.order_by(order_func(Service.created_at))
    else:  # display_order
        query = query.order_by(order_func(Service.display_order), Service.name)
    
    services = query.all()
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Get a specific service by ID.
    Accessible by all tenant members.
    """
    service = db.query(Service).options(
        joinedload(Service.category)
    ).filter(
        Service.id == service_id,
        Service.tenant_id == current_user.tenant_id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    return service


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Create a new service.
    Only accessible by tenant admins.
    """
    # Verify category exists and belongs to tenant
    category = db.query(ServiceCategory).filter(
        ServiceCategory.id == service_in.category_id,
        ServiceCategory.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=400, detail="Categoría no válida")
    
    # Check if service name already exists in this tenant
    existing = db.query(Service).filter(
        Service.tenant_id == current_user.tenant_id,
        Service.name == service_in.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un servicio con ese nombre"
        )
    
    # Create service
    service_data = service_in.model_dump()
    service = Service(
        tenant_id=current_user.tenant_id,
        **service_data
    )
    
    db.add(service)
    db.commit()
    db.refresh(service)
    
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Update a service.
    Only accessible by tenant admins.
    """
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.tenant_id == current_user.tenant_id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # If updating category, verify it exists and belongs to tenant
    if service_in.category_id:
        category = db.query(ServiceCategory).filter(
            ServiceCategory.id == service_in.category_id,
            ServiceCategory.tenant_id == current_user.tenant_id
        ).first()
        
        if not category:
            raise HTTPException(status_code=400, detail="Categoría no válida")
    
    # Update fields
    update_data = service_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_admin)
):
    """
    Delete a service.
    Only accessible by tenant admins.
    """
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.tenant_id == current_user.tenant_id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Check if service has appointments or treatments
    from app.models.appointment import Appointment
    from app.models.treatment import Treatment
    
    appointments_count = db.query(Appointment).filter(Appointment.service_id == service_id).count()
    treatments_count = db.query(Treatment).filter(Treatment.service_id == service_id).count()
    
    if appointments_count > 0 or treatments_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el servicio porque tiene {appointments_count} citas y {treatments_count} tratamientos asociados"
        )
    
    db.delete(service)
    db.commit()