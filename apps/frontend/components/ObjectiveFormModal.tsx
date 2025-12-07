'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { objectivesApi } from '@/lib/api';
import { Plus, Trash2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import type { YearlyObjective, QuarterlyObjective, KeyResult } from '@/lib/mockData';

// Zod schemas
const keyResultSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    targetValue: z.coerce.number().min(0),
    currentValue: z.coerce.number().min(0),
    unit: z.string().min(1, 'Unit is required'),
});

const quarterlyObjectiveSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required'),
    description: z.string(),
    quarter: z.coerce.number().min(1).max(4) as z.ZodType<1 | 2 | 3 | 4>,
    progress: z.coerce.number().min(0).max(100),
    status: z.enum(['not-started', 'in-progress', 'completed', 'at-risk']),
    keyResults: z.array(keyResultSchema),
});

const yearlyObjectiveSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    targetDate: z.string().min(1, 'Target date is required'),
    year: z.coerce.number().min(2020).max(2030),
    category: z.enum(['growth', 'product', 'team', 'operations', 'revenue']),
    status: z.enum(['on-track', 'at-risk', 'behind', 'completed']),
    progress: z.coerce.number().min(0).max(100),
    quarterlyObjectives: z.array(quarterlyObjectiveSchema),
});

type FormValues = z.infer<typeof yearlyObjectiveSchema>;

interface ObjectiveFormModalProps {
    objective: YearlyObjective | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const categoryOptions = [
    { value: 'growth', label: '📈 Growth', color: 'bg-blue-100 text-blue-700' },
    { value: 'product', label: '🚀 Product', color: 'bg-purple-100 text-purple-700' },
    { value: 'team', label: '👥 Team', color: 'bg-green-100 text-green-700' },
    { value: 'operations', label: '⚙️ Operations', color: 'bg-orange-100 text-orange-700' },
    { value: 'revenue', label: '💰 Revenue', color: 'bg-emerald-100 text-emerald-700' },
];

const statusOptions = [
    { value: 'on-track', label: 'On Track', color: 'text-green-600' },
    { value: 'at-risk', label: 'At Risk', color: 'text-yellow-600' },
    { value: 'behind', label: 'Behind', color: 'text-red-600' },
    { value: 'completed', label: 'Completed', color: 'text-blue-600' },
];

const quarterStatusOptions = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'at-risk', label: 'At Risk' },
    { value: 'completed', label: 'Completed' },
];

