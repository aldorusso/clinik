import { AppointmentCreate, User, Service } from "@/lib/api"

export interface Patient {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

export interface AppointmentFormData extends AppointmentCreate {}

export function isValidEmail(email: string): boolean {
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

export function getMinDateTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 1)
  return now.toISOString().slice(0, 16)
}

export const INITIAL_FORM_DATA: AppointmentFormData = {
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
}

export const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consulta inicial/valoracion" },
  { value: "treatment", label: "Sesion de tratamiento" },
  { value: "follow_up", label: "Seguimiento post-tratamiento" },
  { value: "emergency", label: "Emergencia o urgencia" }
]

export const DURATION_OPTIONS = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1.5 horas" },
  { value: "120", label: "2 horas" }
]
