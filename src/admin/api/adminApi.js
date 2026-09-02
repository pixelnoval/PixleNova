import { request } from './client.js';

export const adminApi = {
  /** GET /api/admin/admins */
  list: () => request('/api/admin/admins'),

  /** POST /api/admin/admins */
  create: (data) =>
    request('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** PUT /api/admin/admins/:id */
  update: (id, data) =>
    request(`/api/admin/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** PATCH /api/admin/admins/:id/status */
  updateStatus: (id, isActive) =>
    request(`/api/admin/admins/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  /** PATCH /api/admin/admins/:id/password */
  resetPassword: (id, password) =>
    request(`/api/admin/admins/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

  /** DELETE /api/admin/admins/:id */
  delete: (id) =>
    request(`/api/admin/admins/${id}`, {
      method: 'DELETE',
    }),
};
