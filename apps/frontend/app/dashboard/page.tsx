'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Plus, RefreshCw, Edit2, BarChart3, CalendarDays } from 'lucide-react';
import { tasksApi, contactsApi } from '@/lib/api';
import { MeetingUploadModal } from '@/components/MeetingUploadModal';
import { TaskEditModal } from '@/components/TaskEditModal';
import { TaskFilters } from '@/components/TaskFilters';
import { GanttChart } from '@/components/GanttChart';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { BulkActionBar } from '@/components/BulkActionBar';
import { CalendarExportModal } from '@/components/CalendarExportModal';
import { ExportReportModal } from '@/components/ExportReportModal';
import { Checkbox } from '@/components/ui/checkbox';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';
import type { TaskComment } from '@/lib/mockData';

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
      const taskData = response.tasks || [];
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
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadContacts();
  }, [loadTasks, loadContacts]);

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
        result = result.filter((t) => !t.assigneeId);
      } else {
        result = result.filter((t) => t.assigneeId === filters.assigneeId);
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

  const handleBulkAssigneeUpdate = async (assigneeId: string | null) => {
    const assignee = contacts.find((c) => c.id === assigneeId);
    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id)
          ? {
            ...task,
            assigneeId,
            assigneeName: assignee?.name || null,
            assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
          }
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

  const isAllSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;
  const isSomeSelected = selectedTaskIds.size > 0 && selectedTaskIds.size < filteredTasks.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
          <p className="text-gray-600 mt-1">View and manage tasks extracted from meetings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setReportModalOpen(true)}
            className="flex items-center space-x-1"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reports</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setCalendarModalOpen(true)}
            className="flex items-center space-x-1"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button variant="outline" onClick={loadTasks} disabled={isLoading} className="flex items-center space-x-1">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setMeetingModalOpen(true)} className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Add Meeting</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasks}</div>
            <p className="text-sm text-gray-600 mt-1">Across all meetings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{pendingReview}</div>
            <p className="text-sm text-gray-600 mt-1">Tasks needing your attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{upcomingDeadlines}</div>
            <p className="text-sm text-gray-600 mt-1">Within next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Filters */}
      <TaskFilters
        contacts={contacts}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="table" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Table View</span>
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Gantt Chart</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                {filteredTasks.length === tasks.length
                  ? `All ${tasks.length} tasks`
                  : `Showing ${filteredTasks.length} of ${tasks.length} tasks`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                  <Button onClick={loadTasks} variant="outline" className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
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
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium w-10">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={toggleSelectAll}
                            className={isSomeSelected ? 'data-[state=unchecked]:bg-blue-100' : ''}
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                        <th className="text-left py-3 px-4 font-medium">Assignee</th>
                        <th className="text-left py-3 px-4 font-medium">Deadline</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Priority</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.id}
                          className={`border-b hover:bg-gray-50 cursor-pointer ${selectedTaskIds.has(task.id) ? 'bg-blue-50' : ''
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
                              <span className="max-w-xs truncate">{task.description}</span>
                              {!task.reviewed && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">New</span>
                              )}
                              {/* Comment count badge */}
                              {(task as any).comments?.length > 0 && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                  <span className="text-[10px]">💬</span>
                                  {(task as any).comments.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">{task.assignee?.name || task.assigneeName || 'Unassigned'}</td>
                          <td className="py-3 px-4">
                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              {statusDisplay[task.status] || task.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
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

        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline View</CardTitle>
              <CardDescription>
                Visual timeline of tasks with deadlines
                {filteredTasks.length !== tasks.length && ` (${filteredTasks.length} filtered)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <GanttChart tasks={filteredTasks} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <AnalyticsPanel tasks={tasks} />
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.size}
        contacts={contacts}
        onUpdateStatus={handleBulkStatusUpdate}
        onUpdatePriority={handleBulkPriorityUpdate}
        onUpdateAssignee={handleBulkAssigneeUpdate}
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
        onOpenChange={setEditModalOpen}
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
    </div>
  );
}