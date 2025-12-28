/**
 * Commercial objectives and stats types
 */

export type ObjectiveType = 'leads' | 'conversions' | 'revenue' | 'appointments' | 'calls' | 'meetings' | 'satisfaction';
export type ObjectivePeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ObjectiveStatus = 'active' | 'completed' | 'paused' | 'cancelled' | 'overdue';

export interface CommercialObjective {
  id: string;
  tenant_id: string;
  commercial_id: string;
  created_by_id: string;
  title: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  target_value: number;
  current_value: number;
  unit?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_public: boolean;
  auto_calculate: boolean;
  reward_description?: string;
  reward_amount?: number;
  status: ObjectiveStatus;
  completion_date?: string;
  created_at: string;
  updated_at: string;

  // Related info
  commercial_name: string;
  commercial_email: string;
  created_by_name: string;

  // Computed fields
  progress_percentage: number;
  is_completed: boolean;
  is_overdue: boolean;
  days_remaining: number;

  // Period stats
  period_stats?: any;
}

export interface CommercialObjectiveCreate {
  commercial_id: string;
  title: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  target_value: number;
  unit?: string;
  start_date: string;
  end_date: string;
  is_public?: boolean;
  auto_calculate?: boolean;
  reward_description?: string;
  reward_amount?: number;
}

export interface CommercialObjectiveUpdate {
  title?: string;
  description?: string;
  target_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_public?: boolean;
  auto_calculate?: boolean;
  reward_description?: string;
  reward_amount?: number;
  status?: ObjectiveStatus;
}

export interface ObjectiveProgress {
  id: string;
  objective_id: string;
  previous_value: number;
  new_value: number;
  increment: number;
  notes?: string;
  recorded_by_id?: string;
  recorded_by_name?: string;
  is_automatic: boolean;
  metadata?: any;
  recorded_at: string;
  objective_title: string;
}

export interface ObjectiveProgressCreate {
  objective_id: string;
  increment: number;
  notes?: string;
  metadata?: any;
}

export interface CommercialPerformance {
  id: string;
  tenant_id: string;
  commercial_id: string;
  period: ObjectivePeriod;
  period_start: string;
  period_end: string;

  // Lead metrics
  total_leads_assigned: number;
  total_leads_contacted: number;
  total_leads_converted: number;
  conversion_rate: number;

  // Appointment metrics
  total_appointments_scheduled: number;
  total_appointments_completed: number;
  appointment_show_rate: number;

  // Revenue metrics
  total_revenue_generated: number;
  average_deal_size: number;

  // Activity metrics
  total_calls_made: number;
  total_emails_sent: number;
  total_meetings_held: number;

  // Satisfaction metrics
  average_satisfaction_score: number;
  total_satisfaction_surveys: number;

  // Objectives
  objectives_assigned: number;
  objectives_completed: number;
  objectives_completion_rate: number;

  created_at: string;
  updated_at: string;

  // Related info
  commercial_name: string;
  commercial_email: string;

  // Comparisons
  lead_growth_rate?: number;
  revenue_growth_rate?: number;
  conversion_improvement?: number;
}

export interface ObjectiveTemplate {
  id: string;
  tenant_id: string;
  created_by_id: string;
  name: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  default_target_value: number;
  default_unit?: string;
  default_reward_description?: string;
  default_reward_amount?: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

export interface ObjectiveTemplateCreate {
  name: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  default_target_value: number;
  default_unit?: string;
  default_reward_description?: string;
  default_reward_amount?: number;
}

export interface CommercialDashboard {
  commercial_id: string;
  commercial_name: string;
  active_objectives: CommercialObjective[];
  completed_objectives_this_period: number;
  overdue_objectives: number;
  current_period_performance?: CommercialPerformance;
  previous_period_performance?: CommercialPerformance;
  total_leads_this_month: number;
  total_revenue_this_month: number;
  conversion_rate_this_month: number;
  objectives_completion_rate: number;
  upcoming_deadlines: any[];
  suggestions: string[];
}

export interface AdminObjectiveDashboard {
  total_commercials: number;
  total_active_objectives: number;
  overall_completion_rate: number;
  commercial_rankings: any[];
  objectives_by_status: Record<string, number>;
  objectives_by_type: Record<string, number>;
  overdue_objectives: CommercialObjective[];
  underperforming_commercials: any[];
  period_summary: any;
}

// Commercial Stats
export interface CommercialStatsOverview {
  total_leads: number;
  leads_this_month: number;
  conversion_rate: number;
  active_patients: number;
}

export interface CommercialStatsMonthlyTrends {
  leads_growth: number;
  conversion_growth: number;
  revenue_growth: number;
}

export interface CommercialStatsFunnel {
  nuevo: number;
  contactado: number;
  calificado: number;
  cita_agendada: number;
  en_tratamiento: number;
  completado: number;
}

export interface CommercialStatsSources {
  website: number;
  facebook: number;
  instagram: number;
  referidos: number;
  google: number;
  otros: number;
}

export interface CommercialStatsDoctorPerformance {
  name: string;
  leads_assigned: number;
  conversion_rate: number;
  active_patients: number;
}

export interface CommercialStatsResponse {
  overview: CommercialStatsOverview;
  monthly_trends: CommercialStatsMonthlyTrends;
  funnel: CommercialStatsFunnel;
  sources: CommercialStatsSources;
  doctors_performance: CommercialStatsDoctorPerformance[];
}
