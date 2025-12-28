import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Stethoscope,
  RefreshCw,
} from "lucide-react"
import { AppointmentStatus } from "@/lib/api"

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = now.toDateString() === date.toDateString()

  if (isToday) {
    return `Hoy ${formatTime(dateString)}`
  }
  return `${formatDate(dateString)} ${formatTime(dateString)}`
}

export function getStatusBadge(status: AppointmentStatus) {
  const statusMap = {
    scheduled: { label: "Programada", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
    confirmed: { label: "Confirmada", variant: "default" as const, icon: CheckCircle, color: "text-blue-600" },
    in_progress: { label: "En Consulta", variant: "secondary" as const, icon: Stethoscope, color: "text-green-600" },
    completed: { label: "Completada", variant: "secondary" as const, icon: CheckCircle2, color: "text-green-600" },
    no_show: { label: "No Asistió", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    cancelled_by_patient: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    cancelled_by_clinic: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    rescheduled: { label: "Reprogramada", variant: "outline" as const, icon: RefreshCw, color: "text-orange-600" }
  }

  const statusInfo = statusMap[status] || {
    label: status,
    variant: "default" as const,
    icon: Clock,
    color: "text-gray-600"
  }
  const IconComponent = statusInfo.icon

  return (
    <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.color}`}>
      <IconComponent className="h-3 w-3" />
      {statusInfo.label}
    </Badge>
  )
}
