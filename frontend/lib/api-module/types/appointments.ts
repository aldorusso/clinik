/**
 * Appointment types
 */

export type AppointmentStatus =
  | 'scheduled'        // Cita programada
  | 'confirmed'        // Cita confirmada por el paciente
  | 'in_progress'      // Cita en curso
  | 'completed'        // Cita completada
  | 'no_show'         // Paciente no se presentó
  | 'cancelled_by_patient'  // Cancelada por el paciente
  | 'cancelled_by_clinic'   // Cancelada por la clínica
  | 'rescheduled';     // Reprogramada

export type AppointmentType =
  | 'consultation'     // Consulta inicial/valoración
  | 'treatment'        // Sesión de tratamiento
  | 'follow_up'        // Seguimiento post-tratamiento
  | 'emergency';       // Emergencia o urgencia

export interface Appointment {
  id: string;
  tenant_id: string;
  lead_id?: string;
  patient_id?: string;
  provider_id: string;
  service_id?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  title?: string;
  notes?: string;
  internal_notes?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
  deposit_paid?: number;
  confirmed_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  actual_duration_minutes?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;

  // Related info
  service_name: string;
  service_duration: number;
  provider_name: string;
  provider_email: string;
  lead_full_name?: string;
  patient_full_name?: string;
  cancelled_by_name?: string;

  // Computed fields
  scheduled_end_at: string;
  is_today: boolean;
  is_past_due: boolean;
  is_upcoming: boolean;
  is_active: boolean;
  can_be_cancelled: boolean;
  can_be_rescheduled: boolean;
  needs_confirmation: boolean;
  needs_reminder: boolean;
  status_color: string;
}

export interface AppointmentDetailed extends Appointment {
  patient_details?: any;
  provider_details?: any;
  service_details?: any;
  lead_details?: any;
  status_history: any[];
  attachments: any[];
}

export interface AppointmentCreate {
  lead_id?: string;
  patient_id?: string;
  provider_id: string;
  service_id?: string;
  type?: AppointmentType;
  scheduled_at: string;
  duration_minutes?: number;
  title?: string;
  notes?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
}

export interface AppointmentUpdate {
  lead_id?: string;
  patient_id?: string;
  provider_id?: string;
  service_id?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  title?: string;
  notes?: string;
  internal_notes?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
  deposit_paid?: number;
}

export interface AppointmentStats {
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  appointments_by_status: Record<string, number>;
  appointments_by_type: Record<string, number>;
  appointments_by_provider: Record<string, number>;
  show_up_rate: number;
  on_time_rate: number;
  average_duration: number;
  appointments_trend: any[];
}
