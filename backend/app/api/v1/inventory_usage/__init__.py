"""Inventory usage module - combines all inventory usage related routers."""
from fastapi import APIRouter

from .service_products import router as service_products_router
from .appointment_usage import router as appointment_usage_router
from .auto_consume import router as auto_consume_router

router = APIRouter()

# Include all sub-routers
router.include_router(service_products_router)
router.include_router(appointment_usage_router)
router.include_router(auto_consume_router)
