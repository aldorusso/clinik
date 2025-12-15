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
  full_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  office_address?: string;
  company_name?: string;
  job_title?: string;
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

  // ============================================
  // APPOINTMENTS MANAGEMENT
  // ============================================

  /**
   * Obtiene la lista de citas del tenant.
   */
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }

    return response.json();
  },

  /**
   * Obtiene una cita específica por ID.
   */
  async getAppointment(token: string, appointmentId: string): Promise<AppointmentDetailed> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment');
    }

    return response.json();
  },

  /**
   * Crea una nueva cita médica.
   */
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
      
      // Handle validation errors (422)
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

  /**
   * Actualiza una cita existente.
   */
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

  /**
   * Actualiza solo el estado de una cita.
   */
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

  /**
   * Elimina una cita (la cancela).
   */
  async deleteAppointment(token: string, appointmentId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete appointment');
    }
  },

  /**
   * Obtiene estadísticas de citas del tenant.
   */
  async getAppointmentStats(
    token: string,
    date_from?: string,
    date_to?: string
  ): Promise<AppointmentStats> {
    const searchParams = new URLSearchParams();
    if (date_from) searchParams.append('date_from', date_from);
    if (date_to) searchParams.append('date_to', date_to);

    const url = `${API_URL}/api/v1/appointments/stats/summary${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment stats');
    }

    return response.json();
  },

  // ============================================
  // SERVICES MANAGEMENT
  // ============================================

  /**
   * Obtiene todas las categorías de servicios del tenant.
   */
  async getServiceCategories(
    token: string,
    activeOnly?: boolean
  ): Promise<ServiceCategory[]> {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('active_only', activeOnly.toString());
    
    const response = await fetch(`${API_URL}/api/v1/services/categories?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service categories');
    }

    return response.json();
  },

  /**
   * Crea una nueva categoría de servicios (solo tenant_admin).
   */
  async createServiceCategory(token: string, data: ServiceCategoryCreate): Promise<ServiceCategory> {
    const response = await fetch(`${API_URL}/api/v1/services/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create service category');
    }

    return response.json();
  },

  /**
   * Actualiza una categoría de servicios (solo tenant_admin).
   */
  async updateServiceCategory(token: string, categoryId: string, data: ServiceCategoryUpdate): Promise<ServiceCategory> {
    const response = await fetch(`${API_URL}/api/v1/services/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update service category');
    }

    return response.json();
  },

  /**
   * Elimina una categoría de servicios (solo tenant_admin).
   */
  async deleteServiceCategory(token: string, categoryId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/services/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete service category');
    }
  },

  /**
   * Obtiene todos los servicios del tenant.
   */
  async getServices(
    token: string,
    params?: {
      category_id?: string;
      active_only?: boolean;
      featured_only?: boolean;
      search?: string;
      order_by?: string;
      order_direction?: string;
    }
  ): Promise<Service[]> {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.append('category_id', params.category_id);
    if (params?.active_only !== undefined) searchParams.append('active_only', params.active_only.toString());
    if (params?.featured_only !== undefined) searchParams.append('featured_only', params.featured_only.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order_direction) searchParams.append('order_direction', params.order_direction);

    const url = `${API_URL}/api/v1/services/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }

    return response.json();
  },

  /**
   * Obtiene un servicio específico por ID.
   */
  async getService(token: string, serviceId: string): Promise<Service> {
    const response = await fetch(`${API_URL}/api/v1/services/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }

    return response.json();
  },

  /**
   * Crea un nuevo servicio (solo tenant_admin).
   */
  async createService(token: string, data: ServiceCreate): Promise<Service> {
    const response = await fetch(`${API_URL}/api/v1/services/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create service');
    }

    return response.json();
  },

  /**
   * Actualiza un servicio (solo tenant_admin).
   */
  async updateService(token: string, serviceId: string, data: ServiceUpdate): Promise<Service> {
    const response = await fetch(`${API_URL}/api/v1/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update service');
    }

    return response.json();
  },

  /**
   * Elimina un servicio (solo tenant_admin).
   */
  async deleteService(token: string, serviceId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete service');
    }
  },

  // ============================================
  // COMMERCIAL OBJECTIVES MANAGEMENT
  // ============================================

  /**
   * Obtiene todos los objetivos comerciales del tenant con filtros.
   */
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial objectives');
    }

    return response.json();
  },

  /**
   * Obtiene un objetivo específico por ID.
   */
  async getCommercialObjective(token: string, objectiveId: string): Promise<CommercialObjective> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial objective');
    }

    return response.json();
  },

  /**
   * Crea un nuevo objetivo comercial (solo tenant_admin).
   */
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
      throw new Error(error.detail || 'Failed to create commercial objective');
    }

    return response.json();
  },

  /**
   * Actualiza un objetivo comercial (solo tenant_admin).
   */
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

  /**
   * Elimina un objetivo comercial (solo tenant_admin).
   */
  async deleteCommercialObjective(token: string, objectiveId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete commercial objective');
    }
  },

  /**
   * Obtiene el historial de progreso de un objetivo.
   */
  async getObjectiveProgress(token: string, objectiveId: string): Promise<ObjectiveProgress[]> {
    const response = await fetch(`${API_URL}/api/v1/commercial/objectives/${objectiveId}/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch objective progress');
    }

    return response.json();
  },

  /**
   * Agrega progreso a un objetivo.
   */
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

  /**
   * Obtiene el dashboard comercial (performance y objetivos).
   */
  async getCommercialDashboard(token: string, commercialId?: string): Promise<CommercialDashboard> {
    const params = new URLSearchParams();
    if (commercialId) params.append('commercial_id', commercialId);
    
    const response = await fetch(`${API_URL}/api/v1/commercial/dashboard/commercial?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial dashboard');
    }

    return response.json();
  },

  /**
   * Obtiene el dashboard de administración de objetivos (solo tenant_admin).
   */
  async getAdminObjectiveDashboard(token: string): Promise<AdminObjectiveDashboard> {
    const response = await fetch(`${API_URL}/api/v1/commercial/dashboard/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin objective dashboard');
    }

    return response.json();
  },

  /**
   * Obtiene las plantillas de objetivos (solo tenant_admin).
   */
  async getObjectiveTemplates(token: string, isActive?: boolean): Promise<ObjectiveTemplate[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append('is_active', isActive.toString());
    
    const response = await fetch(`${API_URL}/api/v1/commercial/templates?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch objective templates');
    }

    return response.json();
  },

  /**
   * Crea una nueva plantilla de objetivo (solo tenant_admin).
   */
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

  // ============================================
  // PATIENT MANAGEMENT
  // ============================================

  async getPatients(token: string, search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await fetch(`${API_URL}/api/v1/patients/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patients');
    }

    return response.json();
  },

  async getPatientDetails(token: string, patientId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/v1/patients/${patientId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient details');
    }

    return response.json();
  },

  async getPatientBasic(token: string, patientId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/v1/patients/${patientId}/basic`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch basic patient info');
    }

    return response.json();
  },

  // ============================================
  // COMMERCIAL STATS
  // ============================================

  async getCommercialStats(
    token: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<CommercialStatsResponse> {
    let url = `${API_URL}/api/v1/commercial-stats/`;
    const params = new URLSearchParams();
    
    if (dateFrom) {
      params.append('date_from', dateFrom);
    }
    if (dateTo) {
      params.append('date_to', dateTo);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commercial statistics');
    }

    return response.json();
  },

  // Generic HTTP methods for API calls
  async get(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
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

  async post(url: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
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

  async put(url: string, data: any, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
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

  async delete(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
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
};

// ============================================
// APPOINTMENT TYPES
// ============================================

export type AppointmentStatus = 
  | 'scheduled'        // Cita programada
  | 'confirmed'        // Cita confirmada por el paciente
  | 'in_progress'      // Cita en curso
  | 'completed'        // Cita completada
  | 'no_show'         // Paciente no se presentó
  | 'cancelled_by_patient'  // Cancelada por el paciente
  | 'cancelled_by_clinic'   // Cancelada por la clínica
  | 'rescheduled';     // Reprogramada

export type AppointmentType = 
  | 'consultation'     // Consulta inicial/valoración
  | 'treatment'        // Sesión de tratamiento
  | 'follow_up'        // Seguimiento post-tratamiento
  | 'emergency';       // Emergencia o urgencia

export interface Appointment {
  id: string;
  tenant_id: string;
  lead_id?: string;
  patient_id?: string;
  provider_id: string;
  service_id?: string;  // Made optional to match backend
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  title?: string;
  notes?: string;
  internal_notes?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
  deposit_paid?: number;
  confirmed_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  actual_duration_minutes?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  
  // Información relacionada
  service_name: string;
  service_duration: number;
  provider_name: string;
  provider_email: string;
  lead_full_name?: string;
  patient_full_name?: string;
  cancelled_by_name?: string;
  
  // Campos computados
  scheduled_end_at: string;
  is_today: boolean;
  is_past_due: boolean;
  is_upcoming: boolean;
  is_active: boolean;
  can_be_cancelled: boolean;
  can_be_rescheduled: boolean;
  needs_confirmation: boolean;
  needs_reminder: boolean;
  status_color: string;
}

export interface AppointmentDetailed extends Appointment {
  patient_details?: any;
  provider_details?: any;
  service_details?: any;
  lead_details?: any;
  status_history: any[];
  attachments: any[];
}

export interface AppointmentCreate {
  lead_id?: string;
  patient_id?: string;
  provider_id: string;
  service_id?: string;  // Made optional to match backend
  type?: AppointmentType;
  scheduled_at: string;
  duration_minutes?: number;
  title?: string;
  notes?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
}

export interface AppointmentUpdate {
  lead_id?: string;
  patient_id?: string;
  provider_id?: string;
  service_id?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  title?: string;
  notes?: string;
  internal_notes?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  estimated_cost?: number;
  quoted_price?: number;
  deposit_required?: number;
  deposit_paid?: number;
}

export interface AppointmentStats {
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  appointments_by_status: Record<string, number>;
  appointments_by_type: Record<string, number>;
  appointments_by_provider: Record<string, number>;
  show_up_rate: number;
  on_time_rate: number;
  average_duration: number;
  appointments_trend: any[];
}

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

// ============================================
// SERVICE TYPES
// ============================================

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service_count?: number;
}

export interface ServiceCategoryCreate {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
}

export interface ServiceCategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  short_description?: string;
  description?: string;
  
  // Precios
  price_min?: number;
  price_max?: number;
  price_consultation?: number;
  
  // Duración y sesiones
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;
  
  // Configuración del servicio
  requires_consultation: boolean;
  requires_preparation: boolean;
  has_contraindications: boolean;
  
  // Información médica
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;
  
  // Configuración de agenda
  booking_buffer_before: number;
  booking_buffer_after: number;
  max_daily_bookings?: number;
  
  // Targeting de marketing
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';
  
  // SEO y marketing
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  
  // Imágenes y multimedia
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;
  
  // Estado y configuración
  is_active: boolean;
  is_featured: boolean;
  is_online_bookable: boolean;
  display_order: number;
  
  created_at: string;
  updated_at: string;
  
  // Información relacionada
  category_name: string;
  
  // Campos computados
  price_range_text: string;
  session_count_text: string;
  
  // Estadísticas opcionales
  lead_count?: number;
  appointment_count?: number;
  treatment_count?: number;
}

export interface ServiceCreate {
  category_id: string;
  name: string;
  short_description?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_consultation?: number;
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;
  requires_consultation?: boolean;
  requires_preparation?: boolean;
  has_contraindications?: boolean;
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;
  booking_buffer_before?: number;
  booking_buffer_after?: number;
  max_daily_bookings?: number;
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_online_bookable?: boolean;
  display_order?: number;
}

export interface ServiceUpdate {
  category_id?: string;
  name?: string;
  short_description?: string;
  description?: string;
  price_min?: number;
  price_max?: number;
  price_consultation?: number;
  duration_minutes?: number;
  session_count_min?: number;
  session_count_max?: number;
  requires_consultation?: boolean;
  requires_preparation?: boolean;
  has_contraindications?: boolean;
  preparation_instructions?: string;
  aftercare_instructions?: string;
  contraindications?: string;
  side_effects?: string;
  booking_buffer_before?: number;
  booking_buffer_after?: number;
  max_daily_bookings?: number;
  target_age_min?: number;
  target_age_max?: number;
  target_gender?: 'masculino' | 'femenino' | 'ambos';
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  gallery_images?: string[];
  video_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_online_bookable?: boolean;
  display_order?: number;
}

// ============================================
// COMMERCIAL OBJECTIVES TYPES
// ============================================

export type ObjectiveType = 'leads' | 'conversions' | 'revenue' | 'appointments' | 'calls' | 'meetings' | 'satisfaction';
export type ObjectivePeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ObjectiveStatus = 'active' | 'completed' | 'paused' | 'cancelled' | 'overdue';

export interface CommercialObjective {
  id: string;
  tenant_id: string;
  commercial_id: string;
  created_by_id: string;
  title: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  target_value: number;
  current_value: number;
  unit?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_public: boolean;
  auto_calculate: boolean;
  reward_description?: string;
  reward_amount?: number;
  status: ObjectiveStatus;
  completion_date?: string;
  created_at: string;
  updated_at: string;
  
  // Información relacionada
  commercial_name: string;
  commercial_email: string;
  created_by_name: string;
  
  // Campos computados
  progress_percentage: number;
  is_completed: boolean;
  is_overdue: boolean;
  days_remaining: number;
  
  // Estadísticas del período
  period_stats?: any;
}

export interface CommercialObjectiveCreate {
  commercial_id: string;
  title: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  target_value: number;
  unit?: string;
  start_date: string;
  end_date: string;
  is_public?: boolean;
  auto_calculate?: boolean;
  reward_description?: string;
  reward_amount?: number;
}

export interface CommercialObjectiveUpdate {
  title?: string;
  description?: string;
  target_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_public?: boolean;
  auto_calculate?: boolean;
  reward_description?: string;
  reward_amount?: number;
  status?: ObjectiveStatus;
}

export interface ObjectiveProgress {
  id: string;
  objective_id: string;
  previous_value: number;
  new_value: number;
  increment: number;
  notes?: string;
  recorded_by_id?: string;
  recorded_by_name?: string;
  is_automatic: boolean;
  metadata?: any;
  recorded_at: string;
  objective_title: string;
}

export interface ObjectiveProgressCreate {
  objective_id: string;
  increment: number;
  notes?: string;
  metadata?: any;
}

export interface CommercialPerformance {
  id: string;
  tenant_id: string;
  commercial_id: string;
  period: ObjectivePeriod;
  period_start: string;
  period_end: string;
  
  // Métricas de leads
  total_leads_assigned: number;
  total_leads_contacted: number;
  total_leads_converted: number;
  conversion_rate: number;
  
  // Métricas de citas
  total_appointments_scheduled: number;
  total_appointments_completed: number;
  appointment_show_rate: number;
  
  // Métricas de ingresos
  total_revenue_generated: number;
  average_deal_size: number;
  
  // Métricas de actividad
  total_calls_made: number;
  total_emails_sent: number;
  total_meetings_held: number;
  
  // Métricas de satisfacción
  average_satisfaction_score: number;
  total_satisfaction_surveys: number;
  
  // Objetivos
  objectives_assigned: number;
  objectives_completed: number;
  objectives_completion_rate: number;
  
  created_at: string;
  updated_at: string;
  
  // Información relacionada
  commercial_name: string;
  commercial_email: string;
  
  // Comparaciones
  lead_growth_rate?: number;
  revenue_growth_rate?: number;
  conversion_improvement?: number;
}

export interface ObjectiveTemplate {
  id: string;
  tenant_id: string;
  created_by_id: string;
  name: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  default_target_value: number;
  default_unit?: string;
  default_reward_description?: string;
  default_reward_amount?: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

export interface ObjectiveTemplateCreate {
  name: string;
  description?: string;
  type: ObjectiveType;
  period: ObjectivePeriod;
  default_target_value: number;
  default_unit?: string;
  default_reward_description?: string;
  default_reward_amount?: number;
}

export interface CommercialDashboard {
  commercial_id: string;
  commercial_name: string;
  active_objectives: CommercialObjective[];
  completed_objectives_this_period: number;
  overdue_objectives: number;
  current_period_performance?: CommercialPerformance;
  previous_period_performance?: CommercialPerformance;
  total_leads_this_month: number;
  total_revenue_this_month: number;
  conversion_rate_this_month: number;
  objectives_completion_rate: number;
  upcoming_deadlines: any[];
  suggestions: string[];
}

export interface AdminObjectiveDashboard {
  total_commercials: number;
  total_active_objectives: number;
  overall_completion_rate: number;
  commercial_rankings: any[];
  objectives_by_status: Record<string, number>;
  objectives_by_type: Record<string, number>;
  overdue_objectives: CommercialObjective[];
  underperforming_commercials: any[];
  period_summary: any;
}

// ============================================
// COMMERCIAL STATS TYPES
// ============================================

export interface CommercialStatsOverview {
  total_leads: number;
  leads_this_month: number;
  conversion_rate: number;
  active_patients: number;
}

export interface CommercialStatsMonthlyTrends {
  leads_growth: number;
  conversion_growth: number;
  revenue_growth: number;
}

export interface CommercialStatsFunnel {
  nuevo: number;
  contactado: number;
  calificado: number;
  cita_agendada: number;
  en_tratamiento: number;
  completado: number;
}

export interface CommercialStatsSources {
  website: number;
  facebook: number;
  instagram: number;
  referidos: number;
  google: number;
  otros: number;
}

export interface CommercialStatsDoctorPerformance {
  name: string;
  leads_assigned: number;
  conversion_rate: number;
  active_patients: number;
}

export interface CommercialStatsResponse {
  overview: CommercialStatsOverview;
  monthly_trends: CommercialStatsMonthlyTrends;
  funnel: CommercialStatsFunnel;
  sources: CommercialStatsSources;
  doctors_performance: CommercialStatsDoctorPerformance[];
}
