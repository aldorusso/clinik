/**
 * Appointment management endpoints
 */

import { API_URL } from '../client';
import type {
  Appointment,
  AppointmentDetailed,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentStats,
  AppointmentStatus,
  AppointmentType,
} from '../types';

export const appointmentEndpoints = {
  async getAppointments(
    token: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: AppointmentStatus[];
      type?: AppointmentType[];
      provider_id?: string;
      service_id?: string;
      patient_id?: string;
      lead_id?: string;
      date_from?: string;
      date_to?: string;
      is_today?: boolean;
      search?: string;
      order_by?: 'scheduled_at' | 'created_at' | 'patient_name' | 'provider_name';
      order_direction?: 'asc' | 'desc';
    }
  ): Promise<Appointment[]> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.status) params.status.forEach(s => searchParams.append('status', s));
    if (params?.type) params.type.forEach(t => searchParams.append('type', t));
    if (params?.provider_id) searchParams.append('provider_id', params.provider_id);
    if (params?.service_id) searchParams.append('service_id', params.service_id);
    if (params?.patient_id) searchParams.append('patient_id', params.patient_id);
    if (params?.lead_id) searchParams.append('lead_id', params.lead_id);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.is_today) searchParams.append('is_today', 'true');
    if (params?.search) searchParams.append('search', params.search);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order_direction) searchParams.append('order_direction', params.order_direction);

    const url = `${API_URL}/api/v1/appointments/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }

    return response.json();
  },

  async getAppointment(token: string, appointmentId: string): Promise<AppointmentDetailed> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment');
    }

    return response.json();
  },

  async createAppointment(token: string, data: AppointmentCreate): Promise<Appointment> {
    const response = await fetch(`${API_URL}/api/v1/appointments/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Appointment creation failed:', response.status, error);

      if (response.status === 422 && error.detail) {
        if (Array.isArray(error.detail)) {
          const messages = error.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          throw new Error(`Validation errors: ${messages}`);
        }
      }

      throw new Error(error.detail || `Failed to create appointment (${response.status})`);
    }

    return response.json();
  },

  async updateAppointment(token: string, appointmentId: string, data: AppointmentUpdate): Promise<Appointment> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update appointment');
    }

    return response.json();
  },

  async updateAppointmentStatus(
    token: string,
    appointmentId: string,
    status: AppointmentStatus,
    notes?: string
  ): Promise<Appointment> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update appointment status');
    }

    return response.json();
  },

  async deleteAppointment(token: string, appointmentId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete appointment');
    }
  },

  async getPatientAppointments(token: string): Promise<Appointment[]> {
    const response = await fetch(`${API_URL}/api/v1/patient-portal/my-appointments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patient appointments');
    }
    return response.json();
  },

  async getPatientTreatments(token: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/api/v1/patient-portal/my-treatments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patient treatments');
    }
    return response.json();
  },

  async getPatientMedicalHistory(token: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/v1/patient-portal/my-medical-history`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch patient medical history');
    }
    return response.json();
  },

  async getAppointmentStats(token: string, date_from?: string, date_to?: string): Promise<AppointmentStats> {
    const searchParams = new URLSearchParams();
    if (date_from) searchParams.append('date_from', date_from);
    if (date_to) searchParams.append('date_to', date_to);

    const url = `${API_URL}/api/v1/appointments/stats/summary${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment stats');
    }

    return response.json();
  },
};
