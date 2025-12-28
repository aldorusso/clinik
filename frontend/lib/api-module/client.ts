/**
 * API Client - Base HTTP client for all API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export { API_URL };

/**
 * Generic GET request
 */
export async function apiGet<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(`${API_URL}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Error parsing response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Generic POST request
 */
export async function apiPost<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const { headers: optionHeaders, ...restOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(optionHeaders as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    ...(restOptions.signal ? { signal: restOptions.signal } : {}),
    ...(restOptions.credentials ? { credentials: restOptions.credentials } : {}),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err: { loc?: string[]; msg?: string }) => {
            const field = err.loc?.slice(1).join('.') || 'campo';
            return `${field}: ${err.msg}`;
          })
          .join(', ');
      } else {
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
    } catch (e) {
      // Error parsing response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Generic PUT request
 */
export async function apiPut<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(`${API_URL}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Error parsing response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Error parsing response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Generic PATCH request
 */
export async function apiPatch<T>(url: string, data?: any, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(`${API_URL}${url}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...(data && { body: JSON.stringify(data) }),
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Error parsing response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
