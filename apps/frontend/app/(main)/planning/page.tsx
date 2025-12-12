'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { goalsApi, type Goal } from '@/lib/api';
import { Target, Plus, RefreshCw, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PlanningPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState<'YEARLY' | 'QUARTERLY'>('YEARLY');
    const [formParentId, setFormParentId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog
    const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadGoals = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await goalsApi.list();
            setGoals((response as any).goals || []);
        } catch (err: any) {
            setError(err?.error || 'Failed to load goals');
            setGoals([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    const handleAddGoal = (type: 'YEARLY' | 'QUARTERLY', parentId?: string) => {
        setEditingGoal(null);
        setFormTitle('');
        setFormType(type);
        setFormParentId(parentId || null);
        setIsFormModalOpen(true);
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingGoal(goal);
        setFormTitle(goal.title);
        setFormType(goal.type);
        setFormParentId(goal.parentId);
        setIsFormModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formTitle.trim()) return;
        setIsSubmitting(true);
        try {
            if (editingGoal) {
                await goalsApi.update(editingGoal.id, {
                    title: formTitle,
                    type: formType,
                    parentId: formParentId,
                });
                toast.success('Goal updated successfully');
            } else {
                await goalsApi.create({
                    title: formTitle,
                    type: formType,
                    parentId: formParentId,
                });
                toast.success('Goal created successfully');
            }
            setIsFormModalOpen(false);
            loadGoals();
        } catch (err: any) {
            console.error('Failed to save goal:', err);
            toast.error('Failed to save goal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteGoal) return;
        setIsDeleting(true);
        try {
            await goalsApi.delete(deleteGoal.id);
            setDeleteGoal(null);
            loadGoals();
            toast.success('Goal deleted successfully');
        } catch (err: any) {
            console.error('Failed to delete goal:', err);
            toast.error('Failed to delete goal');
        } finally {
            setIsDeleting(false);
        }
    };

    // Get yearly goals (top level)
    const yearlyGoals = goals.filter(g => g.type === 'YEARLY' && !g.parentId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="h-8 w-8 text-blue-600" />
                        Goals & Objectives
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Define yearly objectives and break them into quarterly goals
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadGoals} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => handleAddGoal('YEARLY')}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Yearly Goal
                    </Button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading goals...</p>
                    </div>
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                        <Button onClick={loadGoals} variant="outline" className="mt-4">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : yearlyGoals.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <Target className="h-16 w-16 mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">No Goals Yet</h3>
                        <p className="mt-2 text-gray-600 max-w-md mx-auto">
                            Start by defining your yearly goals. Break them down into quarterly objectives to track progress.
                        </p>
                        <Button className="mt-6" onClick={() => handleAddGoal('YEARLY')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Goal
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {yearlyGoals.map((yearlyGoal) => {
                        const quarterlyGoals = yearlyGoal.children || [];
                        return (
                            <Card key={yearlyGoal.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-1 text-xs font-bold rounded bg-blue-600 text-white">
                                                YEARLY
                                            </span>
                                            <CardTitle className="text-lg">{yearlyGoal.title}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditGoal(yearlyGoal)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteGoal(yearlyGoal)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Quarterly Goals */}
                                    <div className="space-y-2">
                                        {quarterlyGoals.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No quarterly goals yet</p>
                                        ) : (
                                            quarterlyGoals.map((qGoal: Goal) => (
                                                <div
                                                    key={qGoal.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                                                            Q
                                                        </span>
                                                        <span className="text-sm">{qGoal.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditGoal(qGoal)}
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteGoal(qGoal)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => handleAddGoal('QUARTERLY', yearlyGoal.id)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Quarterly Goal
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Summary Stats */}
            {!isLoading && goals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{goals.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Yearly Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {goals.filter(g => g.type === 'YEARLY').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Quarterly Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {goals.filter(g => g.type === 'QUARTERLY').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add/Edit Goal Modal */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGoal ? 'Edit Goal' : `Add ${formType === 'YEARLY' ? 'Yearly' : 'Quarterly'} Goal`}
                        </DialogTitle>
                        <DialogDescription>
                            {formType === 'YEARLY'
                                ? 'Define a high-level yearly objective.'
                                : 'Break down your yearly goal into quarterly milestones.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Goal Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter goal title..."
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formType} onValueChange={(v) => setFormType(v as 'YEARLY' | 'QUARTERLY')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !formTitle.trim()}>
                            {isSubmitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteGoal} onOpenChange={() => setDeleteGoal(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Goal?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deleteGoal?.title}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteGoal(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
