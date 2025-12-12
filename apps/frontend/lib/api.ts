import axios from 'axios';
import { getCurrentSession } from './supabase';

export interface Goal {
  id: string;
  title: string;
  type: 'YEARLY' | 'QUARTERLY';
  parentId: string | null;
  children?: Goal[];
  categories?: Category[];
  tasks?: any[]; // Using any for tasks to avoid circular dep issues for now, or import Task type
}

export interface Category {
  id: string;
  name: string;
  goalId: string | null;
  tasks?: any[];
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor to include Supabase JWT token
api.interceptors.request.use(async (config) => {
  const session = await getCurrentSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    throw error.response?.data || {
      error: error.message || 'Unknown error',
      status: error.response?.status,
    };
  }
);

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const authApi = {
  getMe: () => api.get('/auth/me'),
};

export const meetingsApi = {
  create: (data: any) => api.post('/meetings', data),
  list: () => api.get('/meetings'),
  get: (id: string) => api.get(`/meetings/${id}`),
  delete: (id: string) => api.delete(`/meetings/${id}`),
  confirmTasks: (id: string) => api.post(`/meetings/${id}/confirm-tasks`),
  reprocess: (id: string) => api.post(`/meetings/${id}/reprocess`),
};

export const tasksApi = {
  list: (filters?: any) => api.get('/tasks', { params: filters }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  markReviewed: (id: string) => api.put(`/tasks/${id}/review`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const contactsApi = {
  list: () => api.get('/contacts'),
  getStats: () => api.get('/contacts/stats'),
  create: (data: any) => api.post('/contacts', data),
  update: (id: string, data: any) => api.patch(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

// ============================================================================
// GOALS API
// ============================================================================

export const goalsApi = {
  list: () => api.get('/goals'),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.patch(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};



export const categoriesApi = {
  list: async () => {
    return api.get('/categories');
  },
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};

// ============================================================================
// TEAM API
// ============================================================================

export const teamsApi = {
  getCurrent: () => api.get('/teams/current'),
  create: (data: { name: string }) => api.post('/teams', data),
  update: (id: string, data: { name?: string }) => api.patch(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  leave: (id: string) => api.post(`/teams/${id}/leave`),
  updateMemberRole: (teamId: string, userId: string, role: string) =>
    api.post(`/teams/${teamId}/members/${userId}/role`, { role }),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

export const invitesApi = {
  sendEmail: (email: string) => api.post('/invites/email', { email }),
  generateLink: () => api.post('/invites/link'),
  getByToken: (token: string) => api.get(`/invites/${token}`),
  accept: (token: string) => api.post(`/invites/${token}/accept`),
  list: () => api.get('/invites'),
  revoke: (id: string) => api.delete(`/invites/${id}`),
};