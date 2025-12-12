const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// User roles for medical leads management system (6 roles)
export type UserRole = 'superadmin' | 'tenant_admin' | 'manager' | 'user' | 'client' | 'recepcionista';

// ============================================
// LEAD TYPES
// ============================================

export type LeadSource = 'website' | 'facebook' | 'instagram' | 'google' | 'referidos' | 'llamada_directa' | 'otros';
export type LeadStatus = 'nuevo' | 'contactado' | 'calificado' | 'cita_agendada' | 'en_tratamiento' | 'completado' | 'no_califica' | 'perdido' | 'recontactar' | 'seguimiento' | 'cotizando' | 'negociando' | 'cerrado';
export type LeadPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Lead {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to_id?: string;
  assigned_to_name?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  initial_notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  assigned_to_id?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
}

export interface LeadUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  assigned_to_id?: string;
  conversion_probability?: number;
  estimated_value?: number;
  notes?: string;
  tags?: string[];
  address?: string;
  city?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro';
  occupation?: string;
  medical_history?: string;
  treatment_interest?: string;
  budget_range?: string;
  preferred_contact_method?: 'phone' | 'email' | 'whatsapp';
  preferred_contact_time?: string;
  how_did_find_us?: string;
  referral_source?: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  consultation_date?: string;
}