export function ObjectiveFormModal({
    objective,
    open,
    onOpenChange,
    onSuccess,
}: ObjectiveFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(new Set([0]));

    const isEditing = !!objective;

    const form = useForm<FormValues>({
        resolver: zodResolver(yearlyObjectiveSchema as any),
        defaultValues: {
            title: '',
            description: '',
            targetDate: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            category: 'growth',
            status: 'on-track',
            progress: 0,
            quarterlyObjectives: [],
        },
    });

    const { fields: quarterFields, append: appendQuarter, remove: removeQuarter } = useFieldArray({
        control: form.control,
        name: 'quarterlyObjectives',
    });

    // Reset form when objective changes
    useEffect(() => {
        if (objective) {
            form.reset({
                title: objective.title,
                description: objective.description,
                targetDate: new Date(objective.targetDate).toISOString().split('T')[0],
                year: objective.year,
                category: objective.category,
                status: objective.status,
                progress: objective.progress,
                quarterlyObjectives: objective.quarterlyObjectives.map(q => ({
                    ...q,
                    keyResults: q.keyResults || [],
                })),
            });
            setExpandedQuarters(new Set([0]));
        } else {
            form.reset({
                title: '',
                description: '',
                targetDate: `${new Date().getFullYear()}-12-31`,
                year: new Date().getFullYear(),
                category: 'growth',
                status: 'on-track',
                progress: 0,
                quarterlyObjectives: [],
            });
        }
    }, [objective, form, open]);

    const toggleQuarter = (index: number) => {
        setExpandedQuarters(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const addQuarterlyObjective = () => {
        const usedQuarters = quarterFields.map(q => q.quarter);
        const nextQuarter = [1, 2, 3, 4].find(q => !usedQuarters.includes(q as 1 | 2 | 3 | 4)) || 1;
        appendQuarter({
            id: `temp-q-${Date.now()}`,
            title: '',
            description: '',
            quarter: nextQuarter as 1 | 2 | 3 | 4,
            progress: 0,
            status: 'not-started',
            keyResults: [],
        });
        setExpandedQuarters(prev => new Set([...prev, quarterFields.length]));
    };

    const addKeyResult = (quarterIndex: number) => {
        const currentKRs = form.getValues(`quarterlyObjectives.${quarterIndex}.keyResults`) || [];
        form.setValue(`quarterlyObjectives.${quarterIndex}.keyResults`, [
            ...currentKRs,
            {
                id: `temp-kr-${Date.now()}`,
                title: '',
                targetValue: 100,
                currentValue: 0,
                unit: '%',
            },
        ]);
    };

    const removeKeyResult = (quarterIndex: number, krIndex: number) => {
        const currentKRs = form.getValues(`quarterlyObjectives.${quarterIndex}.keyResults`) || [];
        form.setValue(
            `quarterlyObjectives.${quarterIndex}.keyResults`,
            currentKRs.filter((_, i) => i !== krIndex)
        );
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const objectiveData = {
                ...data,
                targetDate: new Date(data.targetDate),
                quarterlyObjectives: data.quarterlyObjectives.map((q, idx) => ({
                    ...q,
                    id: objective?.quarterlyObjectives[idx]?.id || `q${q.quarter}-${Date.now()}-${idx}`,
                    yearlyObjectiveId: objective?.id || '',
                })),
            };

            if (isEditing && objective) {
                await objectivesApi.updateYearly(objective.id, objectiveData as any);
            } else {
                await objectivesApi.createYearly(objectiveData as any);
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err?.error || 'Failed to save objective');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        {isEditing ? 'Edit Objective' : 'Create New Objective'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your yearly objective and quarterly goals.'
                            : 'Define a yearly objective with quarterly milestones and key results.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Objective Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Scale product to 10,000 users" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the objective and why it matters..."
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
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categoryOptions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
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
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {statusOptions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            <span className={opt.color}>{opt.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Year</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(parseInt(v))} value={(field.value || new Date().getFullYear()).toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {[2024, 2025, 2026].map(year => (
                                                        <SelectItem key={year} value={year.toString()}>
                                                            {year}
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
                                    name="targetDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="progress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Progress (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Quarterly Objectives */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-700">Quarterly Objectives</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addQuarterlyObjective}
                                    disabled={quarterFields.length >= 4}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Quarter
                                </Button>
                            </div>

                            {quarterFields.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No quarterly objectives yet</p>
                                    <p className="text-sm">Add quarterly milestones to track progress</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {quarterFields.map((field, qIndex) => (
                                        <div
                                            key={field.id}
                                            className="border rounded-lg bg-gray-50 overflow-hidden"
                                        >
                                            {/* Quarter Header */}
                                            <div
                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
                                                onClick={() => toggleQuarter(qIndex)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-1 text-xs font-bold rounded bg-blue-600 text-white">
                                                        Q{form.watch(`quarterlyObjectives.${qIndex}.quarter`)}
                                                    </span>
                                                    <span className="font-medium text-sm truncate max-w-[300px]">
                                                        {form.watch(`quarterlyObjectives.${qIndex}.title`) || 'Untitled'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeQuarter(qIndex);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    {expandedQuarters.has(qIndex) ? (
                                                        <ChevronUp className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quarter Details */}
                                            {expandedQuarters.has(qIndex) && (
                                                <div className="p-4 pt-0 space-y-4 border-t">
                                                    <div className="grid grid-cols-2 gap-4 pt-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`quarterlyObjectives.${qIndex}.quarter`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Quarter</FormLabel>
                                                                    <Select
                                                                        onValueChange={(v) => field.onChange(parseInt(v))}
                                                                        value={field.value?.toString()}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {[1, 2, 3, 4].map(q => (
                                                                                <SelectItem key={q} value={q.toString()}>
                                                                                    Q{q}
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
                                                            name={`quarterlyObjectives.${qIndex}.status`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Status</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {quarterStatusOptions.map(opt => (
                                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                                    {opt.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name={`quarterlyObjectives.${qIndex}.title`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Title</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Quarterly goal title" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`quarterlyObjectives.${qIndex}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea placeholder="What needs to be achieved this quarter" className="min-h-[60px]" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`quarterlyObjectives.${qIndex}.progress`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Progress (%)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min={0} max={100} className="w-24" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Key Results */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel>Key Results</FormLabel>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => addKeyResult(qIndex)}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add KR
                                                            </Button>
                                                        </div>

                                                        {(form.watch(`quarterlyObjectives.${qIndex}.keyResults`) || []).map((_, krIndex) => (
                                                            <div key={krIndex} className="grid grid-cols-12 gap-2 items-end bg-white p-2 rounded border">
                                                                <div className="col-span-5">
                                                                    <Input
                                                                        placeholder="Key result title"
                                                                        {...form.register(`quarterlyObjectives.${qIndex}.keyResults.${krIndex}.title`)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Current"
                                                                        {...form.register(`quarterlyObjectives.${qIndex}.keyResults.${krIndex}.currentValue`)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Target"
                                                                        {...form.register(`quarterlyObjectives.${qIndex}.keyResults.${krIndex}.targetValue`)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Input
                                                                        placeholder="Unit"
                                                                        {...form.register(`quarterlyObjectives.${qIndex}.keyResults.${krIndex}.unit`)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeKeyResult(qIndex, krIndex)}
                                                                        className="text-red-500"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Objective'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
