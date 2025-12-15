#!/usr/bin/env python3

import sys
import os

# Add the app directory to Python path
sys.path.append('/app')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

def reset_mgclinic_password():
    """
    Reset password for mgclinic@gmail.com
    """
    db = SessionLocal()
    
    try:
        # Find the user
        user = db.query(User).filter(User.email == "mgclinic@gmail.com").first()
        
        if not user:
            print("❌ Usuario mgclinic@gmail.com no encontrado")
            return
        
        # Update password
        new_password = "mgclinic123"  # New password
        user.hashed_password = get_password_hash(new_password)
        
        # Commit changes
        db.commit()
        
        print(f"✅ Password actualizado exitosamente para {user.email}")
        print(f"📧 Email: {user.email}")
        print(f"🔑 Password: {new_password}")
        print(f"👤 Rol: {user.role.value}")
        print(f"🏢 Tenant ID: {user.tenant_id}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Reseteando password para mgclinic@gmail.com...")
    reset_mgclinic_password()