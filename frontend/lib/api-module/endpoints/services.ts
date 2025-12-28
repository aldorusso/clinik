/**
 * Service management endpoints
 */

import { API_URL } from '../client';
import type {
  Service,
  ServiceCreate,
  ServiceUpdate,
  ServiceCategory,
  ServiceCategoryCreate,
  ServiceCategoryUpdate,
} from '../types';

export const serviceEndpoints = {
  async getServiceCategories(token: string, activeOnly?: boolean): Promise<ServiceCategory[]> {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('active_only', activeOnly.toString());

    const response = await fetch(`${API_URL}/api/v1/services/categories?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service categories');
    }

    return response.json();
  },

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

  async deleteServiceCategory(token: string, categoryId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/services/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete service category');
    }
  },

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
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }

    return response.json();
  },

  async getService(token: string, serviceId: string): Promise<Service> {
    const response = await fetch(`${API_URL}/api/v1/services/${serviceId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }

    return response.json();
  },

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

  async deleteService(token: string, serviceId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/services/${serviceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete service');
    }
  },
};
