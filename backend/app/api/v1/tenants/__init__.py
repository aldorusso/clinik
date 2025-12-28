"""Tenants module - combines all tenant-related routers."""
from fastapi import APIRouter

from .crud import router as crud_router
from .users import router as users_router

router = APIRouter()

# Include all sub-routers
# CRUD first (includes /, /stats, /{tenant_id}, etc.)
router.include_router(crud_router)
# User management (/{tenant_id}/users)
router.include_router(users_router)
