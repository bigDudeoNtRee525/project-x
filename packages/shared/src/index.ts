// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Contact types
export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Meeting types
export interface Meeting {
  id: string;
  userId: string;
  title: string;
  transcript: string;
  processed: boolean;
  processedAt: Date | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

// Meeting with task count (for listing)
export interface MeetingWithCount extends Meeting {
  _count: {
    tasks: number;
  };
}

// Task types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  meetingId: string;
  userId: string;
  description: string;
  assigneeId: string | null;
  assigneeName: string | null;
  deadline: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  aiExtracted: boolean;
  reviewed: boolean;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Task with relations (for API responses)
export interface TaskWithRelations extends Task {
  meeting: {
    id: string;
    title: string;
    createdAt: Date;
  };
  assignee: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

// Meeting with tasks (for detail view)
export interface MeetingWithTasks extends Meeting {
  tasks: TaskWithRelations[];
}

// API Request types
export interface CreateMeetingRequest {
  title: string;
  transcript: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskRequest {
  description?: string;
  assigneeId?: string | null;
  assigneeName?: string;
  deadline?: string | null; // ISO string
  status?: TaskStatus;
  priority?: TaskPriority;
  reviewed?: boolean;
}

export interface CreateContactRequest {
  name: string;
  email?: string;
  role?: string;
}

// Filter types for tasks
export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  fromDate?: string; // ISO string
  toDate?: string; // ISO string
  meetingId?: string;
  reviewed?: boolean;
}

// Gantt task format for Frappe Gantt
export interface GanttTask {
  id: string;
  text: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  duration?: number;
  progress?: number;
  assignee?: string;
  parent?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
}