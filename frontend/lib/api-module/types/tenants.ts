/**
 * Tenant types
 */

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
  // Option 1: Use existing user (only need ID)
  existing_admin_id?: string;

  // Option 2: Create new user (need email + password)
  admin_email?: string;
  admin_password?: string;
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

// Tenant Settings (for tenant_admin configuration)
export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  legal_name?: string;
  logo?: string;
  primary_color?: string;
  // SMTP configuration (password not returned)
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password_set: boolean;
  smtp_from_email?: string;
  smtp_from_name?: string;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  smtp_enabled: boolean;
  // Metadata
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettingsUpdate {
  // Organization info
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  legal_name?: string;
  logo?: string;
  primary_color?: string;
  // SMTP configuration
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_from_email?: string;
  smtp_from_name?: string;
  smtp_use_tls?: boolean;
  smtp_use_ssl?: boolean;
  smtp_enabled?: boolean;
}

export interface SmtpTestRequest {
  test_email: string;
}

export interface SmtpTestResponse {
  success: boolean;
  message: string;
}
