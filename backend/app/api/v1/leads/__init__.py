"""Leads module - combines all lead-related routers."""
from fastapi import APIRouter

from .crud import router as crud_router
from .assignments import router as assignments_router
from .status import router as status_router
from .interactions import router as interactions_router
from .stats import router as stats_router
from .conversion import router as conversion_router

router = APIRouter()

# Include all sub-routers
# Stats first to ensure /stats/* routes match before /{lead_id}
router.include_router(stats_router)
router.include_router(crud_router)
router.include_router(assignments_router)
router.include_router(status_router)
router.include_router(interactions_router)
router.include_router(conversion_router)
