/**
 * Commercial objectives and stats endpoints
 */

import { API_URL } from '../client';
import type {
  CommercialObjective,
  CommercialObjectiveCreate,
  CommercialObjectiveUpdate,
  ObjectiveProgress,
  ObjectiveProgressCreate,
  CommercialDashboard,
  AdminObjectiveDashboard,
  ObjectiveTemplate,
  ObjectiveTemplateCreate,
  CommercialStatsResponse,
  ObjectiveType,
  ObjectivePeriod,
  ObjectiveStatus,
} from '../types';

export const commercialEndpoints = {
  async getCommercialObjectives(
    token: string,
    params?: {
      commercial_id?: string;
      type?: ObjectiveType;
      period?: ObjectivePeriod;
      status?: ObjectiveStatus;
      is_active?: boolean;
      search?: string;
      order_by?: string;
      order_direction?: string;
    }
  ): Promise<CommercialObjective[]> {
    const searchParams = new URLSearchParams();
    if (params?.commercial_id) searchParams.append('commercial_id', params.commercial_id);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.period) searchParams.append('period', params.period);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order_direction) searchParams.append('order_direction', params.order_direction);

    const url = `${API_URL}/api/v1/commercial/objectives${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial objectives');
    }

    return response.json();
  },

  async getCommercialObjective(token: string, objectiveId: string): Promise<CommercialObjective> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial objective');
    }

    return response.json();
  },

  async createCommercialObjective(token: string, data: CommercialObjectiveCreate): Promise<CommercialObjective> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        throw new Error(`Validation errors: ${messages}`);
      }
      throw new Error(error.detail || 'Failed to create commercial objective');
    }

    return response.json();
  },

  async updateCommercialObjective(token: string, objectiveId: string, data: CommercialObjectiveUpdate): Promise<CommercialObjective> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update commercial objective');
    }

    return response.json();
  },

  async deleteCommercialObjective(token: string, objectiveId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete commercial objective');
    }
  },

  async getObjectiveProgress(token: string, objectiveId: string): Promise<ObjectiveProgress[]> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}/progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch objective progress');
    }

    return response.json();
  },

  async addObjectiveProgress(token: string, objectiveId: string, data: ObjectiveProgressCreate): Promise<ObjectiveProgress> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}/progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add objective progress');
    }

    return response.json();
  },

  async getCommercialDashboard(token: string, commercialId?: string): Promise<CommercialDashboard> {
    const params = new URLSearchParams();
    if (commercialId) params.append('commercial_id', commercialId);

    const response = await fetch(`${API_URL}/api/v1/commercial/dashboard/commercial?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial dashboard');
    }

    return response.json();
  },

  async getAdminObjectiveDashboard(token: string): Promise<AdminObjectiveDashboard> {
    const response = await fetch(`${API_URL}/api/v1/commercial/dashboard/admin`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin objective dashboard');
    }

    return response.json();
  },

  async getObjectiveTemplates(token: string, isActive?: boolean): Promise<ObjectiveTemplate[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('is_active', isActive.toString());

    const response = await fetch(`${API_URL}/api/v1/commercial/templates?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch objective templates');
    }

    return response.json();
  },

  async createObjectiveTemplate(token: string, data: ObjectiveTemplateCreate): Promise<ObjectiveTemplate> {
    const response = await fetch(`${API_URL}/api/v1/commercial/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create objective template');
    }

    return response.json();
  },

  async getCommercialStats(token: string, dateFrom?: string, dateTo?: string): Promise<CommercialStatsResponse> {
    let url = `${API_URL}/api/v1/commercial-stats/`;
    const params = new URLSearchParams();

    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial statistics');
    }

    return response.json();
  },
};
