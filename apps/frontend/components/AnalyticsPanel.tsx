'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export function AnalyticsPanel({ tasks }: AnalyticsPanelProps) {
    // Calculate analytics data
    const analytics = useMemo(() => {
        const now = new Date();

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

        // Calculate Weekly Data
        const weeklyData: { week: string; completed: number; created: number }[] = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const weekNum = getWeekNumber(weekEnd);

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

        // Calculate Average Completion Time
        let totalCompletionTimeMs = 0;
        let completedCountForTime = 0;

        tasks.forEach(task => {
            if (task.status === 'completed' && task.updatedAt) {
                const created = new Date(task.createdAt);
                const completed = new Date(task.updatedAt);
                const diff = completed.getTime() - created.getTime();
                if (diff >= 0) {
                    totalCompletionTimeMs += diff;
                    completedCountForTime++;
                }
            }
        });

        const avgCompletionDays = completedCountForTime > 0
            ? Math.round((totalCompletionTimeMs / completedCountForTime / (1000 * 60 * 60 * 24)) * 10) / 10
            : 0;

        // Calculate Completion Rate Trend (Last 30 days vs Previous 30 days)
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = new Date(now.getTime() - thirtyDaysMs);
        const sixtyDaysAgo = new Date(now.getTime() - (2 * thirtyDaysMs));

        let currentPeriodTotal = 0;
        let currentPeriodCompleted = 0;
        let prevPeriodTotal = 0;
        let prevPeriodCompleted = 0;

        tasks.forEach(task => {
            const created = new Date(task.createdAt);
            if (created >= thirtyDaysAgo) {
                currentPeriodTotal++;
                if (task.status === 'completed') currentPeriodCompleted++;
            } else if (created >= sixtyDaysAgo) {
                prevPeriodTotal++;
                if (task.status === 'completed') prevPeriodCompleted++;
            }
        });

        const currentRate = currentPeriodTotal > 0 ? (currentPeriodCompleted / currentPeriodTotal) * 100 : 0;
        const prevRate = prevPeriodTotal > 0 ? (prevPeriodCompleted / prevPeriodTotal) * 100 : 0;
        const completionRateTrend = Math.round(currentRate - prevRate);

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
            completionRateTrend,
        };
    }, [tasks]);

    const maxAssigneeCount = Math.max(...Object.values(analytics.assigneeCounts), 1);
    const maxWeeklyCount = Math.max(
        ...analytics.weeklyData.flatMap(w => [w.completed, w.created]),
        1
    );

    return (
        <div className="space-y-6">
            {/* Top Stats Row - Opus Style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* Completion Rate Card */}
                <Card className="border border-border bg-card">
                    <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                            <div className="h-9 w-9 rounded-[10px] bg-[rgba(34,197,94,0.1)] flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                            </div>
                        </div>
                        <div className="text-[28px] font-bold text-white mb-2">
                            {analytics.completionRate}%
                        </div>
                        <div className={`text-xs font-semibold flex items-center gap-1 ${analytics.completionRateTrend >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            <TrendingUp className={`h-3 w-3 ${analytics.completionRateTrend < 0 ? 'rotate-180' : ''}`} />
                            {analytics.completionRateTrend > 0 ? '+' : ''}{analytics.completionRateTrend}% vs last month
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analytics.completedTasks} of {analytics.totalTasks} tasks</p>
                    </CardContent>
                </Card>

                {/* Avg Completion Time Card */}
                <Card className="border border-border bg-card">
                    <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-muted-foreground">Avg. Completion Time</span>
                            <div className="h-9 w-9 rounded-[10px] bg-[rgba(245,198,134,0.1)] flex items-center justify-center">
                                <Clock className="h-4 w-4 text-[#F5C686]" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[28px] font-bold text-white">{analytics.avgCompletionDays}</span>
                            <span className="text-lg text-muted-foreground">days</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">From creation to done</p>
                    </CardContent>
                </Card>

                {/* Active Assignees Card */}
                <Card className="border border-border bg-card">
                    <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-muted-foreground">Active Assignees</span>
                            <div className="h-9 w-9 rounded-[10px] bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                                <Users className="h-4 w-4 text-[#3b82f6]" />
                            </div>
                        </div>
                        <div className="text-[28px] font-bold text-white mb-2">
                            {Object.keys(analytics.assigneeCounts).filter(k => k !== 'Unassigned').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Team members with tasks</p>
                    </CardContent>
                </Card>

                {/* In Progress Card */}
                <Card className="border border-border bg-card">
                    <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-muted-foreground">In Progress</span>
                            <div className="h-9 w-9 rounded-[10px] bg-[rgba(249,115,22,0.1)] flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-[#f97316]" />
                            </div>
                        </div>
                        <div className="text-[28px] font-bold text-white mb-2">
                            {analytics.statusCounts.in_progress || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Tasks being worked on</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Weekly Activity Chart */}
                <Card className="border border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg text-card-foreground">Weekly Activity</CardTitle>
                        <CardDescription className="text-muted-foreground">Tasks created vs completed over the last 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="week"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value: number) => `${value}`}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                                        itemStyle={{ color: 'var(--card-foreground)' }}
                                        labelStyle={{ color: 'var(--muted-foreground)' }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="created"
                                        name="Created"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorCreated)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        name="Completed"
                                        stroke="#22c55e"
                                        fillOpacity={1}
                                        fill="url(#colorCompleted)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown Donut */}
                <Card className="border border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg text-card-foreground">Status Breakdown</CardTitle>
                        <CardDescription className="text-muted-foreground">Distribution of tasks by current status</CardDescription>
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
                                        const colors: Record<string, string> = {
                                            completed: 'var(--chart-2)', // Green
                                            in_progress: 'var(--chart-3)', // Blue
                                            pending: 'var(--chart-1)', // Gold
                                            cancelled: 'var(--muted-foreground)', // Gray
                                        };

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
                                                    fill={colors[status]}
                                                    className="transition-all duration-500 hover:opacity-80"
                                                />
                                            ) : null;
                                        });
                                    })()}
                                    <circle cx="70" cy="70" r="30" fill="var(--card)" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-card-foreground">{analytics.totalTasks}</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-2">
                                {[
                                    { key: 'completed', label: 'Completed', color: 'bg-[var(--chart-2)]' },
                                    { key: 'in_progress', label: 'In Progress', color: 'bg-[var(--chart-3)]' },
                                    { key: 'pending', label: 'Pending', color: 'bg-[var(--chart-1)]' },
                                    { key: 'cancelled', label: 'Cancelled', color: 'bg-muted-foreground' },
                                ].map(({ key, label, color }) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        <div
                                            className={`w-3 h-3 rounded-full ${color}`}
                                        />
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium ml-auto text-card-foreground">{analytics.statusCounts[key] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignee Workload */}
            <Card className="border border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-card-foreground">Workload by Assignee</CardTitle>
                    <CardDescription className="text-muted-foreground">Task distribution across team members</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(analytics.assigneeCounts)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([name, count]) => (
                                <div key={name} className="flex items-center gap-3">
                                    <div className="w-32 text-sm font-medium text-card-foreground truncate">{name}</div>
                                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
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
            <Card className="border border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-card-foreground">Priority Distribution</CardTitle>
                    <CardDescription className="text-muted-foreground">Tasks grouped by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        {[
                            { key: 'urgent', label: 'Urgent', color: 'bg-red-500' },
                            { key: 'high', label: 'High', color: 'bg-orange-500' },
                            { key: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                            { key: 'low', label: 'Low', color: 'bg-green-500' },
                        ].map(({ key, label, color }) => {
                            const count = analytics.priorityCounts[key] || 0;
                            const percentage = analytics.totalTasks > 0 ? Math.round((count / analytics.totalTasks) * 100) : 0;
                            return (
                                <div key={key} className="flex-1 text-center">
                                    <div
                                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${color}`}
                                    >
                                        {count}
                                    </div>
                                    <div className="text-sm font-medium text-card-foreground">{label}</div>
                                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
