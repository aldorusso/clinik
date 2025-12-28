import { TenantWithStats } from "@/lib/api"

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function getTotalUsers(tenant: TenantWithStats): number {
  return tenant.tenant_admin_count + tenant.manager_count + tenant.user_count
}
