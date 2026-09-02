/**
 * Centralized API client for the Admin Panel.
 *
 * Exact response shapes this client handles (verified against backend source):
 *
 * POST /api/auth/login  → { success, message, data: { token, admin: { id, email } } }
 * GET  /api/auth/me     → { success, data: { admin: { id, email, createdAt } } }
 * POST /api/auth/logout → { success, message }
 * GET  /api/contact     → { success, data: [...contacts], pagination: { page, limit, total, totalPages } }
 * GET  /api/contact/:id → { success, data: { id, name, email, message, status, createdAt, updatedAt } }
 * PATCH /api/contact/:id/status → { success, message, data: updatedContact }
 * DELETE /api/contact/:id       → { success, message }
 *
 * All errors: { success: false, message: string }
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'pn_admin_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Core fetch wrapper.
 * - Injects Authorization header when token exists
 * - Parses JSON response
 * - On 401: clears token and dispatches a custom event for AuthContext to handle
 * - Throws on non-2xx responses with the backend's message field
 */
export async function request(path, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Network error — unable to reach the server.');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
  }

  if (response.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error(body.message || 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(body.message || `Request failed (HTTP ${response.status}).`);
  }

  return body;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────


export const authApi = {
  /** POST /api/auth/login → { data: { token, admin } } */
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** GET /api/auth/me → { data: { admin } } */
  me: () => request('/api/auth/me'),

  /** POST /api/auth/logout → { success, message } */
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// ─── CONTACT ─────────────────────────────────────────────────────────────────

export const contactApi = {
  /**
   * GET /api/contact
   * Returns { data: contact[], pagination: { page, limit, total, totalPages } }
   * Params: page, limit, status, search, sort, order
   */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page)   qs.set('page',   String(params.page));
    if (params.limit)  qs.set('limit',  String(params.limit));
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    if (params.sort)   qs.set('sort',   params.sort);
    if (params.order)  qs.set('order',  params.order);
    const query = qs.toString();
    return request(`/api/contact${query ? `?${query}` : ''}`);
  },

  /** GET /api/contact/:id → { data: contact } */
  get: (id) => request(`/api/contact/${id}`),

  /** PATCH /api/contact/:id/status → { data: updatedContact } */
  updateStatus: (id, status) =>
    request(`/api/contact/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  /** DELETE /api/contact/:id → { success, message } */
  delete: (id) => request(`/api/contact/${id}`, { method: 'DELETE' }),
};
