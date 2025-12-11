'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Plus, RefreshCw, Edit2, BarChart3, CalendarDays, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { tasksApi, contactsApi } from '@/lib/api';
import { getCurrentUser } from '@/lib/supabase';
import { MeetingUploadModal } from '@/components/MeetingUploadModal';
import { TaskEditModal } from '@/components/TaskEditModal';
import { TaskFilters } from '@/components/TaskFilters';
import { GanttChart } from '@/components/GanttChart';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { BulkActionBar } from '@/components/BulkActionBar';
import { CalendarExportModal } from '@/components/CalendarExportModal';
import { ExportReportModal } from '@/components/ExportReportModal';
import { Checkbox } from '@/components/ui/checkbox';
import { StatCard } from '@/components/StatCard';
import { UserTasksModal } from '@/components/UserTasksModal';
import { StatTasksModal, StatType } from '@/components/StatTasksModal';
import { TeamTasksModal } from '@/components/TeamTasksModal';
import { MyTasksCard } from '@/components/MyTasksCard';
import { TeamMemberTile } from '@/components/TeamMemberTile';
import { MyTasksModal } from '@/components/MyTasksModal';
import type { TaskWithRelations, Contact, ContactWithStats, TeamStatFilter } from '@meeting-task-tool/shared';

