/**
 * Miscellaneous endpoints (email templates, plans, system config, patients)
 */

import { API_URL } from '../client';
import type { Plan, PlanCreate, PlanUpdate, SystemConfig, SystemConfigUpdate } from '../types';

export const miscEndpoints = {
  // Email Templates
  async getEmailTemplates(token: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email templates');
    }

    return response.json();
  },

  async getEmailTemplate(token: string, id: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email template');
    }

    return response.json();
  },

  async getEmailTemplateByType(token: string, type: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/type/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email template');
    }

    return response.json();
  },

  async updateEmailTemplate(token: string, id: string, data: any) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update email template');
    }

    return response.json();
  },

  async previewEmailTemplate(token: string, type: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/preview/${type}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to preview email template');
    }

    return response.json();
  },

  // Plans
  async getPlans(token: string, includeInactive: boolean = false): Promise<Plan[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${API_URL}/api/v1/plans/${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    return response.json();
  },

  async getPlan(token: string, planId: string): Promise<Plan> {
    const response = await fetch(`${API_URL}/api/v1/plans/${planId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch plan');
    }

    return response.json();
  },

  async createPlan(token: string, data: PlanCreate): Promise<Plan> {
    const response = await fetch(`${API_URL}/api/v1/plans/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create plan');
    }

    return response.json();
  },

  async updatePlan(token: string, planId: string, data: PlanUpdate): Promise<Plan> {
    const response = await fetch(`${API_URL}/api/v1/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update plan');
    }

    return response.json();
  },

  async deletePlan(token: string, planId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/plans/${planId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete plan');
    }
  },

  // System Config
  async getSystemConfigs(token: string, category?: string): Promise<SystemConfig[]> {
    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${API_URL}/api/v1/system-config/${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system configs');
    }

    return response.json();
  },

  async getSystemConfig(token: string, configId: string): Promise<SystemConfig> {
    const response = await fetch(`${API_URL}/api/v1/system-config/${configId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system config');
    }

    return response.json();
  },

  async updateSystemConfig(token: string, configId: string, data: SystemConfigUpdate): Promise<SystemConfig> {
    const response = await fetch(`${API_URL}/api/v1/system-config/${configId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update system config');
    }

    return response.json();
  },

  async bulkUpdateSystemConfigs(token: string, configs: Record<string, string>): Promise<SystemConfig[]> {
    const response = await fetch(`${API_URL}/api/v1/system-config/bulk-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configs }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update system configs');
    }

    return response.json();
  },

  // Patients
  async getPatients(token: string, search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/api/v1/patients/?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }

    return response.json();
  },

  async getPatientDetails(token: string, patientId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/v1/patients/${patientId}/details`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient details');
    }

    return response.json();
  },

  async getPatientBasic(token: string, patientId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/v1/patients/${patientId}/basic`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch basic patient info');
    }

    return response.json();
  },
};
