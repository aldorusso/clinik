"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Calendar, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail,
  Shield,
  UserCheck
} from "lucide-react"

interface PatientCardProps {
  patient: {
    id: string
    full_name: string
    first_name: string
    last_name: string
    email: string
    phone: string
    access_level: "full" | "limited" | "basic"
    can_view_details: boolean
    can_schedule: boolean
    is_active: boolean
  }
  currentUserRole: string
  onScheduleAppointment?: (patientId: string) => void
  onViewDetails?: (patientId: string) => void
}

export function PatientCard({ 
  patient, 
  currentUserRole,
  onScheduleAppointment, 
  onViewDetails 
}: PatientCardProps) {
  const isDoctor = currentUserRole === "user" // user = médico
  const isAdmin = currentUserRole === "tenant_admin"
  const isManager = currentUserRole === "manager"
  const canSeeFullDetails = isDoctor || isAdmin
  
  const getAccessLevelBadge = () => {
    switch (patient.access_level) {
      case "full":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Acceso Completo
          </Badge>
        )
      case "limited":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            Acceso Limitado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Básico
          </Badge>
        )
    }
  }

  const formatContactInfo = (info: string, isHidden: boolean) => {
    if (isHidden || patient.access_level === "limited") {
      return "***"
    }
    return info
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {patient.full_name}
              </h3>
              {getAccessLevelBadge()}
            </div>
          </div>
          {!patient.is_active && (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>

        {/* Contact Information - Based on Access Level */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{formatContactInfo(patient.email, patient.access_level === "limited")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{formatContactInfo(patient.phone, patient.access_level === "limited")}</span>
          </div>
        </div>

        {/* Access Level Information */}
        <div className="mb-4 p-2 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            {patient.access_level === "full" && "✓ Información médica completa"}
            {patient.access_level === "limited" && "⚠️ Solo información básica - Protección de datos médicos"}
            {patient.access_level === "basic" && "ℹ️ Información básica para agendamiento"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {patient.can_schedule && onScheduleAppointment && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onScheduleAppointment(patient.id)}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Agendar Cita
            </Button>
          )}
          
          {patient.can_view_details && canSeeFullDetails && onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(patient.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalles
            </Button>
          )}
          
          {!canSeeFullDetails && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Acceso médico requerido</span>
            </div>
          )}
        </div>

        {/* Role-specific Information */}
        <div className="mt-3 pt-2 border-t text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Tu rol: {currentUserRole === "user" ? "Médico" : 
                      currentUserRole === "manager" ? "Gestor" : 
                      currentUserRole === "client" ? "Comercial" : 
                      currentUserRole === "recepcionista" ? "Recepcionista" : 
                      currentUserRole}
            </span>
            {isDoctor && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-2 w-2 mr-1" />
                Acceso Médico
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}