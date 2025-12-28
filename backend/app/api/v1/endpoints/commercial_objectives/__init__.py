"""Commercial objectives module - combines all objective-related routers."""
from fastapi import APIRouter

from .crud import router as crud_router
from .progress import router as progress_router
from .dashboard import router as dashboard_router
from .templates import router as templates_router

router = APIRouter()

# Include all sub-routers
# Dashboard first to ensure /dashboard/* routes match before /{objective_id}
router.include_router(dashboard_router)
# Templates
router.include_router(templates_router)
# Progress (has /objectives/{id}/progress)
router.include_router(progress_router)
# CRUD endpoints (includes /objectives/{objective_id} routes)
router.include_router(crud_router)
