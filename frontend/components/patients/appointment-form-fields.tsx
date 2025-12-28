"use client"

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
import { User, Service, AppointmentCreate } from "@/lib/api"
import { getMinDateTime, APPOINTMENT_TYPES, DURATION_OPTIONS } from "./appointment-form-types"

interface AppointmentFormFieldsProps {
  formData: AppointmentCreate
  doctors: User[]
  services: Service[]
  onFieldChange: (field: keyof AppointmentCreate, value: any) => void
}

export function AppointmentFormFields({
  formData,
  doctors,
  services,
  onFieldChange
}: AppointmentFormFieldsProps) {
  return (
    <>
      {/* Doctor Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider">Medico *</Label>
        <Select
          value={formData.provider_id}
          onValueChange={(value) => onFieldChange('provider_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar medico" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.first_name} {doctor.last_name} - {doctor.job_title || "Medico"}
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
          onValueChange={(value) => onFieldChange('type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Selection */}
      <div className="space-y-2">
        <Label htmlFor="service">Servicio (opcional)</Label>
        <Select
          value={formData.service_id || "none"}
          onValueChange={(value) => onFieldChange('service_id', value === "none" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin servicio especifico</SelectItem>
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
            onChange={(e) => onFieldChange('scheduled_at', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duracion (min)</Label>
          <Select
            value={formData.duration_minutes?.toString() || "60"}
            onValueChange={(value) => onFieldChange('duration_minutes', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titulo de la cita</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="Ej: Consulta de seguimiento, Primera consulta..."
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Observaciones, preparacion necesaria, etc."
          rows={3}
        />
      </div>
    </>
  )
}
