const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// User roles for multi-tenant system (5 roles)
export type UserRole = 'superadmin' | 'tenant_admin' | 'manager' | 'user' | 'client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  office_address?: string;
  company_name?: string;
  job_title?: string;
  profile_photo?: string;
  role: UserRole;
  tenant_id?: string;
  // Client-specific fields
  client_company_name?: string;
  client_tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  office_address?: string;
  company_name?: string;
  job_title?: string;
  profile_photo?: string;
  role?: UserRole;
  is_active?: boolean;
  // Client-specific fields
  client_company_name?: string;
  client_tax_id?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  tenant_id?: string;
}

export interface ClientCreate {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  client_company_name?: string;
  client_tax_id?: string;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  tax_id?: string;
  legal_name?: string;
  logo?: string;
  primary_color?: string;
  settings?: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantWithStats extends Tenant {
  user_count: number;
  tenant_admin_count: number;
  manager_count: number;
  client_count: number;
}

export interface TenantCreate {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  tax_id?: string;
  legal_name?: string;
  logo?: string;
  primary_color?: string;
  plan?: string;
}

export interface TenantCreateWithAdmin extends TenantCreate {
  admin_email: string;
  admin_password: string;
  admin_first_name?: string;
  admin_last_name?: string;
}

export interface TenantUpdate {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  tax_id?: string;
  legal_name?: string;
  logo?: string;
  primary_color?: string;
  plan?: string;
  is_active?: boolean;
}

export const api = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  async register(data: {
    email: string;
    password: string;
    full_name?: string;
  }): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // Email Templates
  async getEmailTemplates(token: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email templates');
    }

    return response.json();
  },

  async getEmailTemplate(token: string, id: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email template');
    }

    return response.json();
  },

  async getEmailTemplateByType(token: string, type: string) {
    const response = await fetch(`${API_URL}/api/v1/email-templates/type/${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to preview email template');
    }

    return response.json();
  },

  // ============================================
  // TENANT MANAGEMENT (Superadmin only)
  // ============================================

  async getTenants(token: string): Promise<Tenant[]> {
    const response = await fetch(`${API_URL}/api/v1/tenants/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }

    return response.json();
  },

  async getTenantsWithStats(token: string): Promise<TenantWithStats[]> {
    const response = await fetch(`${API_URL}/api/v1/tenants/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenants with stats');
    }

    return response.json();
  },

  async getTenant(token: string, tenantId: string): Promise<TenantWithStats> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete tenant');
    }
  },

  async toggleTenantActive(token: string, tenantId: string): Promise<Tenant> {
    const response = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/toggle-active`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to toggle tenant status');
    }

    return response.json();
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUsers(token: string, params?: { role?: UserRole; tenant_id?: string }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.tenant_id) searchParams.append('tenant_id', params.tenant_id);

    const url = `${API_URL}/api/v1/users/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  },

  async getTenantUsers(token: string, tenantId: string, role?: UserRole): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (role) searchParams.append('role', role);

    const url = `${API_URL}/api/v1/tenants/${tenantId}/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

  async getUser(token: string, userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete user');
    }
  },
};
