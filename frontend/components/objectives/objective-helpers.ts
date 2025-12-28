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
