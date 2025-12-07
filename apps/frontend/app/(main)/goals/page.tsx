"use client";

import { useState, useEffect } from 'react';
import { GoalHierarchy } from '@/components/GoalHierarchy';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { GoalFormModal } from '@/components/GoalFormModal';
import { goalsApi, type Goal } from '@/lib/api';

export default function GoalsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [goals, setGoals] = useState<Goal[]>([]);

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
    };

    return (
        <div className="h-screen w-full flex flex-col">
            <div className="p-4 border-b bg-white shadow-sm z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Strategic Roadmap</h1>
                    <p className="text-sm text-gray-500">Visualizing the path from tasks to goals</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                </Button>
            </div>
            <div className="flex-1 bg-gray-50">
                <GoalHierarchy key={refreshKey} />
            </div>

            <GoalFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={handleSuccess}
                existingGoals={goals}
            />
        </div>
    );
}
