/**
 * API client functions for inventory management
 */

import { api } from './api'

// Types for inventory
export interface InventoryCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface InventoryProduct {
  id: string
  tenant_id: string
  category_id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  unit_type: string
  unit_size: number
  current_stock: number
  minimum_stock: number
  maximum_stock?: number
  cost_per_unit?: number
  supplier?: string
  supplier_code?: string
  expiration_date?: string
  last_restock_date?: string
  is_active: boolean
  requires_prescription: boolean
  is_controlled: boolean
  is_low_stock: boolean
  stock_percentage: number
  created_at: string
  updated_at?: string
  category?: InventoryCategory
}

export interface InventoryProductWithStats extends InventoryProduct {
  total_movements: number
  last_movement_date?: string
  total_used_this_month: number
  days_until_expiry?: number
}

export interface InventoryMovement {
  id: string
  tenant_id: string
  product_id: string
  movement_type: string
  quantity: number
  unit_cost?: number
  total_cost?: number
  appointment_id?: string
  user_id: string
  notes?: string
  reference_number?: string
  supplier?: string
  stock_after: number
  created_at: string
  product?: InventoryProduct
}

export interface InventoryAlert {
  id: string
  tenant_id: string
  product_id: string
  alert_type: string
  title: string
  message: string
  is_active: boolean
  is_acknowledged: boolean
  acknowledged_by_id?: string
  acknowledged_at?: string
  created_at: string
  product?: InventoryProduct
}

export interface InventoryStats {
  total_products: number
  total_categories: number
  products_low_stock: number
  products_out_of_stock: number
  products_expired: number
  products_expiring_soon: number
  total_inventory_value: number
  most_used_products: Array<{
    name: string
    total_used: number
  }>
  recent_movements: Array<{
    product_name: string
    movement_type: string
    quantity: number
    created_at: string
    notes?: string
  }>
}

export interface LowStockAlert {
  product_id: string
  product_name: string
  current_stock: number
  minimum_stock: number
  category_name: string
  unit_type: string
  days_of_supply?: number
}

// API request types
export interface InventoryCategoryCreate {
  name: string
  description?: string
  color?: string
  icon?: string
  is_active?: boolean
}

export interface InventoryProductCreate {
  category_id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  unit_type?: string
  unit_size?: number
  current_stock?: number
  minimum_stock?: number
  maximum_stock?: number
  cost_per_unit?: number
  supplier?: string
  supplier_code?: string
  expiration_date?: string
  last_restock_date?: string
  is_active?: boolean
  requires_prescription?: boolean
  is_controlled?: boolean
}

export interface InventoryProductStockUpdate {
  current_stock: number
  movement_type: string
  notes?: string
  reference_number?: string
  supplier?: string
  unit_cost?: number
}

// API Functions

