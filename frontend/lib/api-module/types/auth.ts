/**
 * Authentication types
 */

import { UserRole } from './common';

export interface LoginCredentials {
  username: string;
  password: string;
}

// Legacy simple login response
export interface LoginResponseSimple {
  access_token: string;
  token_type: string;
}

// Multi-tenant available tenant for selection
export interface AvailableTenant {
  membership_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_logo?: string;
  role: UserRole;
  is_default: boolean;
  last_access_at?: string;
}

// Multi-tenant login response
export interface LoginResponse {
  access_token: string;
  token_type: string;
  requires_tenant_selection: boolean;
  available_tenants: AvailableTenant[];
  user_id?: string;
  email?: string;
  is_superadmin: boolean;
  selected_tenant_id?: string;
  selected_role?: UserRole;
}

// Select tenant request/response
export interface SelectTenantRequest {
  tenant_id: string;
}

export interface SelectTenantResponse {
  access_token: string;
  token_type: string;
  tenant_id: string;
  tenant_name: string;
  role: UserRole;
}

// My tenants response (for tenant switcher)
export interface MyTenantsResponse {
  is_superadmin: boolean;
  tenants: Array<{
    membership_id: string;
    tenant_id: string;
    tenant_name: string;
    tenant_slug: string;
    tenant_logo?: string;
    role: string;
    is_default: boolean;
    is_current: boolean;
  }>;
  current_tenant_id?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
