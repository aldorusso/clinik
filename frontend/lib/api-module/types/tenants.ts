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
