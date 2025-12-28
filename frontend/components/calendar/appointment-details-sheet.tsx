"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Stethoscope,
  CreditCard,
  Edit,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  Package
} from "lucide-react"
import { Appointment, AppointmentStatus } from "@/lib/api"

interface AppointmentDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onStatusUpdate: (appointmentId: string, status: AppointmentStatus) => void
  onEdit: (appointment: Appointment) => void
  onInventoryClick: () => void
}

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

function getStatusBadge(status: AppointmentStatus) {
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

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

export function AppointmentDetailsSheet({
  isOpen,
  onClose,
  appointment,
  onStatusUpdate,
  onEdit,
  onInventoryClick
}: AppointmentDetailsSheetProps) {
  if (!appointment) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalles de la Cita
          </SheetTitle>
          <SheetDescription>
            Información completa de la cita médica
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
              <p className="text-muted-foreground">{formatDateTime(appointment.scheduled_at)}</p>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <div className="grid gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Información del Paciente</Label>
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>{appointment.patient_phone}</span>
                </div>
                {appointment.patient_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{appointment.patient_email}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Información de la Cita</Label>
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span>{appointment.provider_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{appointment.duration_minutes} minutos</span>
                </div>
                {appointment.service_name && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                    <span>{appointment.service_name}</span>
                  </div>
                )}
              </div>
            </div>

            {appointment.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                <p className="mt-1 text-sm">{appointment.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {appointment.status === 'scheduled' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'confirmed')
                    onClose()
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Cita
                </Button>
              )}

              {appointment.status === 'confirmed' && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'in_progress')
                    onClose()
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Iniciar Consulta
                </Button>
              )}

              {appointment.status === 'in_progress' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'completed')
                    onClose()
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar Consulta
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`tel:${appointment.patient_phone}`, '_self')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(appointment)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>

              {/* Inventory button for scheduled/confirmed appointments */}
              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={onInventoryClick}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Usar Inventario
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
