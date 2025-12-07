'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

export default function AnalyticsPage() {
    const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await tasksApi.list();
            const taskData = (response as any).tasks || [];
            setTasks(taskData);
        } catch (err: any) {
            setError(err?.error || 'Failed to load tasks');
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground mt-1">Visualize your team's performance and task distribution</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadTasks} disabled={isLoading} className="flex items-center space-x-1 border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

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
            ) : (
                <AnalyticsPanel tasks={tasks} />
            )}
        </div>
    );
}
