import { Badge } from "@/components/ui/badge"
import { Shield, UserCog, Briefcase, User as UserIcon, UserCheck } from "lucide-react"
import { UserRole } from "@/lib/api"

export const roleConfig: Record<UserRole, { label: string; icon: any; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  superadmin: { label: "Superadmin", icon: Shield, variant: "destructive" },
  tenant_admin: { label: "Admin", icon: UserCog, variant: "default" },
  manager: { label: "Manager", icon: Briefcase, variant: "secondary" },
  medico: { label: "Médico", icon: UserIcon, variant: "outline" },
  closer: { label: "Closer", icon: UserCheck, variant: "outline" },
  recepcionista: { label: "Recepcionista", icon: UserIcon, variant: "outline" },
  patient: { label: "Paciente", icon: UserIcon, variant: "outline" },
}

export function getRoleBadge(role: UserRole) {
  const config = roleConfig[role]
  if (!config) return <Badge variant="outline">{role}</Badge>

  const Icon = config.icon
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
