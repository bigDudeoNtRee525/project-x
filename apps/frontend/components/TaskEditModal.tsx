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
} from '@/components/ui/select';
import { tasksApi, contactsApi, objectivesApi } from '@/lib/api';
import { Target } from 'lucide-react';
import { TaskComments, type TaskComment } from '@/components/TaskComments';
import type { TaskWithRelations, Contact } from '@meeting-task-tool/shared';
import type { YearlyObjective, QuarterlyObjective } from '@/lib/mockData';

const taskSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    assigneeId: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    quarterlyObjectiveId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskEditModalProps {
    task: (TaskWithRelations & { quarterlyObjectiveId?: string | null; comments?: TaskComment[] }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    onCommentsChange?: (taskId: string, comments: TaskComment[]) => void;
}

// Helper to flatten quarterly objectives with parent info
interface FlattenedObjective {
    id: string;
    label: string;
    yearlyTitle: string;
    quarter: number;
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
    const [objectives, setObjectives] = useState<FlattenedObjective[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState<TaskFormValues | null>(null);

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            description: '',
            assigneeId: null,
            deadline: null,
            status: 'pending',
            priority: 'medium',
            quarterlyObjectiveId: null,
        },
    });

    // Load contacts for assignee dropdown
    useEffect(() => {
        const loadContacts = async () => {
            try {
                const response = await contactsApi.list();
                setContacts(response.contacts || []);
            } catch (err) {
                console.error('Failed to load contacts:', err);
            }
        };
        loadContacts();
    }, []);

    // Load objectives for dropdown
    useEffect(() => {
        const loadObjectives = async () => {
            try {
                const response = await objectivesApi.listYearly();
                const flattened: FlattenedObjective[] = [];
                (response.objectives || []).forEach((yearly: YearlyObjective) => {
                    yearly.quarterlyObjectives.forEach((q: QuarterlyObjective) => {
                        flattened.push({
                            id: q.id,
                            label: q.title,
                            yearlyTitle: yearly.title,
                            quarter: q.quarter,
                        });
                    });
                });
                setObjectives(flattened);
            } catch (err) {
                console.error('Failed to load objectives:', err);
            }
        };
        loadObjectives();
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
                quarterlyObjectiveId: task.quarterlyObjectiveId || null,
            });
            setComments(task.comments || []);
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
        if (!task) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await tasksApi.update(task.id, {
                ...data,
                deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
                reviewed: true,
            });
            setShowDeadlineWarning(false);
            setPendingSubmitData(null);
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err?.error || 'Failed to update task');
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

    if (!task) return null;

    // Group objectives by yearly objective
    const groupedObjectives = objectives.reduce((acc, obj) => {
        if (!acc[obj.yearlyTitle]) {
            acc[obj.yearlyTitle] = [];
        }
        acc[obj.yearlyTitle].push(obj);
        return acc;
    }, {} as Record<string, FlattenedObjective[]>);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">

                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update task details. Changes will mark the task as reviewed.
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            defaultValue={field.value || 'unassigned'}
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
                                    <FormItem>
                                        <FormLabel>Deadline</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Supports Objective Field */}
                            <FormField
                                control={form.control}
                                name="quarterlyObjectiveId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            Supports Objective
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                                            defaultValue={field.value || 'none'}
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
                                                {Object.entries(groupedObjectives).map(([yearlyTitle, quarters]) => (
                                                    <div key={yearlyTitle}>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                                            {yearlyTitle.length > 40 ? yearlyTitle.slice(0, 40) + '...' : yearlyTitle}
                                                        </div>
                                                        {quarters.map((q) => (
                                                            <SelectItem key={q.id} value={q.id}>
                                                                <span className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-blue-600">Q{q.quarter}</span>
                                                                    <span>{q.label.length > 35 ? q.label.slice(0, 35) + '...' : q.label}</span>
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Comments Section */}
                            <TaskComments
                                comments={comments}
                                onAddComment={handleAddComment}
                                onDeleteComment={handleDeleteComment}
                            />

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
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Deadline Warning Dialog */}
            <AlertDialog open={showDeadlineWarning} onOpenChange={setShowDeadlineWarning}>
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
            </AlertDialog>
        </>
    );
}

