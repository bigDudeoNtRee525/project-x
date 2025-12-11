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

// Assignee info (contact assigned to a task)
export interface TaskAssignee {
  id: string;
  name: string;
  email: string | null;
}

export interface Task {
  id: string;
  meetingId: string;
  userId: string;
  title: string;
  description: string;
  assignees: TaskAssignee[];
  deadline: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  aiExtracted: boolean;
  reviewed: boolean;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  goalId?: string | null;
  categoryId?: string | null;
}

// Task with relations (for API responses)
export interface TaskWithRelations extends Task {
  meeting: {
    id: string;
    title: string;
    createdAt: Date;
  };
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

export interface CreateTaskRequest {
  description: string;
  title?: string;
  assigneeIds?: string[]; // Array of contact IDs
  deadline?: string | null; // ISO string
  status?: TaskStatus;
  priority?: TaskPriority;
  meetingId?: string;
}

export interface UpdateTaskRequest {
  description?: string;
  assigneeIds?: string[]; // Array of contact IDs
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
  assigneeId?: string; // Filter by a single assignee (tasks where this person is one of the assignees)
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

// Team member statistics for dashboard
export interface TeamMemberStats {
  inProgressCount: number;
  backlogCount: number;
  completedCount: number;
  totalTasks: number;
  deliveryRate: number;       // Percentage of completed tasks
  avgBacklogDays: number;     // Average days past deadline for backlog items
  productivityScore: number;  // Score: completed / (total + backlog) * 100
}

export interface ContactWithStats extends Contact {
  stats: TeamMemberStats;
}

export type TeamStatFilter = 'inProgress' | 'backlog' | 'completed' | 'all';