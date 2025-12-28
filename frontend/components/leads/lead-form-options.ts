import { LeadSource, LeadStatus, LeadPriority } from "@/lib/api"

export const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Sitio Web' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'referidos', label: 'Referidos' },
  { value: 'llamada_directa', label: 'Llamada Directa' },
  { value: 'otros', label: 'Otros' },
]

export const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificado', label: 'Calificado' },
  { value: 'cita_agendada', label: 'Cita Agendada' },
  { value: 'en_tratamiento', label: 'En Tratamiento' },
  { value: 'completado', label: 'Completado' },
  { value: 'no_califica', label: 'No Califica' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'recontactar', label: 'Recontactar' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'cotizando', label: 'Cotizando' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'cerrado', label: 'Cerrado' },
]

export const priorityOptions: { value: LeadPriority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

export const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

export const contactMethodOptions = [
  { value: 'phone', label: 'Teléfono' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
]
