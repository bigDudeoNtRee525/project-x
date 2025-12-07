'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { objectivesApi } from '@/lib/api';
import { YearlyProgress } from '@/components/YearlyProgress';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ObjectivesTimeline } from '@/components/ObjectivesTimeline';
import { Target, Plus, RefreshCw, ChevronDown, ChevronUp, LayoutGrid, Calendar } from 'lucide-react';
import type { YearlyObjective } from '@/lib/mockData';

type ViewMode = 'cards' | 'timeline';

export default function PlanningPage() {
    const [objectives, setObjectives] = useState<YearlyObjective[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('cards');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState<YearlyObjective | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [objectiveToDelete, setObjectiveToDelete] = useState<YearlyObjective | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

    const loadObjectives = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await objectivesApi.listYearly(selectedYear);
            setObjectives(response.objectives || []);
        } catch (err: any) {
            setError(err?.error || 'Failed to load objectives');
            setObjectives([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadObjectives();
    }, [loadObjectives]);

    const toggleObjective = (id: string) => {
        setExpandedObjectives((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedObjectives(new Set(objectives.map((o) => o.id)));
    };

    const collapseAll = () => {
        setExpandedObjectives(new Set());
    };

    // CRUD handlers
    const handleAddObjective = () => {
        setSelectedObjective(null);
        setIsFormModalOpen(true);
    };

    const handleEditObjective = (objective: YearlyObjective) => {
        setSelectedObjective(objective);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (objective: YearlyObjective) => {
        setObjectiveToDelete(objective);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!objectiveToDelete) return;
        setIsDeleting(true);
        try {
            await objectivesApi.deleteYearly(objectiveToDelete.id);
            setIsDeleteDialogOpen(false);
            setObjectiveToDelete(null);
            loadObjectives();
        } catch (err: any) {
            console.error('Failed to delete:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTimelineClick = (objective: YearlyObjective) => {
        handleEditObjective(objective);
    };

    // Filter objectives by category
    const filteredObjectives = filterCategory === 'all'
        ? objectives
        : objectives.filter((o) => o.category === filterCategory);

    // Get unique categories
    const categories = ['all', ...new Set(objectives.map((o) => o.category))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="h-8 w-8 text-blue-600" />
                        Long-Term Planning
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track your yearly objectives and quarterly goals
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadObjectives} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleAddObjective}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Objective
                    </Button>
                </div>
            </div>

            {/* Year Progress Overview */}
            <YearlyProgress
                year={selectedYear}
                objectives={objectives.map((o) => ({ progress: o.progress, status: o.status }))}
            />

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* Year Selector */}
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Category Filter */}
                    <Select
                        value={filterCategory}
                        onValueChange={setFilterCategory}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex border rounded-lg overflow-hidden">
                        <Button
                            variant={viewMode === 'cards' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className="rounded-none"
                        >
                            <LayoutGrid className="h-4 w-4 mr-1" />
                            Cards
                        </Button>
                        <Button
                            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('timeline')}
                            className="rounded-none"
                        >
                            <Calendar className="h-4 w-4 mr-1" />
                            Timeline
                        </Button>
                    </div>

                    {viewMode === 'cards' && (
                        <>
                            <Button variant="outline" size="sm" onClick={expandAll}>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Expand All
                            </Button>
                            <Button variant="outline" size="sm" onClick={collapseAll}>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Collapse All
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content - Cards or Timeline */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading objectives...</p>
                    </div>
                </div>
            ) : error ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                        <Button onClick={loadObjectives} variant="outline" className="mt-4">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : filteredObjectives.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <Target className="h-16 w-16 mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">No Objectives Yet</h3>
                        <p className="mt-2 text-gray-600 max-w-md mx-auto">
                            Start by defining your big objectives for the year. Break them down into quarterly goals to track progress.
                        </p>
                        <Button className="mt-6" onClick={handleAddObjective}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Objective
                        </Button>
                    </CardContent>
                </Card>
            ) : viewMode === 'timeline' ? (
                <ObjectivesTimeline
                    objectives={filteredObjectives}
                    year={selectedYear}
                    currentQuarter={currentQuarter}
                    onObjectiveClick={handleTimelineClick}
                />
            ) : (
                <div className="space-y-4">
                    {filteredObjectives.map((objective) => (
                        <ObjectiveCard
                            key={objective.id}
                            objective={objective}
                            isExpanded={expandedObjectives.has(objective.id)}
                            onToggle={() => toggleObjective(objective.id)}
                            currentQuarter={currentQuarter}
                            onEdit={handleEditObjective}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {!isLoading && filteredObjectives.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Objectives</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{objectives.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Average Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)}%
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">On Track</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {objectives.filter((o) => o.status === 'on-track' || o.status === 'completed').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Need Attention</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-600">
                                {objectives.filter((o) => o.status === 'at-risk' || o.status === 'behind').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modals */}
            <ObjectiveFormModal
                objective={selectedObjective}
                open={isFormModalOpen}
                onOpenChange={setIsFormModalOpen}
                onSuccess={loadObjectives}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Objective?"
                description={`Are you sure you want to delete "${objectiveToDelete?.title}"? This will also remove all quarterly objectives and key results. This action cannot be undone.`}
            />
        </div>
    );
}
