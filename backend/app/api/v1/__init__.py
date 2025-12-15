from fastapi import APIRouter
from app.api.v1 import auth, users, email_templates, tenants, plans, system_config, audit_logs, notifications, leads, appointments, patients
from app.api.v1.endpoints import medical_history

api_router = APIRouter()

# Include authentication router
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include users router
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include tenants router (multi-tenant management)
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])

# Include email templates router
api_router.include_router(email_templates.router, prefix="/email-templates", tags=["email-templates"])

# Include plans router (subscription plans)
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])

# Include system config router
api_router.include_router(system_config.router, prefix="/system-config", tags=["system-config"])

# Include audit logs router
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])

# Include notifications router
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Include leads router (lead management system)
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])

# Include appointments router (appointment management system)
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])

# Include patients router (patient management with role-based access)
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])

# Include medical history router
api_router.include_router(medical_history.router, prefix="/medical", tags=["medical-history"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
