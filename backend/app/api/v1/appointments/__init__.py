"""Appointments module - combines all appointment-related routers."""
from fastapi import APIRouter

from .crud import router as crud_router
from .status import router as status_router
from .stats import router as stats_router
from .patient import router as patient_router

router = APIRouter()

# Include all sub-routers
# Stats first to ensure /stats/* routes match before /{appointment_id}
router.include_router(stats_router)
# Patient endpoints
router.include_router(patient_router)
# CRUD endpoints (includes /{appointment_id} routes)
router.include_router(crud_router)
# Status update
router.include_router(status_router)
