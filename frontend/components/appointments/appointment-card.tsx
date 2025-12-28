"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Edit,
  Mail,
  CreditCard,
  Stethoscope,
  UserPlus,
  MessageSquare,
} from "lucide-react"
import { Appointment, AppointmentStatus } from "@/lib/api"
import { getStatusBadge, formatDateTime } from "./appointment-helpers"

interface AppointmentCardProps {
  appointment: Appointment
  onStatusUpdate: (id: string, status: AppointmentStatus) => void
}

export function AppointmentCard({ appointment, onStatusUpdate }: AppointmentCardProps) {
  const cita = appointment

  return (
    <div
      className={`border rounded-lg p-5 hover:bg-muted/50 transition-colors ${
        cita.is_today ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
      } ${
        cita.is_past_due && cita.status !== 'completed' ? 'border-l-4 border-l-red-500 bg-red-50/50' : ''
      } ${
        cita.status === 'in_progress' ? 'border-l-4 border-l-green-500 bg-green-50/50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{cita.patient_name}</h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(cita.status)}
                {cita.is_today && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    HOY
                  </Badge>
                )}
                {cita.is_past_due && cita.status !== 'completed' && (
                  <Badge variant="destructive" className="text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    RETRASADA
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{formatDateTime(cita.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              <span>{cita.provider_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 text-green-600" />
              <span>{cita.patient_phone}</span>
            </div>
          </div>

          {(cita.service_name || cita.notes) && (
            <div className="text-sm space-y-1">
              {cita.service_name && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <span><strong>Servicio:</strong> {cita.service_name}</span>
                </div>
              )}
              {cita.notes && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
                  <span className="text-muted-foreground">{cita.notes}</span>
                </div>
              )}
            </div>
          )}

          {cita.patient_email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {cita.patient_email}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {cita.status === 'scheduled' && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate(cita.id, 'confirmed')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
          )}

          {cita.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate(cita.id, 'in_progress')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          )}

          {cita.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => onStatusUpdate(cita.id, 'completed')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completar
            </Button>
          )}

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`tel:${cita.patient_phone}`, '_self')}
              className="flex-1"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
