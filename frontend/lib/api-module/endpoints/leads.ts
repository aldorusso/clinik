/**
 * Lead management endpoints
 */

import { API_URL } from '../client';
import type {
  Lead,
  LeadCreate,
  LeadUpdate,
  LeadStats,
  LeadListResponse,
  LeadInteraction,
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadToPatientConversion,
  LeadConversionResponse,
} from '../types';

export const leadEndpoints = {
  async getLeads(
    token: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: LeadStatus;
      source?: LeadSource;
      priority?: LeadPriority;
      assigned_to_id?: string;
      search?: string;
    }
  ): Promise<LeadListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.assigned_to_id) searchParams.append('assigned_to_id', params.assigned_to_id);
    if (params?.search) searchParams.append('search', params.search);

    const url = `${API_URL}/api/v1/leads/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }

    return response.json();
  },

  async getLeadStats(token: string): Promise<LeadStats> {
    const response = await fetch(`${API_URL}/api/v1/leads/stats/overview`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead stats');
    }

    return response.json();
  },

  async getLead(token: string, leadId: string): Promise<Lead> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead');
    }

    return response.json();
  },

  async createLead(token: string, data: LeadCreate): Promise<Lead> {
    const response = await fetch(`${API_URL}/api/v1/leads/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create lead');
    }

    return response.json();
  },

  async updateLead(token: string, leadId: string, data: LeadUpdate): Promise<Lead> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update lead');
    }

    return response.json();
  },

  async deleteLead(token: string, leadId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete lead');
    }
  },

  async assignLead(token: string, leadId: string, userId: string): Promise<Lead> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assigned_to_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to assign lead');
    }

    return response.json();
  },

  async getLeadInteractions(token: string, leadId: string): Promise<LeadInteraction[]> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/interactions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead interactions');
    }

    return response.json();
  },

  async createLeadInteraction(
    token: string,
    leadId: string,
    data: {
      interaction_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
      description: string;
      outcome?: string;
      next_action?: string;
      next_action_date?: string;
    }
  ): Promise<LeadInteraction> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/interactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create lead interaction');
    }

    return response.json();
  },

  async getMyAssignedLeads(token: string): Promise<Lead[]> {
    const response = await fetch(`${API_URL}/api/v1/leads/my-assigned`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assigned leads');
    }

    return response.json();
  },

  async convertLeadToPatient(
    token: string,
    leadId: string,
    conversionData: LeadToPatientConversion
  ): Promise<LeadConversionResponse> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/convert-to-patient`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to convert lead to patient');
    }

    return response.json();
  },
};
