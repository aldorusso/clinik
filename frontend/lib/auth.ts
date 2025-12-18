import { AvailableTenant, LoginResponse, SelectTenantResponse, MyTenantsResponse } from './api';

export const TOKEN_KEY = 'auth_token';
export const PENDING_TENANTS_KEY = 'pending_tenant_selection';
export const CURRENT_TENANT_KEY = 'current_tenant';

export interface PendingTenantSelection {
  token: string;
  tenants: AvailableTenant[];
  userId: string;
  email: string;
}

export interface CurrentTenantInfo {
  tenantId: string;
  tenantName: string;
  role: string;
}

export const auth = {
  // ============================================
  // Token Management
  // ============================================
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // ============================================
  // Multi-Tenant: Pending Selection
  // ============================================
  setPendingTenantSelection(data: PendingTenantSelection) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_TENANTS_KEY, JSON.stringify(data));
    }
  },

  getPendingTenantSelection(): PendingTenantSelection | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(PENDING_TENANTS_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  clearPendingTenantSelection() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_TENANTS_KEY);
    }
  },

  hasPendingTenantSelection(): boolean {
    return !!this.getPendingTenantSelection();
  },

  // ============================================
  // Multi-Tenant: Current Tenant Info
  // ============================================
  setCurrentTenant(info: CurrentTenantInfo) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_TENANT_KEY, JSON.stringify(info));
    }
  },

  getCurrentTenant(): CurrentTenantInfo | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(CURRENT_TENANT_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  clearCurrentTenant() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_TENANT_KEY);
    }
  },

  // ============================================
  // Login Flow Handlers
  // ============================================

  /**
   * Process login response and handle multi-tenant flow
   * Returns:
   * - { success: true, requiresTenantSelection: false } - Direct login
   * - { success: true, requiresTenantSelection: true, tenants: [...] } - Need to select tenant
   */
  processLoginResponse(response: LoginResponse): {
    success: boolean;
    requiresTenantSelection: boolean;
    tenants?: AvailableTenant[];
    error?: string;
  } {
    if (response.requires_tenant_selection) {
      // Store temporary token and available tenants
      this.setPendingTenantSelection({
        token: response.access_token,
        tenants: response.available_tenants,
        userId: response.user_id || '',
        email: response.email || '',
      });

      return {
        success: true,
        requiresTenantSelection: true,
        tenants: response.available_tenants,
      };
    }

    // Direct login - store token and clear pending selection
    this.setToken(response.access_token);
    this.clearPendingTenantSelection();

    // Store current tenant info if available
    if (response.selected_tenant_id && response.selected_role) {
      const selectedTenant = response.available_tenants?.find(
        t => t.tenant_id === response.selected_tenant_id
      );
      this.setCurrentTenant({
        tenantId: response.selected_tenant_id,
        tenantName: selectedTenant?.tenant_name || '',
        role: response.selected_role,
      });
    }

    return {
      success: true,
      requiresTenantSelection: false,
    };
  },

  /**
   * Complete tenant selection after login
   */
  completeTenantSelection(response: SelectTenantResponse) {
    // Clear pending and set final token
    this.clearPendingTenantSelection();
    this.setToken(response.access_token);

    // Store current tenant info
    this.setCurrentTenant({
      tenantId: response.tenant_id,
      tenantName: response.tenant_name,
      role: response.role,
    });
  },

  /**
   * Switch to a different tenant
   */
  switchTenant(response: SelectTenantResponse) {
    this.setToken(response.access_token);
    this.setCurrentTenant({
      tenantId: response.tenant_id,
      tenantName: response.tenant_name,
      role: response.role,
    });
  },

  // ============================================
  // Full Logout
  // ============================================
  logout() {
    this.removeToken();
    this.clearPendingTenantSelection();
    this.clearCurrentTenant();
  },
};
