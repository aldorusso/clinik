from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_superadmin
from app.db.session import get_db
from app.models.system_config import SystemConfig
from app.models.user import User
from app.schemas.system_config import (
    SystemConfig as SystemConfigSchema,
    SystemConfigCreate,
    SystemConfigUpdate,
    SystemConfigBulkUpdate
)

router = APIRouter()


@router.get("/", response_model=List[SystemConfigSchema])
async def list_configs(
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Listar todas las configuraciones del sistema.
    Solo superadmins.
    """
    query = db.query(SystemConfig)

    if category:
        query = query.filter(SystemConfig.category == category)

    configs = query.order_by(SystemConfig.category, SystemConfig.key).all()
    return configs


@router.get("/by-key/{key}", response_model=SystemConfigSchema)
async def get_config_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Obtener una configuración por su clave."""
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracion no encontrada"
        )
    return config


@router.get("/{config_id}", response_model=SystemConfigSchema)
async def get_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Obtener una configuración por ID."""
    config = db.query(SystemConfig).filter(SystemConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracion no encontrada"
        )
    return config


@router.post("/", response_model=SystemConfigSchema, status_code=status.HTTP_201_CREATED)
async def create_config(
    config_in: SystemConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Crear una nueva configuración. Solo superadmins."""
    # Verificar que la clave no exista
    existing = db.query(SystemConfig).filter(SystemConfig.key == config_in.key).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una configuracion con esa clave"
        )

    db_config = SystemConfig(**config_in.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)

    return db_config


@router.put("/{config_id}", response_model=SystemConfigSchema)
async def update_config(
    config_id: UUID,
    config_in: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Actualizar una configuración. Solo superadmins."""
    config = db.query(SystemConfig).filter(SystemConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracion no encontrada"
        )

    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return config


@router.put("/by-key/{key}", response_model=SystemConfigSchema)
async def update_config_by_key(
    key: str,
    config_in: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Actualizar una configuración por clave. Solo superadmins."""
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracion no encontrada"
        )

    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return config


@router.post("/bulk-update", response_model=List[SystemConfigSchema])
async def bulk_update_configs(
    bulk_update: SystemConfigBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """
    Actualizar múltiples configuraciones a la vez.
    Crea las configuraciones si no existen.
    """
    updated_configs = []

    for key, value in bulk_update.configs.items():
        config = db.query(SystemConfig).filter(SystemConfig.key == key).first()

        if config:
            config.value = value
        else:
            config = SystemConfig(key=key, value=value)
            db.add(config)

        updated_configs.append(config)

    db.commit()

    # Refresh all configs
    for config in updated_configs:
        db.refresh(config)

    return updated_configs


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_config(
    config_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Eliminar una configuración. Solo superadmins."""
    config = db.query(SystemConfig).filter(SystemConfig.id == config_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuracion no encontrada"
        )

    db.delete(config)
    db.commit()

    return None
