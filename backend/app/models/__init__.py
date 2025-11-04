# Import all models here for Alembic to detect them
from app.db.session import Base
from app.models.user import User, UserRole

__all__ = ["Base", "User", "UserRole"]
