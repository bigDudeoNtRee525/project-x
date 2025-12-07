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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { goalsApi, type Goal } from '@/lib/api';
import { Target } from 'lucide-react';

const goalSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500),
    type: z.enum(['YEARLY', 'QUARTERLY']),
    parentId: z.string().optional(),
});

type FormValues = z.infer<typeof goalSchema>;

interface GoalFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    existingGoals?: Goal[]; // For parent selection
}

export function GoalFormModal({
    open,
    onOpenChange,
    onSuccess,
    existingGoals = [],
}: GoalFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(goalSchema as any),
        defaultValues: {
            title: '',
            type: 'YEARLY',
            parentId: undefined,
        },
    });

    const type = form.watch('type');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            form.reset();
            setError(null);
        }
    }, [open, form]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // If type is YEARLY, ensure parentId is undefined/null
            const payload = {
                ...data,
                parentId: data.type === 'YEARLY' ? undefined : data.parentId,
            };

            await goalsApi.create(payload);

            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            console.error('Failed to create goal:', err);
            setError(err?.error || 'Failed to create goal');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter potential parents: only YEARLY goals can be parents for QUARTERLY goals
    const parentOptions = existingGoals.filter(g => g.type === 'YEARLY');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Create New Goal
                    </DialogTitle>
                    <DialogDescription>
                        Define a new strategic goal for your roadmap.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goal Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Achieve $1M ARR" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="YEARLY">Yearly Goal</SelectItem>
                                                <SelectItem value="QUARTERLY">Quarterly Goal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {type === 'QUARTERLY' && (
                                <FormField
                                    control={form.control}
                                    name="parentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parent Goal</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select parent..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {parentOptions.length === 0 ? (
                                                        <SelectItem value="none" disabled>No yearly goals found</SelectItem>
                                                    ) : (
                                                        parentOptions.map(goal => (
                                                            <SelectItem key={goal.id} value={goal.id}>
                                                                {goal.title}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

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
                                {isSubmitting ? 'Creating...' : 'Create Goal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
