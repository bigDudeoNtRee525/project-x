"use client";

import { useState, useEffect } from 'react';
import { GoalHierarchy } from '@/components/GoalHierarchy';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GoalFormModal } from '@/components/GoalFormModal';
import { goalsApi, type Goal } from '@/lib/api';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function GoalsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [goals, setGoals] = useState<Goal[]>([]);

    // Edit/Delete State
    const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
    const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchGoals = async () => {
        try {
            const response = (await goalsApi.list() as unknown) as { goals: Goal[] };
            setGoals(response.goals || []);
        } catch (error) {
            console.error("Failed to fetch goals:", error);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [refreshKey]);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
        fetchGoals();
        setGoalToEdit(null);
    };

    const handleEditGoal = (goal: Goal) => {
        setGoalToEdit(goal);
        setIsModalOpen(true);
    };

    const handleDeleteGoal = (goal: Goal) => {
        setGoalToDelete(goal);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!goalToDelete) return;

        setIsDeleting(true);
        try {
            await goalsApi.delete(goalToDelete.id);
            setRefreshKey(prev => prev + 1);
            fetchGoals();
            setIsDeleteOpen(false);
            setGoalToDelete(null);
        } catch (error) {
            console.error("Failed to delete goal:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleModalOpenChange = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) setGoalToEdit(null);
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background">
            <div className="p-4 border-b border-border bg-card shadow-sm z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Strategic Roadmap</h1>
                    <p className="text-sm text-muted-foreground">Visualizing the path from tasks to goals</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                </Button>
            </div>
            <div className="flex-1 bg-background">
                <GoalHierarchy
                    key={refreshKey}
                    onEditGoal={handleEditGoal}
                    onDeleteGoal={handleDeleteGoal}
                />
            </div>

            <GoalFormModal
                open={isModalOpen}
                onOpenChange={handleModalOpenChange}
                onSuccess={handleSuccess}
                existingGoals={goals}
                goalToEdit={goalToEdit}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={confirmDelete}
                title="Delete Goal"
                description={`Are you sure you want to delete "${goalToDelete?.title}"? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
}