// Categories
export const getInventoryCategories = async (
  token: string,
  params?: {
    skip?: number
    limit?: number
    is_active?: boolean
    search?: string
  }
): Promise<InventoryCategory[]> => {
  const searchParams = new URLSearchParams()
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
  if (params?.search) searchParams.append('search', params.search)

  return api.get(`/api/v1/inventory/categories/?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const createInventoryCategory = async (
  token: string,
  category: InventoryCategoryCreate
): Promise<InventoryCategory> => {
  return api.post('/api/v1/inventory/categories/', category, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const updateInventoryCategory = async (
  token: string,
  categoryId: string,
  category: Partial<InventoryCategoryCreate>
): Promise<InventoryCategory> => {
  return api.put(`/api/v1/inventory/categories/${categoryId}`, category, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Products
export const getInventoryProducts = async (
  token: string,
  params?: {
    skip?: number
    limit?: number
    category_id?: string
    is_active?: boolean
    low_stock_only?: boolean
    search?: string
  }
): Promise<InventoryProductWithStats[]> => {
  const searchParams = new URLSearchParams()
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
  if (params?.category_id) searchParams.append('category_id', params.category_id)
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
  if (params?.low_stock_only !== undefined) searchParams.append('low_stock_only', params.low_stock_only.toString())
  if (params?.search) searchParams.append('search', params.search)

  return api.get(`/api/v1/inventory/products/?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const getInventoryProduct = async (
  token: string,
  productId: string
): Promise<InventoryProductWithStats> => {
  return api.get(`/api/v1/inventory/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const createInventoryProduct = async (
  token: string,
  product: InventoryProductCreate
): Promise<InventoryProduct> => {
  return api.post('/api/v1/inventory/products/', product, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const updateInventoryProduct = async (
  token: string,
  productId: string,
  product: Partial<InventoryProductCreate>
): Promise<InventoryProduct> => {
  return api.put(`/api/v1/inventory/products/${productId}`, product, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const updateProductStock = async (
  token: string,
  productId: string,
  stockUpdate: InventoryProductStockUpdate
): Promise<InventoryProduct> => {
  return api.put(`/api/v1/inventory/products/${productId}/stock`, stockUpdate, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Movements
export const getInventoryMovements = async (
  token: string,
  params?: {
    skip?: number
    limit?: number
    product_id?: string
    movement_type?: string
    start_date?: string
    end_date?: string
  }
): Promise<InventoryMovement[]> => {
  const searchParams = new URLSearchParams()
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
  if (params?.product_id) searchParams.append('product_id', params.product_id)
  if (params?.movement_type) searchParams.append('movement_type', params.movement_type)
  if (params?.start_date) searchParams.append('start_date', params.start_date)
  if (params?.end_date) searchParams.append('end_date', params.end_date)

  return api.get(`/api/v1/inventory/movements/?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Alerts
export const getInventoryAlerts = async (
  token: string,
  params?: {
    skip?: number
    limit?: number
    is_active?: boolean
    is_acknowledged?: boolean
    alert_type?: string
  }
): Promise<InventoryAlert[]> => {
  const searchParams = new URLSearchParams()
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString())
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString())
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString())
  if (params?.is_acknowledged !== undefined) searchParams.append('is_acknowledged', params.is_acknowledged.toString())
  if (params?.alert_type) searchParams.append('alert_type', params.alert_type)

  return api.get(`/api/v1/inventory/alerts/?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const acknowledgeAlert = async (
  token: string,
  alertId: string
): Promise<{ message: string }> => {
  return api.put(`/api/v1/inventory/alerts/${alertId}/acknowledge`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Statistics
export const getInventoryStats = async (
  token: string
): Promise<InventoryStats> => {
  return api.get('/api/v1/inventory/stats/', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const getLowStockAlerts = async (
  token: string
): Promise<LowStockAlert[]> => {
  return api.get('/api/v1/inventory/low-stock-alerts/', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Inventory Usage API
export interface AppointmentInventoryUsage {
  id: string
  appointment_id: string
  product_id: string
  quantity_used: number
  notes?: string
  recorded_by_id: string
  created_at: string
  product?: InventoryProduct
}

export interface AppointmentInventoryUsageCreate {
  appointment_id: string
  product_id: string
  quantity_used: number
  notes?: string
}

export const recordInventoryUsage = async (
  token: string,
  appointmentId: string,
  usage: {
    product_id: string
    quantity_used: number
    notes?: string
  }
): Promise<AppointmentInventoryUsage> => {
  return api.post(`/api/v1/inventory-usage/appointments/${appointmentId}/usage/`, usage, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export const getAppointmentInventoryUsage = async (
  token: string,
  appointmentId: string
): Promise<AppointmentInventoryUsage[]> => {
  return api.get(`/api/v1/inventory-usage/appointments/${appointmentId}/usage/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Constants
export const UNIT_TYPES = [
  { value: 'piezas', label: 'Piezas' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'cajas', label: 'Cajas' },
  { value: 'frascos', label: 'Frascos' },
  { value: 'viales', label: 'Viales' },
  { value: 'ampollas', label: 'Ampollas' },
  { value: 'tabletas', label: 'Tabletas' },
  { value: 'cápsulas', label: 'Cápsulas' },
  { value: 'metros', label: 'Metros' },
]

export const MOVEMENT_TYPES = {
  // Entradas
  'compra': 'Compra',
  'donacion': 'Donación',
  'devolucion': 'Devolución',
  'ajuste_entrada': 'Ajuste (Entrada)',
  
  // Salidas
  'uso': 'Uso en tratamiento',
  'vencido': 'Producto vencido',
  'dañado': 'Producto dañado',
  'perdida': 'Pérdida',
  'ajuste_salida': 'Ajuste (Salida)',
}

export const ALERT_TYPES = {
  'low_stock': 'Stock Bajo',
  'out_of_stock': 'Sin Stock',
  'expiring_soon': 'Próximo a Vencer',
  'expired': 'Vencido',
}