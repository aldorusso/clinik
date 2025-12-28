"""Inventory module - combines all inventory-related routers."""
from fastapi import APIRouter

from .categories import router as categories_router
from .products import router as products_router
from .movements import router as movements_router
from .alerts import router as alerts_router
from .stats import router as stats_router

router = APIRouter()

# Include all sub-routers
router.include_router(categories_router)
router.include_router(products_router)
router.include_router(movements_router)
router.include_router(alerts_router)
router.include_router(stats_router)
