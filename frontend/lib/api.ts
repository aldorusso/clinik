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

  // Alias for getCurrentUser
  async getMe(token: string): Promise<User> {
    return this.getCurrentUser(token);
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

  // ============================================
  // PLANS MANAGEMENT (Superadmin only)
  // ============================================

  async getPlans(token: string, includeInactive: boolean = false): Promise<Plan[]> {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await fetch(`${API_URL}/api/v1/plans/${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    return response.json();
  },

  async getPlan(token: string, planId: string): Promise<Plan> {
    const response = await fetch(`${API_URL}/api/v1/plans/${planId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete plan');
    }
  },

  // ============================================
  // SYSTEM CONFIG (Superadmin only)
  // ============================================

  async getSystemConfigs(token: string, category?: string): Promise<SystemConfig[]> {
    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${API_URL}/api/v1/system-config/${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system configs');
    }

    return response.json();
  },

  async getSystemConfig(token: string, configId: string): Promise<SystemConfig> {
    const response = await fetch(`${API_URL}/api/v1/system-config/${configId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

  // ============================================
  // AUDIT LOGS (Superadmin only)
  // ============================================

  async getAuditLogs(
    token: string,
    params?: {
      page?: number;
      page_size?: number;
      action?: string;
      category?: string;
      user_id?: string;
      tenant_id?: string;
      entity_type?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    }
  ): Promise<AuditLogListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params?.action) searchParams.append('action', params.action);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.user_id) searchParams.append('user_id', params.user_id);
    if (params?.tenant_id) searchParams.append('tenant_id', params.tenant_id);
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.search) searchParams.append('search', params.search);

    const url = `${API_URL}/api/v1/audit-logs${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  },

  async getAuditStats(token: string): Promise<AuditStats> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit stats');
    }

    return response.json();
  },

  async getAuditActions(token: string): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/actions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit actions');
    }

    return response.json();
  },

  async getAuditCategories(token: string): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit categories');
    }

    return response.json();
  },
};

// ============================================
// PLAN TYPES
// ============================================

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number;
  max_clients: number;
  max_storage_gb: number;
  features?: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanCreate {
  name: string;
  slug: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
  max_users?: number;
  max_clients?: number;
  max_storage_gb?: number;
  features?: string;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
}

export interface PlanUpdate {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
  max_users?: number;
  max_clients?: number;
  max_storage_gb?: number;
  features?: string;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
}

// ============================================
// SYSTEM CONFIG TYPES
// ============================================

export interface SystemConfig {
  id: string;
  key: string;
  value?: string;
  description?: string;
  category: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string;
}

export interface SystemConfigUpdate {
  value?: string;
  description?: string;
  category?: string;
  value_type?: 'string' | 'number' | 'boolean' | 'json';
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  tenant_id?: string;
  action: string;
  category: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditStats {
  total_logs: number;
  logins_today: number;
  failed_logins_today: number;
  actions_by_category: Record<string, number>;
  recent_critical_actions: AuditLog[];
}