// Status display mapping
const statusDisplay: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Priority display mapping
const priorityDisplay: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [userTasksModalOpen, setUserTasksModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [statTasksModalOpen, setStatTasksModalOpen] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState<StatType | null>(null);
  const [returnToModal, setReturnToModal] = useState<'stat' | 'user' | 'team' | 'myTasks' | null>(null);
  const [contactsWithStats, setContactsWithStats] = useState<ContactWithStats[]>([]);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeamContact, setSelectedTeamContact] = useState<ContactWithStats | null>(null);
  const [teamModalFilter, setTeamModalFilter] = useState<TeamStatFilter>('all');
  const [myTasksModalOpen, setMyTasksModalOpen] = useState(false);
  const [myTasksFilter, setMyTasksFilter] = useState<'inProgress' | 'overdue' | 'dueToday' | 'completed'>('inProgress');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigneeId: 'all',
  });

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.list();
      const taskData = (response as any).tasks || [];
      setTasks(taskData);
      setFilteredTasks(taskData);
    } catch (err: any) {
      setError(err?.error || 'Failed to load tasks');
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const response = await contactsApi.list();
      setContacts((response as any).contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }, []);

  const loadContactStats = useCallback(async () => {
    try {
      const response = await contactsApi.getStats();
      setContactsWithStats((response as any).contacts || []);
    } catch (err) {
      console.error('Failed to load contact stats:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadContacts();
    loadContactStats();
    // Load current user email
    getCurrentUser().then(user => {
      setCurrentUserEmail(user?.email || null);
    }).catch(console.error);
  }, [loadTasks, loadContacts, loadContactStats]);

  // Apply filters when tasks or filters change
  useEffect(() => {
    let result = [...tasks];

    if (filters.status !== 'all') {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.priority !== 'all') {
      result = result.filter((t) => t.priority === filters.priority);
    }

    if (filters.assigneeId !== 'all') {
      if (filters.assigneeId === 'unassigned') {
        result = result.filter((t) => !t.assignees || t.assignees.length === 0);
      } else {
        result = result.filter((t) => t.assignees?.some((a) => a.id === filters.assigneeId));
      }
    }

    setFilteredTasks(result);
  }, [tasks, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', priority: 'all', assigneeId: 'all' });
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setEditModalOpen(true);
  };

  const handleEditModalClose = (open: boolean) => {
    setEditModalOpen(open);
    if (!open && returnToModal) {
      // Reopen the modal we came from
      if (returnToModal === 'stat') {
        setStatTasksModalOpen(true);
      } else if (returnToModal === 'user') {
        setUserTasksModalOpen(true);
      } else if (returnToModal === 'team') {
        setTeamModalOpen(true);
      } else if (returnToModal === 'myTasks') {
        setMyTasksModalOpen(true);
      }
      setReturnToModal(null);
    }
  };

  // Handle my tasks stat click
  const handleMyTasksStatClick = (type: 'inProgress' | 'overdue' | 'dueToday' | 'completed') => {
    setMyTasksFilter(type);
    setMyTasksModalOpen(true);
  };

  // Get filtered tasks for my tasks modal (only tasks assigned to current user)
  const getMyTasksFiltered = () => {
    const now = new Date();
    // Filter to only tasks assigned to current user
    const myTasksOnly = tasks.filter(t => {
      if (!currentUserEmail) return false;
      return t.assignees?.some(a => a.email?.toLowerCase() === currentUserEmail.toLowerCase());
    });
    switch (myTasksFilter) {
      case 'inProgress':
        return myTasksOnly.filter((t) => t.status === 'in_progress');
      case 'overdue':
        return myTasksOnly.filter((t) => {
          if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
          return new Date(t.deadline) < now;
        });
      case 'dueToday':
        return myTasksOnly.filter((t) => {
          if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
          const deadline = new Date(t.deadline);
          return deadline.toDateString() === now.toDateString();
        });
      case 'completed':
        return myTasksOnly.filter((t) => t.status === 'completed');
      default:
        return myTasksOnly;
    }
  };

  // Handle team member click from TeamStatusCard
  const handleTeamMemberClick = (contact: ContactWithStats) => {
    setSelectedTeamContact(contact);
    setTeamModalFilter('all');
    setTeamModalOpen(true);
  };

  // Handle stat badge click from TeamStatusCard
  const handleTeamStatClick = (contact: ContactWithStats, filter: TeamStatFilter) => {
    setSelectedTeamContact(contact);
    setTeamModalFilter(filter);
    setTeamModalOpen(true);
  };

  // Bulk selection handlers
  const toggleTaskSelection = (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  // Bulk update handlers
  const handleBulkStatusUpdate = async (status: string) => {
    // Update tasks in state (mock implementation)
    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id) ? { ...task, status: status as any } : task
      )
    );
    clearSelection();
  };

  const handleBulkPriorityUpdate = async (priority: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id) ? { ...task, priority: priority as any } : task
      )
    );
    clearSelection();
  };

  const handleBulkAssigneesUpdate = async (assigneeIds: string[]) => {
    const assignees = assigneeIds.map((id) => {
      const contact = contacts.find((c) => c.id === id);
      return contact ? { id: contact.id, name: contact.name, email: contact.email } : null;
    }).filter(Boolean) as { id: string; name: string; email: string | null }[];

    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id)
          ? { ...task, assignees }
          : task
      )
    );
    clearSelection();
  };

  // Calculate stats from all tasks (not filtered)
  const totalTasks = tasks.length;
  const pendingReview = tasks.filter((t) => !t.reviewed).length;
  const upcomingDeadlines = tasks.filter((t) => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return deadline >= now && deadline <= weekFromNow;
  }).length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent').length;

  // My Tasks stats - only tasks assigned to current user
  const isMyTask = (task: TaskWithRelations) => {
    if (!currentUserEmail) return false;
    return task.assignees?.some(a => a.email?.toLowerCase() === currentUserEmail.toLowerCase());
  };
  const myTasks = tasks.filter(isMyTask);
  const myTasksInProgress = myTasks.filter((t) => t.status === 'in_progress').length;
  const myTasksOverdue = myTasks.filter((t) => {
    if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
    return new Date(t.deadline) < new Date();
  }).length;
  const myTasksDueToday = myTasks.filter((t) => {
    if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
    const deadline = new Date(t.deadline);
    const today = new Date();
    return deadline.toDateString() === today.toDateString();
  }).length;
  const myTasksCompleted = myTasks.filter((t) => t.status === 'completed').length;

  // Calculate Trends (Last 30 days vs Previous 30 days)
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(now.getTime() - thirtyDaysMs);
  const sixtyDaysAgo = new Date(now.getTime() - (2 * thirtyDaysMs));

  let currentPeriodCreated = 0;
  let prevPeriodCreated = 0;
  let currentPeriodCompleted = 0;
  let prevPeriodCompleted = 0;

  tasks.forEach(task => {
    const created = new Date(task.createdAt);
    if (created >= thirtyDaysAgo) {
      currentPeriodCreated++;
      if (task.status === 'completed') currentPeriodCompleted++;
    } else if (created >= sixtyDaysAgo) {
      prevPeriodCreated++;
      if (task.status === 'completed') prevPeriodCompleted++;
    }
  });

  const createdTrend = Math.round(((currentPeriodCreated - prevPeriodCreated) / (prevPeriodCreated || 1)) * 100);
  const completedTrend = Math.round(((currentPeriodCompleted - prevPeriodCompleted) / (prevPeriodCompleted || 1)) * 100);

  // Generate Activity Feed
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)
    .map(task => {
      const isNew = new Date(task.createdAt).getTime() === new Date(task.updatedAt || task.createdAt).getTime();
      const isCompleted = task.status === 'completed';
      const date = new Date(task.updatedAt || task.createdAt);

      // Calculate relative time
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeString = 'Just now';
      if (diffDays > 0) timeString = `${diffDays}d ago`;
      else if (diffHours > 0) timeString = `${diffHours}h ago`;
      else if (diffMins > 0) timeString = `${diffMins}m ago`;

      return {
        id: task.id,
        text: isCompleted ? `Task "${task.description}" completed` : isNew ? `New task created: "${task.description}"` : `Task updated: "${task.description}"`,
        time: timeString,
        color: isCompleted ? 'bg-green-500' : isNew ? 'bg-blue-500' : 'bg-orange-500'
      };
    });

  // Filter tasks by stat type for modal
  const getTasksForStatType = (type: StatType): TaskWithRelations[] => {
    switch (type) {
      case 'totalTasks':
        return tasks;
      case 'pendingReview':
        return tasks.filter((t) => !t.reviewed);
      case 'upcomingDeadlines':
        return tasks.filter((t) => {
          if (!t.deadline) return false;
          const deadline = new Date(t.deadline);
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return deadline >= now && deadline <= weekFromNow;
        });
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      case 'recentActivity':
        return [...tasks].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      default:
        return [];
    }
  };

  const handleStatIconClick = (type: StatType) => {
    setSelectedStatType(type);
    setStatTasksModalOpen(true);
  };

  const isAllSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;
  const isSomeSelected = selectedTaskIds.size > 0 && selectedTaskIds.size < filteredTasks.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your tasks.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setMeetingModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* My Tasks Today */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Tasks</CardTitle>
          <CardDescription>Your task overview for today</CardDescription>
        </CardHeader>
        <CardContent>
          <MyTasksCard
            inProgress={myTasksInProgress}
            overdue={myTasksOverdue}
            dueToday={myTasksDueToday}
            completed={myTasksCompleted}
            onStatClick={handleMyTasksStatClick}
          />
        </CardContent>
      </Card>

      {/* Team Tasks */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Team Tasks</CardTitle>
              <CardDescription>What your team is working on</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contactsWithStats.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {contactsWithStats.map((contact) => (
                <TeamMemberTile
                  key={contact.id}
                  contact={contact}
                  onClick={() => handleTeamMemberClick(contact)}
                />
              ))}
            </div>
          ) : contacts.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  className="flex flex-col items-center p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all cursor-pointer min-w-[80px]"
                  onClick={() => {
                    setSelectedContact(contact);
                    setUserTasksModalOpen(true);
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {contact.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-xs font-medium truncate max-w-full">
                    {contact.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No team members yet. Add contacts to see team status.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Views Section */}
      <div className="space-y-6">
        {/* Task Filters */}
        <TaskFilters
          contacts={contacts}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        <Tabs defaultValue="table" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="table" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <List className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="gantt" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Calendar className="h-4 w-4 mr-2" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" size="sm" onClick={loadTasks} disabled={isLoading} className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <TabsContent value="table" className="space-y-4 mt-0">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>
                  {filteredTasks.length === tasks.length
                    ? `All ${tasks.length} tasks`
                    : `Showing ${filteredTasks.length} of ${tasks.length} tasks`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={loadTasks} variant="outline" className="mt-4">
                      Try Again
                    </Button>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {tasks.length === 0 ? (
                      <>
                        <p>No tasks yet. Upload a meeting to get started!</p>
                        <Button onClick={() => setMeetingModalOpen(true)} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Meeting
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>No tasks match your filters.</p>
                        <Button onClick={clearFilters} variant="outline" className="mt-4">
                          Clear Filters
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium w-10">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={toggleSelectAll}
                              className={isSomeSelected ? 'data-[state=unchecked]:bg-primary/20' : ''}
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assignee</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deadline</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredTasks.map((task) => (
                          <tr
                            key={task.id}
                            className={`hover:bg-muted/50 cursor-pointer transition-colors ${selectedTaskIds.has(task.id) ? 'bg-primary/5' : ''
                              }`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedTaskIds.has(task.id)}
                                onCheckedChange={() => toggleTaskSelection(task.id)}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="max-w-xs truncate font-medium text-foreground">{task.description}</span>
                                {!task.reviewed && (
                                  <span className="px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-500 rounded border border-purple-500/20">New</span>
                                )}
                                {/* Comment count badge */}
                                {(task as any).comments?.length > 0 && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                                    <span className="text-[10px]">💬</span>
                                    {(task as any).comments.length}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                                              {task.assignees && task.assignees.length > 0
                                                ? task.assignees.length === 1
                                                  ? task.assignees[0].name
                                                  : `${task.assignees[0].name} +${task.assignees.length - 1}`
                                                : 'Unassigned'}
                                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${task.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  task.status === 'cancelled' ? 'bg-muted text-muted-foreground border-border' :
                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                {statusDisplay[task.status] || task.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${task.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                task.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                  task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                }`}>
                                {priorityDisplay[task.priority] || task.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(task);
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gantt" className="space-y-4 mt-0">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle>Timeline View</CardTitle>
                <CardDescription>
                  Visual timeline of tasks with deadlines
                  {filteredTasks.length !== tasks.length && ` (${filteredTasks.length} filtered)`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <GanttChart tasks={filteredTasks} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <AnalyticsPanel tasks={tasks} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.size}
        contacts={contacts}
        onUpdateStatus={handleBulkStatusUpdate}
        onUpdatePriority={handleBulkPriorityUpdate}
        onUpdateAssignees={handleBulkAssigneesUpdate}
        onClearSelection={clearSelection}
      />

      {/* Modals */}
      <MeetingUploadModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        onSuccess={loadTasks}
      />
      <TaskEditModal
        task={selectedTask}
        open={editModalOpen}
        onOpenChange={handleEditModalClose}
        onSuccess={loadTasks}
      />
      <CalendarExportModal
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
        tasks={tasks}
        selectedTaskIds={selectedTaskIds}
      />
      <ExportReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        tasks={tasks}
      />
      <UserTasksModal
        open={userTasksModalOpen}
        onOpenChange={setUserTasksModalOpen}
        user={selectedContact}
        tasks={tasks.filter(t => t.assignees?.some(a => a.id === selectedContact?.id))}
        onTaskClick={(task) => {
          setUserTasksModalOpen(false);
          setReturnToModal('user');
          handleTaskClick(task);
        }}
      />
      <StatTasksModal
        open={statTasksModalOpen}
        onOpenChange={setStatTasksModalOpen}
        statType={selectedStatType}
        tasks={selectedStatType ? getTasksForStatType(selectedStatType) : []}
        onTaskClick={(task) => {
          setStatTasksModalOpen(false);
          setReturnToModal('stat');
          handleTaskClick(task);
        }}
      />
      <TeamTasksModal
        open={teamModalOpen}
        onOpenChange={setTeamModalOpen}
        contact={selectedTeamContact}
        tasks={tasks.filter(t => t.assignees?.some(a => a.id === selectedTeamContact?.id))}
        initialFilter={teamModalFilter}
        onTaskClick={(task) => {
          setTeamModalOpen(false);
          setReturnToModal('team');
          handleTaskClick(task);
        }}
      />
      <MyTasksModal
        open={myTasksModalOpen}
        onOpenChange={setMyTasksModalOpen}
        filterType={myTasksFilter}
        tasks={getMyTasksFiltered()}
        onTaskClick={(task) => {
          setMyTasksModalOpen(false);
          setReturnToModal('myTasks');
          handleTaskClick(task);
        }}
      />
    </div>
  );
}