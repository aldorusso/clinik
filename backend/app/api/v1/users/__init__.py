"""Users module - combines all user-related routers."""
from fastapi import APIRouter

from .superadmin import router as superadmin_router
from .tenant_users import router as tenant_users_router
from .clients import router as clients_router

router = APIRouter()

# Include all sub-routers
# Superadmin endpoints (/, /invite, /{user_id}, /available-for-admin)
router.include_router(superadmin_router)
# Tenant user endpoints (/my-tenant/users, /my-tenant/invite)
router.include_router(tenant_users_router)
# Client endpoints (/my-tenant/clients, /my-tenant/clients/create, etc.)
router.include_router(clients_router)