export interface LeadStats {
  total_leads: number;
  new_leads_today: number;
  new_leads_this_week: number;
  new_leads_this_month: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_source: Record<LeadSource, number>;
  leads_by_priority: Record<LeadPriority, number>;
  conversion_rate: number;
  average_conversion_time_days: number | null;
  unassigned_leads: number;
  overdue_follow_ups: number;
  leads_trend_last_30_days: Array<{ date: string; count: number }>;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  interaction_type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
  description: string;
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  created_at: string;
}

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
  tenant_name?: string;
  tenant_slug?: string;
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
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

  // ============================================
  // CLIENT MANAGEMENT (for tenant_admin, manager, user)
  // ============================================

  async getMyTenantClients(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/api/v1/users/my-tenant/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete client');
    }
  },

  // ============================================
  // USER INVITATION
  // ============================================

  async inviteUser(token: string, data: { email: string; role: UserRole; first_name?: string; last_name?: string }): Promise<{ message: string; expires_at: string }> {
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

  async acceptInvitation(data: { token: string; password: string; first_name?: string; last_name?: string; phone?: string }): Promise<User> {
    const response = await fetch(`${API_URL}/api/v1/auth/accept-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to accept invitation');
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

  // ============================================
  // ACTIVITY LOGS (Tenant-specific for tenant_admin, manager, user)
  // ============================================

  async getTenantActivityLogs(
    token: string,
    params?: {
      page?: number;
      page_size?: number;
      action?: string;
      category?: string;
      user_id?: string;
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
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.search) searchParams.append('search', params.search);

    const url = `${API_URL}/api/v1/audit-logs/tenant/activity${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }

    return response.json();
  },

  async getTenantActivityStats(token: string): Promise<AuditStats> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/tenant/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity stats');
    }

    return response.json();
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Obtiene la lista de notificaciones del usuario autenticado.
   *
   * @param token - Token de autenticación del usuario
   * @param params - Parámetros opcionales de paginación y filtrado
   * @returns Lista de notificaciones con metadatos (total, unread_count)
   *
   * @example
   * // Obtener las primeras 20 notificaciones
   * const notifications = await api.getNotifications(token, { skip: 0, limit: 20 });
   *
   * // Obtener solo las no leídas
   * const unread = await api.getNotifications(token, { unread_only: true });
   *
   * // Paginación
   * const page2 = await api.getNotifications(token, { skip: 20, limit: 20 });
   */
  async getNotifications(
    token: string,
    params?: {
      skip?: number;
      limit?: number;
      unread_only?: boolean;
    }
  ): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unread_only) searchParams.append('unread_only', 'true');

    const url = `${API_URL}/api/v1/notifications${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  /**
   * Obtiene el contador de notificaciones no leídas.
   *
   * Este endpoint es muy ligero y rápido, ideal para polling frecuente
   * para actualizar el badge del campanita de notificaciones.
   *
   * @param token - Token de autenticación del usuario
   * @returns Objeto con el contador de notificaciones no leídas
   *
   * @example
   * // Polling cada 30 segundos
   * setInterval(async () => {
   *   const { unread_count } = await api.getNotificationCount(token);
   *   updateBadge(unread_count);
   * }, 30000);
   */
  async getNotificationCount(token: string): Promise<NotificationCountResponse> {
    const response = await fetch(`${API_URL}/api/v1/notifications/count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification count');
    }

    return response.json();
  },

  /**
   * Marca una notificación específica como leída.
   *
   * Se llama cuando el usuario hace click en una notificación
   * o la visualiza en la lista.
   *
   * @param token - Token de autenticación del usuario
   * @param notificationId - UUID de la notificación a marcar
   * @returns La notificación actualizada
   *
   * @example
   * // Al hacer click en una notificación
   * async function handleNotificationClick(notificationId: string) {
   *   await api.markNotificationAsRead(token, notificationId);
   *   // Navegar a la URL de acción si existe
   *   if (notification.action_url) {
   *     router.push(notification.action_url);
   *   }
   * }
   */
  async markNotificationAsRead(token: string, notificationId: string): Promise<Notification> {
    const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  },

  /**
   * Marca todas las notificaciones del usuario como leídas.
   *
   * Se llama cuando el usuario hace click en "Marcar todas como leídas".
   *
   * @param token - Token de autenticación del usuario
   * @returns Mensaje de éxito con el número de notificaciones marcadas
   *
   * @example
   * // Botón "Marcar todas como leídas"
   * async function handleMarkAllAsRead() {
   *   const result = await api.markAllNotificationsAsRead(token);
   *   console.log(result.message); // "5 notificaciones marcadas como leídas"
   *   // Recargar la lista de notificaciones
   *   await fetchNotifications();
   * }
   */
  async markAllNotificationsAsRead(token: string): Promise<{ message: string; count: number }> {
    const response = await fetch(`${API_URL}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  },

  /**
   * Elimina una notificación específica.
   *
   * Permite al usuario eliminar notificaciones que ya no quiere ver.
   *
   * @param token - Token de autenticación del usuario
   * @param notificationId - UUID de la notificación a eliminar
   * @returns Mensaje de éxito
   *
   * @example
   * // Botón de eliminar en la notificación
   * async function handleDeleteNotification(notificationId: string) {
   *   await api.deleteNotification(token, notificationId);
   *   // Recargar la lista
   *   await fetchNotifications();
   * }
   */
  async deleteNotification(token: string, notificationId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return response.json();
  },

  // ============================================
  // LEAD MANAGEMENT
  // ============================================

  /**
   * Obtiene la lista de leads del tenant.
   */
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }

    return response.json();
  },

  /**
   * Obtiene estadísticas de leads del tenant.
   */
  async getLeadStats(token: string): Promise<LeadStats> {
    const response = await fetch(`${API_URL}/api/v1/leads/stats/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead stats');
    }

    return response.json();
  },

  /**
   * Obtiene un lead específico por ID.
   */
  async getLead(token: string, leadId: string): Promise<Lead> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead');
    }

    return response.json();
  },

  /**
   * Crea un nuevo lead.
   */
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

  /**
   * Actualiza un lead existente.
   */
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

  /**
   * Elimina un lead.
   */
  async deleteLead(token: string, leadId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete lead');
    }
  },

  /**
   * Asigna un lead a un médico.
   */
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

  /**
   * Obtiene las interacciones de un lead.
   */
  async getLeadInteractions(token: string, leadId: string): Promise<LeadInteraction[]> {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/interactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lead interactions');
    }

    return response.json();
  },

  /**
   * Crea una nueva interacción para un lead.
   */
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

  /**
   * Obtiene los leads asignados al usuario actual (para médicos).
   */
  async getMyAssignedLeads(token: string): Promise<Lead[]> {
    const response = await fetch(`${API_URL}/api/v1/leads/my-assigned`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assigned leads');
    }

    return response.json();
  },

  /**
   * Convierte un lead en paciente.
   */
  async convertLeadToPatient(token: string, leadId: string, conversionData: LeadToPatientConversion): Promise<LeadConversionResponse> {
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

// ============================================
// NOTIFICATION TYPES
// ============================================

/**
 * Tipos de notificaciones según su naturaleza y urgencia.
 * Cada tipo tiene un color asociado en la UI:
 * - info: azul (información general)
 * - success: verde (acciones exitosas)
 * - warning: amarillo (advertencias que requieren atención)
 * - error: rojo (errores o problemas críticos)
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notificación in-app.
 * Representa una notificación que pertenece a un usuario específico.
 */
export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

/**
 * Respuesta de lista de notificaciones con metadatos.
 * Incluye las notificaciones, el total y el contador de no leídas.
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

/**
 * Respuesta del contador de notificaciones no leídas.
 * Usado para el badge en el campanita de notificaciones.
 */
export interface NotificationCountResponse {
  unread_count: number;
}

// ============================================
// LEAD TO PATIENT CONVERSION INTERFACES
// ============================================

export interface LeadToPatientConversion {
  create_user_account?: boolean;
  send_welcome_email?: boolean;
  password?: string;
  conversion_notes?: string;
  initial_service_id?: string;
}

export interface LeadConversionResponse {
  success: boolean;
  message: string;
  patient_user_id?: string;
  patient_email?: string;
  conversion_date: string;
  generated_password?: string;
}
