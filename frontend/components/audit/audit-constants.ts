import { LogIn, Building2, Users, Settings, Activity } from "lucide-react"

export const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOGIN_SUCCESS: { label: "Login Exitoso", variant: "default" },
  LOGIN_FAILED: { label: "Login Fallido", variant: "destructive" },
  LOGOUT: { label: "Logout", variant: "secondary" },
  PASSWORD_CHANGED: { label: "Cambio de Contraseña", variant: "outline" },
  PASSWORD_RESET_REQUESTED: { label: "Reset Password Solicitado", variant: "outline" },
  TENANT_CREATED: { label: "Tenant Creado", variant: "default" },
  TENANT_UPDATED: { label: "Tenant Actualizado", variant: "secondary" },
  TENANT_DELETED: { label: "Tenant Eliminado", variant: "destructive" },
  TENANT_SUSPENDED: { label: "Tenant Suspendido", variant: "destructive" },
  TENANT_ACTIVATED: { label: "Tenant Activado", variant: "default" },
  USER_CREATED: { label: "Usuario Creado", variant: "default" },
  USER_UPDATED: { label: "Usuario Actualizado", variant: "secondary" },
  USER_DELETED: { label: "Usuario Eliminado", variant: "destructive" },
  USER_ACTIVATED: { label: "Usuario Activado", variant: "default" },
  USER_DEACTIVATED: { label: "Usuario Desactivado", variant: "destructive" },
  PLAN_CHANGED: { label: "Plan Cambiado", variant: "outline" },
  SYSTEM_CONFIG_CHANGED: { label: "Config. Sistema Cambiada", variant: "outline" },
}

export const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  auth: { label: "Autenticación", icon: LogIn },
  tenant: { label: "Organizaciones", icon: Building2 },
  user: { label: "Usuarios", icon: Users },
  system: { label: "Sistema", icon: Settings },
  billing: { label: "Facturación", icon: Activity },
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function parseDetails(details?: string): Record<string, unknown> | null {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}
