/**
 * Audit log endpoints
 */

import { API_URL } from '../client';
import type { AuditLogListResponse, AuditStats } from '../types';

export const auditEndpoints = {
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
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  },

  async getAuditStats(token: string): Promise<AuditStats> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit stats');
    }

    return response.json();
  },

  async getAuditActions(token: string): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/actions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit actions');
    }

    return response.json();
  },

  async getAuditCategories(token: string): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/categories`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit categories');
    }

    return response.json();
  },

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
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }

    return response.json();
  },

  async getTenantActivityStats(token: string): Promise<AuditStats> {
    const response = await fetch(`${API_URL}/api/v1/audit-logs/tenant/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity stats');
    }

    return response.json();
  },
};
