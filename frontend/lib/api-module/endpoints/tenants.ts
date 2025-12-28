/**
 * Tenant management endpoints
 */

import { API_URL } from '../client';
import type { Tenant, TenantWithStats, TenantCreate, TenantCreateWithAdmin, TenantUpdate } from '../types';

export const tenantEndpoints = {
  async getTenants(token: string): Promise<Tenant[]> {
    const response = await fetch(`${API_URL}/api/v1/tenants/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }

    return response.json();
  },

  async getTenantsWithStats(token: string): Promise<TenantWithStats[]> {
    const response = await fetch(`${API_URL}/api/v1/tenants/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenants with stats');
    }

    return response.json();
  },

  async getTenant(token: string, tenantId: string): Promise<TenantWithStats> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenant');
    }

    return response.json();
  },

  async createTenant(token: string, data: TenantCreate): Promise<Tenant> {
    const response = await fetch(`${API_URL}/api/v1/tenants/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create tenant');
    }

    return response.json();
  },

  async createTenantWithAdmin(token: string, data: TenantCreateWithAdmin): Promise<Tenant> {
    const response = await fetch(`${API_URL}/api/v1/tenants/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create tenant');
    }

    return response.json();
  },

  async updateTenant(token: string, tenantId: string, data: TenantUpdate): Promise<Tenant> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update tenant');
    }

    return response.json();
  },

  async deleteTenant(token: string, tenantId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete tenant');
    }
  },

  async toggleTenantActive(token: string, tenantId: string): Promise<Tenant> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/toggle-active`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to toggle tenant status');
    }

    return response.json();
  },
};
