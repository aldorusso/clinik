/**
 * User types
 */

import { UserRole } from './common';

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
