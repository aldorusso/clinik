/**
 * Plan types
 */

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
