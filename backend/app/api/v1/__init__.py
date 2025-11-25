from fastapi import APIRouter
from app.api.v1 import auth, users, email_templates, tenants

api_router = APIRouter()

# Include authentication router
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include users router
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include tenants router (multi-tenant management)
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])

# Include email templates router
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["email-templates"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
