'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface AnalyticsPanelProps {
    tasks: TaskWithRelations[];
}

// Helper to get week number
function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// Status colors matching the existing design
const statusColors = {
    completed: '#22c55e',
    in_progress: '#3b82f6',
    pending: '#eab308',
    cancelled: '#6b7280',
};

const priorityColors = {
    urgent: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};

export function AnalyticsPanel({ tasks }: AnalyticsPanelProps) {
    // Calculate analytics data
    const analytics = useMemo(() => {
        const now = new Date();
        const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

        // Define accumulator interface for type safety
        interface AnalyticsAccumulator {
            statusCounts: Record<string, number>;
            priorityCounts: Record<string, number>;
            assigneeCounts: Record<string, number>;
            personStats: Record<string, {
                total: number;
                completed: number;
                onTime: number;
                late: number;
                completionRate: number;
                onTimeRate: number;
            }>;
            completedTasks: number;
            completedWithDeadlineCount: number;
            onTimeTasks: number;
        }

        const initialAcc: AnalyticsAccumulator = {
            statusCounts: {},
            priorityCounts: {},
            assigneeCounts: {},
            personStats: {},
            completedTasks: 0,
            completedWithDeadlineCount: 0,
            onTimeTasks: 0,
        };

        // Single pass reduction
        const stats = tasks.reduce<AnalyticsAccumulator>((acc, task) => {
            // 1. Status Counts
            acc.statusCounts[task.status] = (acc.statusCounts[task.status] || 0) + 1;

            // 2. Priority Counts
            acc.priorityCounts[task.priority] = (acc.priorityCounts[task.priority] || 0) + 1;

            // 3. Assignee Counts & Person Stats
            const assigneeName = task.assigneeName || task.assignee?.name || 'Unassigned';

            // Assignee Counts
            acc.assigneeCounts[assigneeName] = (acc.assigneeCounts[assigneeName] || 0) + 1;

            // Initialize person stats if needed
            if (!acc.personStats[assigneeName]) {
                acc.personStats[assigneeName] = {
                    total: 0, completed: 0, onTime: 0, late: 0, completionRate: 0, onTimeRate: 0
                };
            }

            const pStats = acc.personStats[assigneeName];
            pStats.total++;

            // 4. Completion & On-Time Logic
            if (task.status === 'completed') {
                acc.completedTasks++;
                pStats.completed++;

                if (task.deadline && task.updatedAt) {
                    acc.completedWithDeadlineCount++;
                    const deadline = new Date(task.deadline);
                    const completedAt = new Date(task.updatedAt);

                    if (completedAt <= deadline) {
                        // On Time
                        acc.onTimeTasks++;
                        pStats.onTime++;
                    } else {
                        // Late
                        pStats.late++;
                    }
                } else {
                    // No deadline counts as on-time for person stats
                    pStats.onTime++;
                }
            }

            return acc;
        }, initialAcc);

        // Calculate derived rates for each person
        Object.values(stats.personStats).forEach((stat: AnalyticsAccumulator['personStats'][string]) => {
            stat.completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
            stat.onTimeRate = stat.completed > 0 ? Math.round((stat.onTime / stat.completed) * 100) : 0;
        });

        // Calculate Weekly Data (requires separate pass or complex logic, keeping separate for readability but optimized)
        const weeklyData: { week: string; completed: number; created: number }[] = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const weekNum = getWeekNumber(weekEnd);

            // Optimized filter: reduce over tasks is O(N) per week. 
            // Better: Single pass to bucketize tasks by week if N is large. 
            // For now, this loop (4 * N) is acceptable and readable.
            const weekStats = tasks.reduce((wAcc, t) => {
                if (t.status === 'completed' && t.updatedAt) {
                    const updated = new Date(t.updatedAt);
                    if (updated >= weekStart && updated < weekEnd) wAcc.completed++;
                }
                const created = new Date(t.createdAt);
                if (created >= weekStart && created < weekEnd) wAcc.created++;
                return wAcc;
            }, { completed: 0, created: 0 });

            weeklyData.push({
                week: `W${weekNum}`,
                completed: weekStats.completed,
                created: weekStats.created,
            });
        }

        // Global Stats
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;
        const lateTasks = stats.completedWithDeadlineCount - stats.onTimeTasks;
        const onTimeRate = stats.completedWithDeadlineCount > 0
            ? Math.round((stats.onTimeTasks / stats.completedWithDeadlineCount) * 100)
            : 100;

        // Mock average completion time
        const avgCompletionDays = 4.2;

        return {
            statusCounts: stats.statusCounts,
            priorityCounts: stats.priorityCounts,
            assigneeCounts: stats.assigneeCounts,
            personStats: stats.personStats,
            weeklyData,
            completionRate,
            avgCompletionDays,
            totalTasks,
            completedTasks: stats.completedTasks,
            onTimeTasks: stats.onTimeTasks,
            lateTasks,
            onTimeRate,
        };
    }, [tasks]);

    const maxAssigneeCount = Math.max(...Object.values(analytics.assigneeCounts), 1);
    const maxWeeklyCount = Math.max(
        ...analytics.weeklyData.flatMap(w => [w.completed, w.created]),
        1
    );

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Completion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-green-600">{analytics.completionRate}%</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                +5%
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{analytics.completedTasks} of {analytics.totalTasks} tasks</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Avg. Completion Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{analytics.avgCompletionDays}</span>
                            <span className="text-lg text-gray-500">days</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">From creation to done</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Active Assignees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {Object.keys(analytics.assigneeCounts).filter(k => k !== 'Unassigned').length}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Team members with tasks</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">
                            {analytics.statusCounts.in_progress || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Tasks being worked on</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Weekly Activity</CardTitle>
                        <CardDescription>Tasks created vs completed over the last 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 flex items-end justify-around gap-4">
                            {analytics.weeklyData.map((week, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex gap-1 items-end justify-center h-36">
                                        {/* Created bar */}
                                        <div
                                            className="w-5 bg-blue-200 rounded-t transition-all duration-500"
                                            style={{ height: `${(week.created / maxWeeklyCount) * 100}%`, minHeight: week.created > 0 ? '8px' : '0' }}
                                            title={`Created: ${week.created}`}
                                        />
                                        {/* Completed bar */}
                                        <div
                                            className="w-5 bg-green-500 rounded-t transition-all duration-500"
                                            style={{ height: `${(week.completed / maxWeeklyCount) * 100}%`, minHeight: week.completed > 0 ? '8px' : '0' }}
                                            title={`Completed: ${week.completed}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">{week.week}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-200 rounded" />
                                <span className="text-gray-600">Created</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded" />
                                <span className="text-gray-600">Completed</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown Donut */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Status Breakdown</CardTitle>
                        <CardDescription>Distribution of tasks by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center gap-8">
                            {/* SVG Donut Chart */}
                            <div className="relative">
                                <svg width="140" height="140" viewBox="0 0 140 140">
                                    {(() => {
                                        const total = Object.values(analytics.statusCounts).reduce((a, b) => a + b, 0) || 1;
                                        let startAngle = -90;
                                        const statuses = ['completed', 'in_progress', 'pending', 'cancelled'];

                                        return statuses.map((status) => {
                                            const count = analytics.statusCounts[status] || 0;
                                            const angle = (count / total) * 360;
                                            const endAngle = startAngle + angle;

                                            // SVG arc path
                                            const x1 = 70 + 50 * Math.cos((startAngle * Math.PI) / 180);
                                            const y1 = 70 + 50 * Math.sin((startAngle * Math.PI) / 180);
                                            const x2 = 70 + 50 * Math.cos((endAngle * Math.PI) / 180);
                                            const y2 = 70 + 50 * Math.sin((endAngle * Math.PI) / 180);
                                            const largeArc = angle > 180 ? 1 : 0;

                                            const path = count > 0 ? `M 70 70 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z` : '';
                                            startAngle = endAngle;

                                            return path ? (
                                                <path
                                                    key={status}
                                                    d={path}
                                                    fill={statusColors[status as keyof typeof statusColors]}
                                                    className="transition-all duration-500"
                                                />
                                            ) : null;
                                        });
                                    })()}
                                    <circle cx="70" cy="70" r="30" fill="white" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold">{analytics.totalTasks}</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-2">
                                {[
                                    { key: 'completed', label: 'Completed' },
                                    { key: 'in_progress', label: 'In Progress' },
                                    { key: 'pending', label: 'Pending' },
                                    { key: 'cancelled', label: 'Cancelled' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: statusColors[key as keyof typeof statusColors] }}
                                        />
                                        <span className="text-gray-600">{label}</span>
                                        <span className="font-medium ml-auto">{analytics.statusCounts[key] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignee Workload */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Workload by Assignee</CardTitle>
                    <CardDescription>Task distribution across team members</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(analytics.assigneeCounts)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([name, count]) => (
                                <div key={name} className="flex items-center gap-3">
                                    <div className="w-32 text-sm font-medium text-gray-700 truncate">{name}</div>
                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                            style={{ width: `${(count / maxAssigneeCount) * 100}%`, minWidth: '32px' }}
                                        >
                                            <span className="text-xs font-bold text-white">{count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Priority Distribution</CardTitle>
                    <CardDescription>Tasks grouped by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        {[
                            { key: 'urgent', label: 'Urgent' },
                            { key: 'high', label: 'High' },
                            { key: 'medium', label: 'Medium' },
                            { key: 'low', label: 'Low' },
                        ].map(({ key, label }) => {
                            const count = analytics.priorityCounts[key] || 0;
                            const percentage = analytics.totalTasks > 0 ? Math.round((count / analytics.totalTasks) * 100) : 0;
                            return (
                                <div key={key} className="flex-1 text-center">
                                    <div
                                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2"
                                        style={{ backgroundColor: priorityColors[key as keyof typeof priorityColors] }}
                                    >
                                        {count}
                                    </div>
                                    <div className="text-sm font-medium text-gray-700">{label}</div>
                                    <div className="text-xs text-gray-500">{percentage}%</div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Performance by Assignee */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Performance by Assignee</CardTitle>
                    <CardDescription>Individual completion rates and on-time delivery</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(analytics.personStats)
                            .filter(([name]) => name !== 'Unassigned')
                            .sort(([, a], [, b]) => (b as { total: number }).total - (a as { total: number }).total)
                            .slice(0, 6)
                            .map(([name, stats]) => {
                                const typedStats = stats as { total: number; completed: number; onTime: number; late: number; completionRate: number; onTimeRate: number };
                                return (
                                    <div key={name} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{name}</h4>
                                                    <p className="text-xs text-gray-500">{typedStats.total} tasks assigned</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${typedStats.completionRate >= 70 ? 'text-green-600' : typedStats.completionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {typedStats.completionRate}%
                                                    </span>
                                                    <span className="text-sm text-gray-500">completed</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Completion progress bar */}
                                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                                style={{ width: `${typedStats.completionRate}%` }}
                                            />
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex justify-between text-xs">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    {typedStats.completed} done
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-blue-500" />
                                                    {typedStats.total - typedStats.completed} pending
                                                </span>
                                            </div>
                                            {typedStats.completed > 0 && (
                                                <span className={`flex items-center gap-1 font-medium ${typedStats.onTimeRate >= 80 ? 'text-green-600' : typedStats.onTimeRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {typedStats.onTimeRate}% on-time
                                                    {typedStats.late > 0 && (
                                                        <span className="text-red-500 ml-1">({typedStats.late} late)</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                        {Object.keys(analytics.personStats).filter(n => n !== 'Unassigned').length === 0 && (
                            <p className="text-gray-500 text-center py-4">No assignee data available</p>
                        )}
                    </div>

                    {/* Summary row */}
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-600">{analytics.onTimeTasks}</div>
                            <div className="text-xs text-gray-500">On-time completions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{analytics.lateTasks}</div>
                            <div className="text-xs text-gray-500">Late completions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{analytics.onTimeRate}%</div>
                            <div className="text-xs text-gray-500">Overall on-time rate</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
