"""Auth module - combines all auth-related routers."""
from fastapi import APIRouter

from .login import router as login_router
from .password import router as password_router
from .profile import router as profile_router
from .invitation import router as invitation_router

router = APIRouter()

# Include all sub-routers
router.include_router(login_router)
router.include_router(password_router)
router.include_router(profile_router)
router.include_router(invitation_router)
