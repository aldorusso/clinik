/**
 * Lead types
 */

export type LeadSource = 'website' | 'facebook' | 'instagram' | 'google' | 'referidos' | 'llamada_directa' | 'otros';
export type LeadStatus = 'nuevo' | 'contactado' | 'calificado' | 'cita_agendada' | 'en_tratamiento' | 'completado' | 'no_califica' | 'perdido' | 'recontactar' | 'seguimiento' | 'cotizando' | 'negociando' | 'cerrado';
export type LeadPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Lead {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to_id?: string;
  assigned_to_name?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  initial_notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  assigned_to_id?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
}

export interface LeadUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  assigned_to_id?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
}

export interface LeadStats {
  total_leads: number;
  new_leads_today: number;
  new_leads_this_week: number;
  new_leads_this_month: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_source: Record<LeadSource, number>;
  leads_by_priority: Record<LeadPriority, number>;
  conversion_rate: number;
  average_conversion_time_days: number | null;
  unassigned_leads: number;
  overdue_follow_ups: number;
  leads_trend_last_30_days: Array<{ date: string; count: number }>;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  interaction_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
  description: string;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  created_at: string;
}

export interface LeadToPatientConversion {
  create_user_account?: boolean;
  send_welcome_email?: boolean;
  password?: string;
  conversion_notes?: string;
  initial_service_id?: string;
}

export interface LeadConversionResponse {
  success: boolean;
  message: string;
  patient_user_id?: string;
  patient_email?: string;
  conversion_date: string;
  generated_password?: string;
}
