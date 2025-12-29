import { Briefcase, Stethoscope, User as UserIcon, HeadphonesIcon, ShieldCheck } from "lucide-react"

export const roleConfig: Record<string, { label: string; icon: typeof Briefcase; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  tenant_admin: { label: "Administrador", icon: ShieldCheck, variant: "default" },
  manager: { label: "Gestor de Leads", icon: Briefcase, variant: "secondary" },
  medico: { label: "Médico", icon: Stethoscope, variant: "outline" },
  closer: { label: "Closer", icon: UserIcon, variant: "default" },
  recepcionista: { label: "Recepcionista", icon: HeadphonesIcon, variant: "outline" },
}

export const roleOptions = [
  { value: "manager", label: "Gestor de Leads", icon: Briefcase },
  { value: "medico", label: "Médico", icon: Stethoscope },
  { value: "closer", label: "Comercial", icon: UserIcon },
  { value: "recepcionista", label: "Recepcionista", icon: HeadphonesIcon },
] as const
