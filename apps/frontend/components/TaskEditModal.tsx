'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { tasksApi, contactsApi, goalsApi } from '@/lib/api';
import { Target, Folder, CalendarIcon, Check, Loader2, X } from 'lucide-react';
import { TaskComments, type TaskComment } from '@/components/TaskComments';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';
import { mockCategories } from '@/lib/mockData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskEditModalProps {
    task: (TaskWithRelations & { goalId?: string | null; categoryId?: string | null; comments?: TaskComment[] }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    onCommentsChange?: (taskId: string, comments: TaskComment[]) => void;
}

// Helper to flatten goals with parent info
interface FlattenedGoal {
    id: string;
    label: string;
    parentTitle: string;
    type: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function TaskEditModal({
    task,
    open,
    onOpenChange,
    onSuccess,
    onCommentsChange,
}: TaskEditModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [goals, setGoals] = useState<FlattenedGoal[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [description, setDescription] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [deadline, setDeadline] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('pending');
    const [priority, setPriority] = useState<string>('medium');
    const [goalId, setGoalId] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);

    // Debounce timer ref
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const savedTimer = useRef<NodeJS.Timeout | null>(null);

    // Load contacts for assignee dropdown
    useEffect(() => {
        const loadContacts = async () => {
            try {
                const response = await contactsApi.list();
                setContacts((response as any).contacts || []);
            } catch (err) {
                console.error('Failed to load contacts:', err);
            }
        };
        loadContacts();
    }, []);

    // Load goals for dropdown
    useEffect(() => {
        const loadGoals = async () => {
            try {
                const response = await goalsApi.list();
                const flattened: FlattenedGoal[] = [];
                const topLevelGoals = (response as any).goals || [];

                topLevelGoals.forEach((yearly: any) => {
                    flattened.push({
                        id: yearly.id,
                        label: yearly.title,
                        parentTitle: "Yearly Objectives",
                        type: yearly.type
                    });

                    if (yearly.children && Array.isArray(yearly.children)) {
                        yearly.children.forEach((quarterly: any) => {
                            flattened.push({
                                id: quarterly.id,
                                label: quarterly.title,
                                parentTitle: yearly.title,
                                type: quarterly.type
                            });
                        });
                    }
                });

                setGoals(flattened);
            } catch (err) {
                console.error('Failed to load goals:', err);
            }
        };
        loadGoals();
    }, []);

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            setDescription(task.description);
            setAssigneeIds(task.assignees?.map((a) => a.id) || []);
            setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : null);
            setStatus(task.status);
            setPriority(task.priority);
            setGoalId(task.goalId || null);
            setCategoryId(task.categoryId || null);
            setComments(task.comments || []);
        } else {
            setDescription('');
            setAssigneeIds([]);
            setDeadline(null);
            setStatus('pending');
            setPriority('medium');
            setGoalId(null);
            setCategoryId(null);
            setComments([]);
        }
        setSaveStatus('idle');
        setError(null);
    }, [task]);

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            if (savedTimer.current) clearTimeout(savedTimer.current);
        };
    }, []);

    // Save function
    const saveField = useCallback(async (updates: Record<string, any>) => {
        if (!task) return;

        setSaveStatus('saving');
        setError(null);

        try {
            await tasksApi.update(task.id, {
                ...updates,
                reviewed: true,
            });
            setSaveStatus('saved');

            // Clear "saved" status after 2 seconds
            if (savedTimer.current) clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);

            onSuccess?.();
        } catch (err: any) {
            setSaveStatus('error');
            setError(err?.error || 'Failed to save');
        }
    }, [task, onSuccess]);

    // Debounced save for text fields
    const debouncedSave = useCallback((updates: Record<string, any>) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            saveField(updates);
        }, 500);
    }, [saveField]);

    // Immediate save for select fields
    const immediateSave = useCallback((updates: Record<string, any>) => {
        saveField(updates);
    }, [saveField]);

    // Field change handlers
    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        debouncedSave({ description: value });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        immediateSave({ status: value });
    };

    const handlePriorityChange = (value: string) => {
        setPriority(value);
        immediateSave({ priority: value });
    };

    const handleAssigneesChange = (value: string[]) => {
        setAssigneeIds(value);
        immediateSave({ assigneeIds: value });
    };

    const handleDeadlineChange = (date: Date | undefined) => {
        const newDeadline = date ? date.toISOString() : null;
        setDeadline(date ? date.toISOString().split('T')[0] : null);
        immediateSave({ deadline: newDeadline });
    };

    const handleGoalChange = (value: string) => {
        const newGoalId = value === 'none' ? null : value;
        setGoalId(newGoalId);
        immediateSave({ goalId: newGoalId });
    };

    const handleCategoryChange = (value: string) => {
        const newCategoryId = value === 'none' ? null : value;
        setCategoryId(newCategoryId);
        immediateSave({ categoryId: newCategoryId });
    };

    // Comment handlers
    const handleAddComment = (text: string) => {
        if (!task) return;
        const newComment: TaskComment = {
            id: `c-${Date.now()}`,
            text,
            author: 'You',
            createdAt: new Date(),
        };
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        onCommentsChange?.(task.id, updatedComments);
    };

    const handleDeleteComment = (commentId: string) => {
        if (!task) return;
        const updatedComments = comments.filter((c) => c.id !== commentId);
        setComments(updatedComments);
        onCommentsChange?.(task.id, updatedComments);
    };

    // Group goals by parent
    const groupedGoals = goals.reduce((acc, obj) => {
        if (!acc[obj.parentTitle]) {
            acc[obj.parentTitle] = [];
        }
        acc[obj.parentTitle].push(obj);
        return acc;
    }, {} as Record<string, FlattenedGoal[]>);

    // Status indicator component
    const StatusIndicator = () => {
        if (saveStatus === 'saving') {
            return (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                </span>
            );
        }
        if (saveStatus === 'saved') {
            return (
                <span className="flex items-center gap-1 text-xs text-green-500">
                    <Check className="h-3 w-3" />
                    Saved
                </span>
            );
        }
        if (saveStatus === 'error') {
            return (
                <span className="flex items-center gap-1 text-xs text-red-500">
                    <X className="h-3 w-3" />
                    Error
                </span>
            );
        }
        return null;
    };

    // For new tasks, we still need a create flow - simplified version
    if (!task) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>New task creation coming soon.</p>
                        <p className="text-sm mt-2">For now, tasks are created from meetings.</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Edit Task</DialogTitle>
                        <StatusIndicator />
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Task description..."
                            className="min-h-[80px]"
                            value={description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={handlePriorityChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Assignees */}
                    <div className="space-y-2">
                        <Label>Assignees</Label>
                        <MultiSelect
                            options={contacts.map((contact) => ({
                                value: contact.id,
                                label: contact.name,
                            }))}
                            selected={assigneeIds}
                            onChange={handleAssigneesChange}
                            placeholder="Select assignees..."
                        />
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                        <Label>Deadline</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full pl-3 text-left font-normal border-input shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                                        !deadline && "text-muted-foreground"
                                    )}
                                >
                                    {deadline ? (
                                        format(new Date(deadline), "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 shadow-lg rounded-xl border-border/50" align="start">
                                <Calendar
                                    mode="single"
                                    selected={deadline ? new Date(deadline) : undefined}
                                    onSelect={handleDeadlineChange}
                                    disabled={(date) => date < new Date("1900-01-01")}
                                    captionLayout="dropdown"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear() + 10}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Supports Objective */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-blue-600" />
                            Supports Objective
                        </Label>
                        <Select value={goalId || 'none'} onValueChange={handleGoalChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Link to an objective" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-gray-500">No linked objective</span>
                                </SelectItem>
                                {Object.entries(groupedGoals).map(([parentTitle, children]) => (
                                    <SelectGroup key={parentTitle}>
                                        <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                            {parentTitle.length > 40 ? parentTitle.slice(0, 40) + '...' : parentTitle}
                                        </SelectLabel>
                                        {children.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                <span className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-blue-600">{g.type}</span>
                                                    <span>{g.label.length > 35 ? g.label.slice(0, 35) + '...' : g.label}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Folder className="h-4 w-4 text-yellow-500" />
                            Category
                        </Label>
                        <Select value={categoryId || 'none'} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-gray-500">No category</span>
                                </SelectItem>
                                {mockCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Comments Section */}
                    <TaskComments
                        comments={comments}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                    />

                    {/* Error display */}
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
