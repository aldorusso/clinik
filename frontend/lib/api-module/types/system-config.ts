/**
 * System configuration types
 */

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
