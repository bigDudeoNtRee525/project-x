'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from '@/components/ui/select';
import { tasksApi, contactsApi, goalsApi, categoriesApi } from '@/lib/api';
import { Target, Folder, CalendarIcon } from 'lucide-react';
import { TaskComments, type TaskComment } from '@/components/TaskComments';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';
import { type Category, mockCategories } from '@/lib/mockData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    assigneeId: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    goalId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

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

export function TaskEditModal({
    task,
    open,
    onOpenChange,
    onSuccess,
    onCommentsChange,
}: TaskEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [goals, setGoals] = useState<FlattenedGoal[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState<TaskFormValues | null>(null);

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema as any),
        defaultValues: {
            description: '',
            assigneeId: null,
            deadline: null,
            status: 'pending',
            priority: 'medium',
            goalId: null,
            categoryId: null,
        },
    });

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
                // The backend returns { goals: [...] } where goals are top-level (Yearly) with nested children
                const topLevelGoals = (response as any).goals || [];

                topLevelGoals.forEach((yearly: any) => {
                    // Add the Yearly goal itself
                    flattened.push({
                        id: yearly.id,
                        label: yearly.title,
                        parentTitle: "Yearly Objectives",
                        type: yearly.type
                    });

                    // Add its children (Quarterly goals)
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

    // Reset form and comments when task changes
    useEffect(() => {
        if (task) {
            form.reset({
                description: task.description,
                assigneeId: task.assigneeId || null,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : null,
                status: task.status,
                priority: task.priority,
                goalId: task.goalId || null,
                categoryId: task.categoryId || null,
            });
            setComments(task.comments || []);
        } else {
            // Reset to defaults for new task
            form.reset({
                description: '',
                assigneeId: null,
                deadline: null,
                status: 'pending',
                priority: 'medium',
                goalId: null,
                categoryId: null,
            });
            setComments([]);
        }
    }, [task, form]);

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

    // Check for missing deadline before submitting
    const handleFormSubmit = (data: TaskFormValues) => {
        if (!data.deadline) {
            setPendingSubmitData(data);
            setShowDeadlineWarning(true);
            return;
        }
        performSubmit(data);
    };

    // Actually perform the submit
    const performSubmit = async (data: TaskFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            if (task) {
                await tasksApi.update(task.id, {
                    ...data,
                    deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
                    reviewed: true,
                });
            } else {
                await tasksApi.create({
                    ...data,
                    deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
                });
            }
            setShowDeadlineWarning(false);
            setPendingSubmitData(null);
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err?.error || `Failed to ${task ? 'update' : 'create'} task`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle confirming save without deadline
    const handleSaveWithoutDeadline = () => {
        if (pendingSubmitData) {
            performSubmit(pendingSubmitData);
        }
    };

    // Handle canceling the deadline warning
    const handleCancelDeadlineWarning = () => {
        setShowDeadlineWarning(false);
        setPendingSubmitData(null);
    };



    // Group goals by parent
    const groupedGoals = goals.reduce((acc, obj) => {
        if (!acc[obj.parentTitle]) {
            acc[obj.parentTitle] = [];
        }
        acc[obj.parentTitle].push(obj);
        return acc;
    }, {} as Record<string, FlattenedGoal[]>);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">

                    <DialogHeader>
                        <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
                        <DialogDescription>
                            {task ? 'Update task details. Changes will mark the task as reviewed.' : 'Add a new task to your list.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Task description..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="assigneeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assignee</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'unassigned' ? null : value)}
                                            value={field.value || 'unassigned'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select assignee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {contacts.map((contact) => (
                                                    <SelectItem key={contact.id} value={contact.id}>
                                                        {contact.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deadline"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Deadline</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal border-input shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(new Date(field.value), "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 shadow-lg rounded-xl border-border/50" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear() + 10}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Supports Objective Field */}
                            <FormField
                                control={form.control}
                                name="goalId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            Supports Objective
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                                            value={field.value || 'none'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Link to an objective" />
                                                </SelectTrigger>
                                            </FormControl>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Category Field */}
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <Folder className="h-4 w-4 text-yellow-500" />
                                            Category
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                                            value={field.value || 'none'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Comments Section - Only show for existing tasks */}
                            {task && (
                                <TaskComments
                                    comments={comments}
                                    onAddComment={handleAddComment}
                                    onDeleteComment={handleDeleteComment}
                                />
                            )}

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                    {error}
                                </div>
                            )}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (task ? 'Saving...' : 'Creating...') : (task ? 'Save Changes' : 'Create Task')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog >

            {/* Deadline Warning Dialog */}
            < AlertDialog open={showDeadlineWarning} onOpenChange={setShowDeadlineWarning} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <span className="text-yellow-500">⚠️</span>
                            No Deadline Set
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This task doesn&apos;t have a deadline. Tasks without deadlines are harder to track and may get overlooked.
                            <br /><br />
                            Would you like to add a deadline now, or save anyway?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDeadlineWarning}>
                            Go Back &amp; Add Deadline
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSaveWithoutDeadline}
                            className="bg-yellow-600 hover:bg-yellow-700"
                        >
                            Save Without Deadline
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </>
    );
}

