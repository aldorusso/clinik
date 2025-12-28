from fastapi import APIRouter
from app.api.v1 import auth, users, email_templates, tenants, plans, system_config, audit_logs, notifications, leads, appointments, patients, services, commercial_stats, inventory, inventory_usage, patient_portal, tenant_settings
from app.api.v1.endpoints import medical_history, commercial_objectives

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

# Include services router
api_router.include_router(services.router, prefix="/services", tags=["services"])

# Include commercial objectives router (commercial performance and goals)
api_router.include_router(commercial_objectives.router, prefix="/commercial", tags=["commercial-objectives"])

# Include commercial stats router (commercial statistics and metrics)
api_router.include_router(commercial_stats.router, prefix="/commercial-stats", tags=["commercial-stats"])

# Include inventory router (inventory management system)
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])

# Include inventory usage router (inventory usage in appointments)
api_router.include_router(inventory_usage.router, prefix="/inventory-usage", tags=["inventory-usage"])

# Include patient portal router (patient-specific endpoints)
api_router.include_router(patient_portal.router, prefix="/patient-portal", tags=["patient-portal"])

# Include tenant settings router (tenant admin configuration)
api_router.include_router(tenant_settings.router, prefix="/tenant-settings", tags=["tenant-settings"])

# Include consent router (informed consent management system) - DISABLED
# api_router.include_router(consents.router, prefix="/consents", tags=["consents"])


@api_router.get("/")
async def api_root():
    return {"message": "API v1 is ready"}
