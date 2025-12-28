"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarCheck, Stethoscope, X } from "lucide-react"
import { User, AppointmentType } from "@/lib/api"

export interface AppointmentFormData {
  patient_name: string
  patient_phone: string
  patient_email: string
  provider_id: string
  service_id: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  notes: string
  type: AppointmentType
}

interface AppointmentFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  title: string
  description: string
  submitLabel: string
  formData: AppointmentFormData
  onFormChange: (data: AppointmentFormData) => void
  providers: User[]
  isEdit?: boolean
}

export function AppointmentFormDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitLabel,
  formData,
  onFormChange,
  providers,
  isEdit = false
}: AppointmentFormDialogProps) {
  const updateField = <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) => {
    onFormChange({ ...formData, [field]: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_name">Nombre del Paciente *</Label>
              <Input
                id="patient_name"
                placeholder="Nombre completo"
                value={formData.patient_name}
                onChange={(e) => updateField('patient_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient_phone">Teléfono *</Label>
              <Input
                id="patient_phone"
                placeholder="+52 55 1234 5678"
                value={formData.patient_phone}
                onChange={(e) => updateField('patient_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient_email">Email (Opcional)</Label>
            <Input
              id="patient_email"
              type="email"
              placeholder="email@ejemplo.com"
              value={formData.patient_email}
              onChange={(e) => updateField('patient_email', e.target.value)}
            />
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider_id">Médico/Especialista *</Label>
              <Select value={formData.provider_id} onValueChange={(value) => updateField('provider_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar médico" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {provider.full_name || `${provider.first_name} ${provider.last_name}`}
                        {provider.job_title && (
                          <span className="text-xs text-muted-foreground">• {provider.job_title}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duración (min)</Label>
              <Select
                value={String(formData.duration_minutes)}
                onValueChange={(value) => updateField('duration_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                  <SelectItem value="120">120 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => updateField('scheduled_date', e.target.value)}
                min={isEdit ? undefined : new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Hora *</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => updateField('scheduled_time', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Motivo de la consulta, síntomas, etc."
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={onSubmit} className={isEdit ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90 text-primary-foreground"}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
