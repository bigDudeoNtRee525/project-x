import axios from 'axios';
import { getCurrentSession } from './supabase';

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
    // If the response has a data property, return it
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Throw a clean error
    throw error.response?.data || {
      error: error.message || 'Unknown error',
      status: error.response?.status,
    };
  }
);

// API endpoints
export const authApi = {
  getMe: () => api.get('/auth/me'),
};

export const meetingsApi = {
  create: (data: any) => api.post('/meetings', data),
  list: () => api.get('/meetings'),
  get: (id: string) => api.get(`/meetings/${id}`),
};

export const tasksApi = {
  list: (filters?: any) => api.get('/tasks', { params: filters }),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  markReviewed: (id: string) => api.put(`/tasks/${id}/review`),
};

export const contactsApi = {
  list: () => api.get('/contacts'),
  create: (data: any) => api.post('/contacts', data),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};