from fastapi import APIRouter

api_router = APIRouter()

# Import and include routers here
# from app.api.v1 import scraper
# api_router.include_router(scraper.router, prefix="/scraper", tags=["scraper"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
