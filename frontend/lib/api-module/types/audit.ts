/**
 * Audit log types
 */

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
