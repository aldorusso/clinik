from fastapi import APIRouter
from app.api.v1 import auth

api_router = APIRouter()

# Include authentication router
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
