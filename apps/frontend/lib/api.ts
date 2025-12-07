import axios from 'axios';
import { getCurrentSession } from './supabase';
import {
  mockContacts,
  mockMeetings,
  mockTasks,
  mockYearlyObjectives,
  getMockMeetingById,
  getMockTasksByMeetingId,
  filterMockTasks,
  type YearlyObjective,
  type QuarterlyObjective,
} from './mockData';

// ============================================================================
// MOCK DATA TOGGLE
// Set to true to use mock data instead of real API calls
// ============================================================================
export const USE_MOCK_DATA = true;

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

// Simulate API delay for realistic feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// API ENDPOINTS (with mock data support)
// ============================================================================

export const authApi = {
  getMe: () => api.get('/auth/me'),
};

export const meetingsApi = {
  create: async (data: any) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      const newMeeting = {
        id: `meeting-${Date.now()}`,
        userId: 'mock-user',
        title: data.title,
        transcript: data.transcript,
        processed: false,
        processedAt: null,
        metadata: data.metadata || {},
        createdAt: new Date(),
        _count: { tasks: 0 },
      };
      // In a real implementation, we'd add to the mock array
      return newMeeting;
    }
    return api.post('/meetings', data);
  },
  list: async () => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return { meetings: mockMeetings };
    }
    return api.get('/meetings');
  },
  get: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(200);
      const meeting = getMockMeetingById(id);
      if (!meeting) {
        throw { error: 'Meeting not found', status: 404 };
      }
      const tasks = getMockTasksByMeetingId(id);
      return { meeting: { ...meeting, tasks } };
    }
    return api.get(`/meetings/${id}`);
  },
};

export const tasksApi = {
  list: async (filters?: any) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      const filteredTasks = filters ? filterMockTasks(filters) : mockTasks;
      return { tasks: filteredTasks };
    }
    return api.get('/tasks', { params: filters });
  },
  update: async (id: string, data: any) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const task = mockTasks.find(t => t.id === id);
      if (!task) {
        throw { error: 'Task not found', status: 404 };
      }
      // Return updated task (in real impl, we'd mutate the mock array)
      return { task: { ...task, ...data, updatedAt: new Date() } };
    }
    return api.patch(`/tasks/${id}`, data);
  },
  markReviewed: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      const task = mockTasks.find(t => t.id === id);
      if (!task) {
        throw { error: 'Task not found', status: 404 };
      }
      return { task: { ...task, reviewed: true, reviewedAt: new Date() } };
    }
    return api.put(`/tasks/${id}/review`);
  },
};

export const contactsApi = {
  list: async () => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return { contacts: mockContacts };
    }
    return api.get('/contacts');
  },
  create: async (data: any) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const newContact = {
        id: `contact-${Date.now()}`,
        userId: 'mock-user',
        name: data.name,
        email: data.email || null,
        role: data.role || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { contact: newContact };
    }
    return api.post('/contacts', data);
  },
  update: async (id: string, data: any) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      const contact = mockContacts.find(c => c.id === id);
      if (!contact) {
        throw { error: 'Contact not found', status: 404 };
      }
      return { contact: { ...contact, ...data, updatedAt: new Date() } };
    }
    return api.patch(`/contacts/${id}`, data);
  },
  delete: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return { success: true };
    }
    return api.delete(`/contacts/${id}`);
  },
};

// ============================================================================
// OBJECTIVES API (Mock only for now)
// ============================================================================

export const objectivesApi = {
  listYearly: async (year?: number): Promise<{ objectives: YearlyObjective[] }> => {
    await delay(300);
    const objectives = year
      ? mockYearlyObjectives.filter(o => o.year === year)
      : mockYearlyObjectives;
    return { objectives };
  },
  getYearly: async (id: string): Promise<{ objective: YearlyObjective | undefined }> => {
    await delay(200);
    const objective = mockYearlyObjectives.find(o => o.id === id);
    return { objective };
  },
  createYearly: async (data: Omit<YearlyObjective, 'id'>): Promise<{ objective: YearlyObjective }> => {
    await delay(400);
    const newObjective: YearlyObjective = {
      ...data,
      id: `yearly-${Date.now()}`,
    };
    mockYearlyObjectives.push(newObjective);
    return { objective: newObjective };
  },
  updateYearly: async (id: string, data: Partial<YearlyObjective>): Promise<{ objective: YearlyObjective }> => {
    await delay(400);
    const index = mockYearlyObjectives.findIndex(o => o.id === id);
    if (index === -1) {
      throw { error: 'Objective not found', status: 404 };
    }
    mockYearlyObjectives[index] = { ...mockYearlyObjectives[index], ...data };
    return { objective: mockYearlyObjectives[index] };
  },
  deleteYearly: async (id: string): Promise<{ success: boolean }> => {
    await delay(300);
    const index = mockYearlyObjectives.findIndex(o => o.id === id);
    if (index === -1) {
      throw { error: 'Objective not found', status: 404 };
    }
    mockYearlyObjectives.splice(index, 1);
    return { success: true };
  },
  addQuarterly: async (yearlyId: string, data: Omit<QuarterlyObjective, 'id' | 'yearlyObjectiveId'>): Promise<{ quarterly: QuarterlyObjective }> => {
    await delay(400);
    const yearly = mockYearlyObjectives.find(o => o.id === yearlyId);
    if (!yearly) {
      throw { error: 'Yearly objective not found', status: 404 };
    }
    const newQuarterly: QuarterlyObjective = {
      ...data,
      id: `q${data.quarter}-${Date.now()}`,
      yearlyObjectiveId: yearlyId,
    };
    yearly.quarterlyObjectives.push(newQuarterly);
    return { quarterly: newQuarterly };
  },
  updateQuarterly: async (yearlyId: string, quarterlyId: string, data: Partial<QuarterlyObjective>): Promise<{ quarterly: QuarterlyObjective }> => {
    await delay(400);
    const yearly = mockYearlyObjectives.find(o => o.id === yearlyId);
    if (!yearly) {
      throw { error: 'Yearly objective not found', status: 404 };
    }
    const qIndex = yearly.quarterlyObjectives.findIndex(q => q.id === quarterlyId);
    if (qIndex === -1) {
      throw { error: 'Quarterly objective not found', status: 404 };
    }
    yearly.quarterlyObjectives[qIndex] = { ...yearly.quarterlyObjectives[qIndex], ...data };
    return { quarterly: yearly.quarterlyObjectives[qIndex] };
  },
  deleteQuarterly: async (yearlyId: string, quarterlyId: string): Promise<{ success: boolean }> => {
    await delay(300);
    const yearly = mockYearlyObjectives.find(o => o.id === yearlyId);
    if (!yearly) {
      throw { error: 'Yearly objective not found', status: 404 };
    }
    const qIndex = yearly.quarterlyObjectives.findIndex(q => q.id === quarterlyId);
    if (qIndex === -1) {
      throw { error: 'Quarterly objective not found', status: 404 };
    }
    yearly.quarterlyObjectives.splice(qIndex, 1);
    return { success: true };
  },
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};