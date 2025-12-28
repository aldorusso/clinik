/**
 * API Module - Main entry point
 *
 * This file maintains backwards compatibility with the original api.ts file.
 * All existing imports from '@/lib/api' will continue to work.
 *
 * New code should prefer importing from specific modules:
 * - Types: import type { User, Lead } from '@/lib/api-module/types'
 * - Endpoints: import { authEndpoints } from '@/lib/api-module/endpoints'
 */

// Re-export all types for backwards compatibility
export * from './api-module/types';

// Re-export client utilities
export { API_URL, apiGet, apiPost, apiPut, apiDelete, apiPatch } from './api-module/client';

// Import all endpoint modules
import { authEndpoints } from './api-module/endpoints/auth';
import { userEndpoints } from './api-module/endpoints/users';
import { tenantEndpoints } from './api-module/endpoints/tenants';
import { leadEndpoints } from './api-module/endpoints/leads';
import { appointmentEndpoints } from './api-module/endpoints/appointments';
import { serviceEndpoints } from './api-module/endpoints/services';
import { notificationEndpoints } from './api-module/endpoints/notifications';
import { auditEndpoints } from './api-module/endpoints/audit';
import { commercialEndpoints } from './api-module/endpoints/commercial';
import { miscEndpoints } from './api-module/endpoints/misc';
import { apiGet, apiPost, apiPut, apiDelete } from './api-module/client';

/**
 * Unified API object for backwards compatibility
 * Combines all endpoint modules into a single object matching the original api.ts structure
 */
export const api = {
  // Auth endpoints
  ...authEndpoints,

  // User endpoints
  ...userEndpoints,

  // Tenant endpoints
  ...tenantEndpoints,

  // Lead endpoints
  ...leadEndpoints,

  // Appointment endpoints
  ...appointmentEndpoints,

  // Service endpoints
  ...serviceEndpoints,

  // Notification endpoints
  ...notificationEndpoints,

  // Audit endpoints
  ...auditEndpoints,

  // Commercial endpoints
  ...commercialEndpoints,

  // Misc endpoints (email templates, plans, system config, patients)
  ...miscEndpoints,

  // Generic HTTP methods for backwards compatibility
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};
