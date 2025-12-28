"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LeadCreate, User, ServiceCategory } from "@/lib/api"
import { sourceOptions, statusOptions, priorityOptions, genderOptions, contactMethodOptions } from "./lead-form-options"

interface SectionProps {
  formData: LeadCreate
  onChange: (field: keyof LeadCreate, value: unknown) => void
}

interface DoctorSectionProps extends SectionProps {
  doctors: User[]
}

interface TreatmentSectionProps extends SectionProps {
  serviceCategories: ServiceCategory[]
}

export function BasicInfoSection({ formData, onChange }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">Nombre *</Label>
        <Input
          id="first_name"
          value={formData.first_name}
          onChange={(e) => onChange('first_name', e.target.value)}
          required
          placeholder="Nombre del lead"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_name">Apellido *</Label>
        <Input
          id="last_name"
          value={formData.last_name}
          onChange={(e) => onChange('last_name', e.target.value)}
          required
          placeholder="Apellido del lead"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+52 555 1234567"
        />
      </div>
    </div>
  )
}

export function ClassificationSection({ formData, onChange }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="source">Fuente *</Label>
        <Select value={formData.source} onValueChange={(value) => onChange('source', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select value={formData.status} onValueChange={(value) => onChange('status', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Prioridad</Label>
        <Select value={formData.priority} onValueChange={(value) => onChange('priority', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function AssignmentSection({ formData, onChange, doctors }: DoctorSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="assigned_to_id">Asignar a Médico</Label>
      <Select
        value={formData.assigned_to_id === '' ? 'unassigned' : formData.assigned_to_id}
        onValueChange={(value) => onChange('assigned_to_id', value === 'unassigned' ? '' : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar médico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {doctor.first_name} {doctor.last_name} ({doctor.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PersonalInfoSection({ formData, onChange }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="age">Edad</Label>
        <Input
          id="age"
          type="number"
          value={formData.age || ''}
          onChange={(e) => onChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Edad"
          min="1"
          max="120"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Género</Label>
        <Select
          value={formData.gender || 'none'}
          onValueChange={(value) => onChange('gender', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin especificar</SelectItem>
            {genderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">Ocupación</Label>
        <Input
          id="occupation"
          value={formData.occupation}
          onChange={(e) => onChange('occupation', e.target.value)}
          placeholder="Ocupación del lead"
        />
      </div>
    </div>
  )
}

export function ContactPreferencesSection({ formData, onChange }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="preferred_contact_method">Método de Contacto Preferido</Label>
        <Select
          value={formData.preferred_contact_method || 'none'}
          onValueChange={(value) => onChange('preferred_contact_method', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin especificar</SelectItem>
            {contactMethodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_contact_time">Horario Preferido</Label>
        <Input
          id="preferred_contact_time"
          value={formData.preferred_contact_time}
          onChange={(e) => onChange('preferred_contact_time', e.target.value)}
          placeholder="Ej: Mañanas, tardes, fines de semana"
        />
      </div>
    </div>
  )
}

export function TreatmentSection({ formData, onChange, serviceCategories }: TreatmentSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="treatment_interest">Interés en Tratamiento</Label>
        <Select
          value={formData.treatment_interest}
          onValueChange={(value) => onChange('treatment_interest', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría de tratamiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin especificar</SelectItem>
            {serviceCategories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget_range">Presupuesto Estimado</Label>
        <Input
          id="budget_range"
          value={formData.budget_range}
          onChange={(e) => onChange('budget_range', e.target.value)}
          placeholder="Ej: $5,000 - $10,000"
        />
      </div>
    </div>
  )
}

export function DatesSection({ formData, onChange }: SectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="next_follow_up_date">Próximo Seguimiento</Label>
        <Input
          id="next_follow_up_date"
          type="datetime-local"
          value={formData.next_follow_up_date}
          onChange={(e) => onChange('next_follow_up_date', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consultation_date">Fecha de Consulta</Label>
        <Input
          id="consultation_date"
          type="datetime-local"
          value={formData.consultation_date}
          onChange={(e) => onChange('consultation_date', e.target.value)}
        />
      </div>
    </div>
  )
}

export function NotesSection({ formData, onChange }: SectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Notas</Label>
      <Textarea
        id="notes"
        value={formData.notes}
        onChange={(e) => onChange('notes', e.target.value)}
        placeholder="Notas adicionales sobre el lead..."
        rows={4}
      />
    </div>
  )
}
