"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { AppointmentCreate, api, User, Service } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "lucide-react"
import { Patient, isValidEmail, INITIAL_FORM_DATA } from "./appointment-form-types"
import { PatientInfoDisplay } from "./patient-info-display"
import { AppointmentFormFields } from "./appointment-form-fields"

interface ScheduleAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patient: Patient | null
}

export function ScheduleAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  patient
}: ScheduleAppointmentModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState<AppointmentCreate>(INITIAL_FORM_DATA)

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const [doctorsData, servicesData] = await Promise.all([
          api.getMyTenantUsers(token, 'medico'),
          api.getServices(token, { active_only: true })
        ])
        setDoctors(doctorsData)
        setServices(servicesData)
      } catch (error) {
        console.warn('Could not load data:', error)
        setDoctors([])
        setServices([])
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_id: patient.id,
        patient_name: patient.full_name || `${patient.first_name} ${patient.last_name}`,
        patient_phone: patient.phone || "",
        patient_email: patient.email || "",
        title: `Cita medica - ${patient.full_name || `${patient.first_name} ${patient.last_name}`}`
      }))
    }
  }, [patient])

  const handleFieldChange = (field: keyof AppointmentCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error",
        description: "No tienes autorizacion para realizar esta accion",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (!formData.provider_id) {
        toast({ title: "Error", description: "Debe seleccionar un medico", variant: "destructive" })
        setIsLoading(false)
        return
      }

      if (!formData.scheduled_at) {
        toast({ title: "Error", description: "Debe seleccionar fecha y hora de la cita", variant: "destructive" })
        setIsLoading(false)
        return
      }

      const appointmentData = {
        ...formData,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null,
        service_id: formData.service_id === "none" || formData.service_id === "" ? null : formData.service_id,
        patient_email: (() => {
          const email = formData.patient_email?.trim() || ''
          return email && isValidEmail(email) ? email : null
        })(),
      }

      await api.createAppointment(token, appointmentData as AppointmentCreate)

      toast({
        title: "Cita agendada",
        description: `Cita agendada exitosamente para ${patient?.full_name}`,
      })

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast({
        title: "Error",
        description: error.message || "Error al agendar la cita. Verifique los datos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Cita Medica
          </DialogTitle>
          <DialogDescription>
            Programar una nueva cita para {patient.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PatientInfoDisplay patient={patient} />

          <AppointmentFormFields
            formData={formData}
            doctors={doctors}
            services={services}
            onFieldChange={handleFieldChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" className="border-primary-foreground border-t-transparent" />
                  Agendando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendar Cita
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
