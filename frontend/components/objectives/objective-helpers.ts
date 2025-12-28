import { ObjectiveType } from "@/lib/api"
import {
  Target,
  Users,
  DollarSign,
  Calendar,
  PhoneCall,
  MessageSquare,
  Award,
  LucideIcon
} from "lucide-react"

export const getTypeIcon = (type: ObjectiveType): LucideIcon => {
  const icons: Record<ObjectiveType, LucideIcon> = {
    leads: Users,
    conversions: Target,
    revenue: DollarSign,
    appointments: Calendar,
    calls: PhoneCall,
    meetings: MessageSquare,
    satisfaction: Award
  }
  return icons[type] || Target
}

export const getTypeLabel = (type: ObjectiveType): string => {
  const labels: Record<ObjectiveType, string> = {
    leads: "Leads",
    conversions: "Conversiones",
    revenue: "Ingresos",
    appointments: "Citas",
    calls: "Llamadas",
    meetings: "Reuniones",
    satisfaction: "Satisfacción"
  }
  return labels[type] || type
}

export type ObjectivePeriod = "weekly" | "monthly" | "quarterly" | "yearly"

export function getPeriodLabel(period: ObjectivePeriod): string {
  const labels: Record<ObjectivePeriod, string> = {
    weekly: "Semanal",
    monthly: "Mensual",
    quarterly: "Trimestral",
    yearly: "Anual"
  }
  return labels[period] || period
}

export function formatValue(type: ObjectiveType, value: number, unit?: string): string {
  if (unit) {
    return `${value} ${unit}`
  }

  if (type === "revenue") {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }
  if (type === "satisfaction") {
    return `${value}/5`
  }
  return value.toString()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value)
}
