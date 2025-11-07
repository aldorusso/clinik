from fastapi import APIRouter
from app.api.v1 import auth, users

api_router = APIRouter()

# Include authentication router
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include users router
api_router.include_router(users.router, prefix="/users", tags=["users"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
