'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Plus, RefreshCw, Edit2, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { tasksApi, contactsApi } from '@/lib/api';
import { TaskEditModal } from '@/components/TaskEditModal';
import { TaskFilters } from '@/components/TaskFilters';
import { BulkActionBar } from '@/components/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
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
                                                <td className="py-3 px-4 text-muted-foreground">{task.assignee?.name || task.assigneeName || 'Unassigned'}</td>
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
            </div>

            <BulkActionBar
                selectedCount={selectedTaskIds.size}
                contacts={contacts}
                onUpdateStatus={handleBulkStatusUpdate}
                onUpdatePriority={handleBulkPriorityUpdate}
                onUpdateAssignee={handleBulkAssigneeUpdate}
                onClearSelection={clearSelection}
            />

            <TaskEditModal
                task={selectedTask}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onSuccess={loadTasks}
            />
        </div>
    );
}
