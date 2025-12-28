/**
 * User management endpoints
 */

import { API_URL } from '../client';
import type { User, UserCreate, UserUpdate, UserRole, ClientCreate } from '../types';

export const userEndpoints = {
  async getUsers(token: string, params?: { role?: UserRole; tenant_id?: string }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.tenant_id) searchParams.append('tenant_id', params.tenant_id);

    const url = `${API_URL}/api/v1/users/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  },

  async getUsersAvailableForAdmin(token: string, search?: string): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (search) searchParams.append('search', search);

    const url = `${API_URL}/api/v1/users/available-for-admin${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available users');
    }

    return response.json();
  },

  async getTenantUsers(token: string, tenantId: string, role?: UserRole): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (role) searchParams.append('role', role);

    const url = `${API_URL}/api/v1/tenants/${tenantId}/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenant users');
    }

    return response.json();
  },

  async getMyTenantUsers(token: string, role?: UserRole): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (role) searchParams.append('role', role);

    const url = `${API_URL}/api/v1/users/my-tenant/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch my tenant users');
    }

    return response.json();
  },

  async createUser(token: string, data: UserCreate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }

    return response.json();
  },

  async inviteUserAsSuperadmin(
    token: string,
    data: { email: string; role: UserRole; first_name?: string; last_name?: string },
    tenant_id?: string
  ): Promise<{ message: string; expires_at: string; warning?: string }> {
    const url = tenant_id
      ? `${API_URL}/api/v1/users/invite?tenant_id=${tenant_id}`
      : `${API_URL}/api/v1/users/invite`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to invite user');
    }

    return response.json();
  },

  async createMyTenantUser(token: string, data: UserCreate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create user');
    }

    return response.json();
  },

  async createClient(token: string, data: ClientCreate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create client');
    }

    return response.json();
  },

  async getMyTenantClients(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }

    return response.json();
  },

  async createMyTenantClient(token: string, data: ClientCreate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create client');
    }

    return response.json();
  },

  async updateMyTenantClient(token: string, clientId: string, data: UserUpdate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update client');
    }

    return response.json();
  },

  async deleteMyTenantClient(token: string, clientId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients/${clientId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete client');
    }
  },

  async inviteUser(
    token: string,
    data: { email: string; role: UserRole; first_name?: string; last_name?: string }
  ): Promise<{ message: string; expires_at: string }> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send invitation');
    }

    return response.json();
  },

  async getUser(token: string, userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  async updateUser(token: string, userId: string, data: UserUpdate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update user');
    }

    return response.json();
  },

  async deleteUser(token: string, userId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete user');
    }
  },
};
