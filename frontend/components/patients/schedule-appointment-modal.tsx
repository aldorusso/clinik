"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Calendar, Clock, User as UserIcon } from "lucide-react"

// Email validation helper
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  
  const trimmedEmail = email.trim()
  
  // Check for obviously invalid characters
  if (trimmedEmail.includes('*') || trimmedEmail.includes('<') || trimmedEmail.includes('>') || trimmedEmail.includes(' ')) {
    return false
  }
  
  // Simple but effective email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(trimmedEmail) && trimmedEmail.indexOf('@') > 0 && trimmedEmail.lastIndexOf('.') > trimmedEmail.indexOf('@')
}

interface Patient {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

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

  // Form state
  const [formData, setFormData] = useState<AppointmentCreate>({
    patient_id: "",
    provider_id: "",
    service_id: "",
    scheduled_at: "",
    duration_minutes: 60,
    title: "",
    notes: "",
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    type: "consultation"
  })

  // Load doctors and services
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Load doctors and services in parallel
        const [doctorsData, servicesData] = await Promise.all([
          api.getMyTenantUsers(token, 'medico'), // Get users with role 'medico' (doctors)
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

  // Initialize form with patient data
  useEffect(() => {
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_id: patient.id,
        patient_name: patient.full_name || `${patient.first_name} ${patient.last_name}`,
        patient_phone: patient.phone || "",
        patient_email: patient.email || "",
        title: `Cita médica - ${patient.full_name || `${patient.first_name} ${patient.last_name}`}`
      }))
    }
  }, [patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error",
        description: "No tienes autorización para realizar esta acción",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Validate required fields
      if (!formData.provider_id) {
        toast({
          title: "Error",
          description: "Debe seleccionar un médico",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!formData.scheduled_at) {
        toast({
          title: "Error", 
          description: "Debe seleccionar fecha y hora de la cita",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Transform the data before sending
      console.log('Original form data email:', formData.patient_email)
      console.log('Email is valid:', formData.patient_email ? isValidEmail(formData.patient_email.trim()) : 'N/A')
      
      const appointmentData = {
        ...formData,
        // Convert datetime-local string to ISO datetime
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null,
        // Handle service_id - convert "none" or empty string to null
        service_id: formData.service_id === "none" || formData.service_id === "" ? null : formData.service_id,
        // Clean and validate email - remove if invalid
        patient_email: (() => {
          const email = formData.patient_email?.trim() || ''
          return email && isValidEmail(email) ? email : null
        })(),
      }
      
      console.log('Sending appointment data:', appointmentData)

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

  const resetForm = () => {
    setFormData({
      patient_id: "",
      provider_id: "",
      service_id: "",
      scheduled_at: "",
      duration_minutes: 60,
      title: "",
      notes: "",
      patient_name: "",
      patient_phone: "",
      patient_email: "",
      type: "consultation"
    })
  }

  const handleInputChange = (field: keyof AppointmentCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Calculate minimum datetime (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Cita Médica
          </DialogTitle>
          <DialogDescription>
            Programar una nueva cita para {patient.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Info Display */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserIcon className="h-4 w-4" />
              <span className="font-medium">Información del Paciente</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span> {patient.full_name}
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span> {patient.phone}
              </div>
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Médico *</Label>
            <Select 
              value={formData.provider_id} 
              onValueChange={(value) => handleInputChange('provider_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar médico" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} - {doctor.job_title || "Médico"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Cita</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consulta inicial/valoración</SelectItem>
                <SelectItem value="treatment">Sesión de tratamiento</SelectItem>
                <SelectItem value="follow_up">Seguimiento post-tratamiento</SelectItem>
                <SelectItem value="emergency">Emergencia o urgencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Servicio (opcional)</Label>
            <Select 
              value={formData.service_id || "none"} 
              onValueChange={(value) => handleInputChange('service_id', value === "none" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin servicio específico</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Fecha y Hora *</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                min={getMinDateTime()}
                onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Select 
                value={formData.duration_minutes?.toString() || "60"} 
                onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título de la cita</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej: Consulta de seguimiento, Primera consulta..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observaciones, preparación necesaria, etc."
              rows={3}
            />
          </div>

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