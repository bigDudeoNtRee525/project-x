'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Plus, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { tasksApi, contactsApi } from '@/lib/api';
import { TaskEditModal } from '@/components/TaskEditModal';
import { TaskFilters } from '@/components/TaskFilters';
import { BulkActionBar } from '@/components/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { InlineTaskSelect } from '@/components/InlineTaskSelect';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';

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

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<TaskWithRelations[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

    // Bulk selection state
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

    // Delete state
    const [deletingTask, setDeletingTask] = useState<TaskWithRelations | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            // Only fetch reviewed tasks by default for the main task list
            const response = await tasksApi.list({ reviewed: true });
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

    const handleCreateTask = () => {
        setSelectedTask(null);
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
        const taskIds = Array.from(selectedTaskIds);
        const previousTasks = [...tasks];

        // Optimistic update
        setTasks((prev) =>
            prev.map((task) =>
                selectedTaskIds.has(task.id) ? { ...task, status: status as any } : task
            )
        );
        clearSelection();

        // Actually call the API for each task
        try {
            await Promise.all(
                taskIds.map((taskId) => tasksApi.update(taskId, { status }))
            );
        } catch (error) {
            // Rollback on error
            console.error('Failed to update tasks:', error);
            setTasks(previousTasks);
            throw error;
        }
    };

    const handleBulkPriorityUpdate = async (priority: string) => {
        const taskIds = Array.from(selectedTaskIds);
        const previousTasks = [...tasks];

        // Optimistic update
        setTasks((prev) =>
            prev.map((task) =>
                selectedTaskIds.has(task.id) ? { ...task, priority: priority as any } : task
            )
        );
        clearSelection();

        // Actually call the API for each task
        try {
            await Promise.all(
                taskIds.map((taskId) => tasksApi.update(taskId, { priority }))
            );
        } catch (error) {
            // Rollback on error
            console.error('Failed to update tasks:', error);
            setTasks(previousTasks);
            throw error;
        }
    };

    const handleBulkAssigneesUpdate = async (assigneeIds: string[]) => {
        const taskIds = Array.from(selectedTaskIds);
        const previousTasks = [...tasks];

        const assignees = assigneeIds.map((id) => {
            const contact = contacts.find((c) => c.id === id);
            return contact ? { id: contact.id, name: contact.name, email: contact.email } : null;
        }).filter(Boolean) as { id: string; name: string; email: string | null }[];

        // Optimistic update
        setTasks((prev) =>
            prev.map((task) =>
                selectedTaskIds.has(task.id)
                    ? { ...task, assignees }
                    : task
            )
        );
        clearSelection();

        // Actually call the API for each task
        try {
            await Promise.all(
                taskIds.map((taskId) => tasksApi.update(taskId, { assigneeIds }))
            );
        } catch (error) {
            // Rollback on error
            console.error('Failed to update tasks:', error);
            setTasks(previousTasks);
            throw error;
        }
    };

    // Inline field update handler
    const handleInlineUpdate = async (taskId: string, field: string, value: string) => {
        const previousTasks = [...tasks];
        // Optimistic update
        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
            )
        );

        try {
            await tasksApi.update(taskId, { [field]: value });
            toast.success('Task updated');
        } catch (error) {
            // Rollback on error
            console.error('Failed to update task:', error);
            setTasks(previousTasks);
            toast.error('Failed to update task');
            throw error;
        }
    };

    // Delete handler
    const handleDeleteConfirm = async () => {
        if (!deletingTask) return;

        const taskToDelete = deletingTask;
        const previousTasks = [...tasks];

        setIsDeleting(true);
        // Optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(taskToDelete.id);
            return next;
        });
        setDeletingTask(null);

        try {
            await tasksApi.delete(taskToDelete.id);
            toast.success('Task deleted successfully');
        } catch (error) {
            console.error('Failed to delete task:', error);
            setTasks(previousTasks);
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };

    const isAllSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;
    const isSomeSelected = selectedTaskIds.size > 0 && selectedTaskIds.size < filteredTasks.length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
                    <p className="text-muted-foreground mt-1">Manage and track all your tasks in one place</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadTasks} disabled={isLoading} className="flex items-center space-x-1 border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                    <Button onClick={handleCreateTask} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <TaskFilters
                    contacts={contacts}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                />

                <Card className="border-none bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle>All Tasks</CardTitle>
                        <CardDescription>
                            {filteredTasks.length === tasks.length
                                ? `Showing all ${tasks.length} tasks`
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
                                        <List className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                        <p className="mt-4">No tasks yet. Create one to get started!</p>
                                        <Button onClick={handleCreateTask} className="mt-4 bg-primary text-primary-foreground">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Your First Task
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p>No tasks match your filters.</p>
                                        <Button onClick={clearFilters} variant="outline" className="mt-4 border-border text-muted-foreground hover:text-foreground">
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
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <InlineTaskSelect
                                                        type="status"
                                                        value={task.status}
                                                        taskId={task.id}
                                                        onUpdate={handleInlineUpdate}
                                                    />
                                                </td>
                                                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                    <InlineTaskSelect
                                                        type="priority"
                                                        value={task.priority}
                                                        taskId={task.id}
                                                        onUpdate={handleInlineUpdate}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
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
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeletingTask(task);
                                                            }}
                                                            className="text-muted-foreground hover:text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <BulkActionBar
                selectedCount={selectedTaskIds.size}
                contacts={contacts}
                onUpdateStatus={handleBulkStatusUpdate}
                onUpdatePriority={handleBulkPriorityUpdate}
                onUpdateAssignees={handleBulkAssigneesUpdate}
                onClearSelection={clearSelection}
            />

            <TaskEditModal
                task={selectedTask}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onSuccess={loadTasks}
            />

            <DeleteConfirmDialog
                open={!!deletingTask}
                onOpenChange={(open) => !open && setDeletingTask(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Task"
                description={`Are you sure you want to delete "${deletingTask?.description?.slice(0, 50)}${(deletingTask?.description?.length || 0) > 50 ? '...' : ''}"? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
}
