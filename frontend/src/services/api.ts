import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Dev mode: send role header
    const role = localStorage.getItem('devRole') || 'Admin';
    config.headers['X-User-Role'] = role;
    config.headers['X-User-Id'] = 'dev-user';
  }
  return config;
});

export default api;

// ---- Vendors ----
export const vendorApi = {
  list: (params?: any) => api.get('/vendors', { params }),
  get: (id: string) => api.get(`/vendors/${id}`),
  create: (data: any) => api.post('/vendors', data),
  update: (id: string, data: any) => api.patch(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  deactivate: (id: string) => api.post(`/vendors/${id}/deactivate`),
};

// ---- Contracts ----
export const contractApi = {
  list: (params?: any) => api.get('/contracts', { params }),
  get: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.patch(`/contracts/${id}`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  archive: (id: string) => api.post(`/contracts/${id}/archive`),
  restore: (id: string) => api.post(`/contracts/${id}/restore`),
  exportCsv: (params?: any) => api.get('/contracts/export.csv', { params, responseType: 'blob' }),
  uploadSpec: () => api.get('/contracts/upload/spec'),
  upload: (formData: FormData) => api.post('/contracts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ---- Reminders ----
export const reminderApi = {
  listForContract: (contractId: string) => api.get(`/contracts/${contractId}/reminders`),
  listAll: (params?: any) => api.get('/reminders', { params }),
  create: (contractId: string, data: any) => api.post(`/contracts/${contractId}/reminders`, data),
  update: (id: string, data: any) => api.patch(`/reminders/${id}`, data),
};

// ---- Dashboard ----
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

// ---- Activity ----
export const activityApi = {
  list: (params?: any) => api.get('/activity', { params }),
};

// ---- Documents ----
export const documentApi = {
  listForContract: (contractId: string) => api.get(`/contracts/${contractId}/documents`),
};

// ---- Users ----
export const userApi = {
  list: () => api.get('/users'),
};
