/**
 * Authentication endpoints
 */

import { API_URL } from '../client';
import type {
  LoginCredentials,
  LoginResponse,
  SelectTenantResponse,
  MyTenantsResponse,
  User,
  UserUpdate,
} from '../types';

export const authEndpoints = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        body: formData,
      });
    } catch (networkError) {
      // Network error (CORS, server down, etc.)
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }

    if (!response.ok) {
      let errorMessage = 'Credenciales inválidas';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Error parsing response, use default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al solicitar recuperación');
    }

    return response.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al restablecer contraseña');
    }

    return response.json();
  },

  async refreshToken(token: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  async selectTenant(token: string, tenantId: string): Promise<SelectTenantResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/select-tenant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al seleccionar organización');
    }

    return response.json();
  },

  async switchTenant(token: string, tenantId: string): Promise<SelectTenantResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/switch-tenant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al cambiar de organización');
    }

    return response.json();
  },

  async getMyTenants(token: string): Promise<MyTenantsResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/my-tenants`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Error al obtener organizaciones');
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  async getMe(token: string): Promise<User> {
    return this.getCurrentUser(token);
  },

  async register(data: { email: string; password: string; full_name?: string }): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  async updateProfile(token: string, data: UserUpdate): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Profile update failed');
    }

    return response.json();
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }

    return response.json();
  },

  async getInvitationInfo(token: string): Promise<{
    is_valid: boolean;
    is_existing_user: boolean;
    tenant_name?: string;
    role?: string;
    inviter_name?: string;
    user_email?: string;
    requires_password: boolean;
  }> {
    const response = await fetch(`${API_URL}/api/v1/auth/invitation-info/${token}`);

    if (!response.ok) {
      return { is_valid: false, is_existing_user: false, requires_password: true };
    }

    return response.json();
  },

  async acceptInvitation(data: {
    token: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/accept-invitation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to accept invitation');
    }

    return response.json();
  },
};
