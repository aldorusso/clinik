import {
  User,
  Shield,
  UserCog,
  Stethoscope,
  Briefcase,
  HeadphonesIcon,
  LucideIcon
} from "lucide-react"
import { User as UserType } from "@/lib/api"

export interface RoleInfo {
  label: string
  icon: LucideIcon
  variant: "default" | "secondary" | "destructive" | "outline"
  color: string
  bgColor: string
}

export function getRoleInfo(role: string): RoleInfo {
  switch (role) {
    case "tenant_admin":
      return {
        label: "Administrador",
        icon: Shield,
        variant: "destructive" as const,
        color: "text-red-600",
        bgColor: "bg-red-50"
      }
    case "manager":
      return {
        label: "Gestor de Leads",
        icon: UserCog,
        variant: "default" as const,
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      }
    case "medico":
      return {
        label: "Medico",
        icon: Stethoscope,
        variant: "secondary" as const,
        color: "text-green-600",
        bgColor: "bg-green-50"
      }
    case "closer":
      return {
        label: "Closer",
        icon: Briefcase,
        variant: "outline" as const,
        color: "text-purple-600",
        bgColor: "bg-purple-50"
      }
    case "recepcionista":
      return {
        label: "Recepcionista",
        icon: HeadphonesIcon,
        variant: "outline" as const,
        color: "text-orange-600",
        bgColor: "bg-orange-50"
      }
    default:
      return {
        label: "Usuario",
        icon: User,
        variant: "outline" as const,
        color: "text-gray-600",
        bgColor: "bg-gray-50"
      }
  }
}

export function getInitials(user: UserType): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  }
  if (user.first_name) {
    return user.first_name.slice(0, 2).toUpperCase()
  }
  if (user.full_name) {
    return user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function getDisplayName(user: UserType): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  if (user.full_name) {
    return user.full_name
  }
  return user.email
}

export interface UsersByRole {
  tenant_admin: UserType[]
  manager: UserType[]
  medico: UserType[]
  closer: UserType[]
  recepcionista: UserType[]
  others: UserType[]
}

export function groupUsersByRole(users: UserType[]): UsersByRole {
  return {
    tenant_admin: users.filter(u => u.role === "tenant_admin"),
    manager: users.filter(u => u.role === "manager"),
    medico: users.filter(u => u.role === "medico"),
    closer: users.filter(u => u.role === "closer"),
    recepcionista: users.filter(u => u.role === "recepcionista"),
    others: users.filter(u => !["tenant_admin", "manager", "medico", "closer", "recepcionista"].includes(u.role))
  }
}
