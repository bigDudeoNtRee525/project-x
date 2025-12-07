'use client';

import { useMemo, useState } from 'react';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface GanttChartProps {
    tasks: TaskWithRelations[];
}

// Status colors with gradient support
const statusStyles: Record<string, { bg: string; gradient: string; text: string }> = {
    pending: {
        bg: 'bg-amber-500',
        gradient: 'from-amber-400 to-amber-600',
        text: 'Pending',
    },
    in_progress: {
        bg: 'bg-blue-500',
        gradient: 'from-blue-400 to-blue-600',
        text: 'In Progress',
    },
    completed: {
        bg: 'bg-emerald-500',
        gradient: 'from-emerald-400 to-emerald-600',
        text: 'Completed',
    },
    cancelled: {
        bg: 'bg-slate-400',
        gradient: 'from-slate-300 to-slate-500',
        text: 'Cancelled',
    },
};

// Priority styles
const priorityStyles: Record<string, { ring: string; dot: string; label: string }> = {
    urgent: { ring: 'ring-red-500', dot: 'bg-red-500', label: 'Urgent' },
    high: { ring: 'ring-orange-500', dot: 'bg-orange-500', label: 'High' },
    medium: { ring: 'ring-blue-500', dot: 'bg-blue-500', label: 'Medium' },
    low: { ring: 'ring-slate-400', dot: 'bg-slate-400', label: 'Low' },
};

type ViewMode = 'week' | 'month' | 'quarter';

export function GanttChart({ tasks }: GanttChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);

    // Filter tasks that have deadlines
    const tasksWithDeadlines = useMemo(() => {
        return tasks.filter((t) => t.deadline);
    }, [tasks]);

    // Calculate date range for the chart
    const { startDate, endDate, totalDays, timeUnits } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let start: Date;
        let end: Date;

        if (tasksWithDeadlines.length === 0) {
            start = new Date(now);
            start.setDate(start.getDate() - 7);
            end = new Date(now);
            end.setDate(end.getDate() + 28);
        } else {
            const dates = tasksWithDeadlines.map((t) => new Date(t.deadline!));
            const minDate = new Date(Math.min(...dates.map((d) => d.getTime()), now.getTime()));
            const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

            start = new Date(minDate);
            start.setDate(start.getDate() - 7);

            end = new Date(maxDate);
            end.setDate(end.getDate() + 14);
        }

        // Adjust based on view mode
        if (viewMode === 'week') {
            start.setDate(start.getDate() - start.getDay()); // Start of week
        } else if (viewMode === 'month') {
            start.setDate(1); // Start of month
        } else {
            start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1); // Start of quarter
        }

        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // Generate time units based on view mode
        const units: { date: Date; label: string; subLabel?: string }[] = [];
        const current = new Date(start);

        if (viewMode === 'week') {
            while (current < end) {
                units.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('en-US', { weekday: 'short' }),
                    subLabel: current.getDate().toString(),
                });
                current.setDate(current.getDate() + 1);
            }
        } else if (viewMode === 'month') {
            while (current < end) {
                const weekStart = new Date(current);
                units.push({
                    date: new Date(current),
                    label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                });
                current.setDate(current.getDate() + 7);
            }
        } else {
            while (current < end) {
                units.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('en-US', { month: 'short' }),
                    subLabel: current.getFullYear().toString(),
                });
                current.setMonth(current.getMonth() + 1);
            }
        }

        return {
            startDate: start,
            endDate: end,
            totalDays: days,
            timeUnits: units,
        };
    }, [tasksWithDeadlines, viewMode]);

    // Calculate position of a task on the timeline
    function getTaskPosition(deadline: Date) {
        const deadlineTime = new Date(deadline).getTime();
        const startTime = startDate.getTime();
        const totalTime = endDate.getTime() - startTime;

        // Task duration based on view mode
        const durationDays = viewMode === 'week' ? 2 : viewMode === 'month' ? 5 : 14;
        const taskStartTime = deadlineTime - (durationDays * 24 * 60 * 60 * 1000);

        const left = Math.max(0, ((taskStartTime - startTime) / totalTime) * 100);
        const right = Math.min(100, ((deadlineTime - startTime) / totalTime) * 100);
        const width = Math.max(right - left, 4); // Minimum 4% width

        return { left, width };
    }

    // Today marker position
    const todayPosition = useMemo(() => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const startTime = startDate.getTime();
        const totalTime = endDate.getTime() - startTime;
        const position = ((now.getTime() - startTime) / totalTime) * 100;
        return position >= 0 && position <= 100 ? position : null;
    }, [startDate, endDate]);

    if (tasksWithDeadlines.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="relative h-72 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No Tasks with Deadlines</h3>
                    <p className="text-sm text-slate-500">Add deadlines to your tasks to visualize them on the timeline</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">View:</span>
                    <div className="flex rounded-lg bg-slate-100 p-0.5">
                        {(['week', 'month', 'quarter'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === mode
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Today
                    </span>
                    <span>{tasksWithDeadlines.length} task{tasksWithDeadlines.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Timeline Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                <div className="w-72 shrink-0 px-4 py-2 font-medium text-xs text-slate-500 uppercase tracking-wider border-r border-slate-100">
                    Task Details
                </div>
                <div className="flex-1 relative overflow-x-auto">
                    <div className="flex min-w-full">
                        {timeUnits.map((unit, idx) => (
                            <div
                                key={idx}
                                className="flex-1 min-w-[80px] px-2 py-2 text-center border-r border-slate-100 last:border-r-0"
                            >
                                <div className="text-xs font-medium text-slate-700">{unit.label}</div>
                                {unit.subLabel && (
                                    <div className="text-[10px] text-slate-400">{unit.subLabel}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Task Rows */}
            <div className="max-h-[400px] overflow-y-auto">
                {tasksWithDeadlines.map((task, index) => {
                    const position = getTaskPosition(new Date(task.deadline!));
                    const isHovered = hoveredTask === task.id;
                    const status = statusStyles[task.status] || statusStyles.pending;
                    const priority = priorityStyles[task.priority] || priorityStyles.medium;

                    return (
                        <div
                            key={task.id}
                            className={`flex border-b border-slate-50 last:border-b-0 transition-colors duration-150 ${isHovered ? 'bg-slate-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                                }`}
                            onMouseEnter={() => setHoveredTask(task.id)}
                            onMouseLeave={() => setHoveredTask(null)}
                        >
                            {/* Task Info Column */}
                            <div className="w-72 shrink-0 p-4 border-r border-slate-100">
                                <div className="flex items-start gap-3">
                                    {/* Priority indicator */}
                                    <div className={`mt-1 w-2 h-2 rounded-full ${priority.dot} shrink-0`} />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-medium text-slate-800 truncate leading-tight">
                                            {task.description}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    task.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {status.text}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {task.assigneeName || 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            Due: {new Date(task.deadline!).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Column */}
                            <div className="flex-1 relative py-4 px-2 min-h-[72px]">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex">
                                    {timeUnits.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1 border-r border-slate-50 last:border-r-0"
                                            style={{ minWidth: '80px' }}
                                        />
                                    ))}
                                </div>

                                {/* Today marker */}
                                {todayPosition !== null && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-red-500 to-red-300 z-10"
                                        style={{ left: `${todayPosition}%` }}
                                    >
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                                    </div>
                                )}

                                {/* Task bar */}
                                <div
                                    className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg bg-gradient-to-r ${status.gradient} shadow-md transition-all duration-200 cursor-pointer group ${isHovered ? 'ring-2 ring-offset-1 ' + priority.ring + ' scale-[1.02]' : ''
                                        }`}
                                    style={{
                                        left: `${position.left}%`,
                                        width: `${position.width}%`,
                                        minWidth: '60px',
                                    }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/25 to-transparent" />

                                    {/* Progress indicator for in_progress */}
                                    {task.status === 'in_progress' && (
                                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="relative h-full flex items-center justify-between px-2">
                                        <span className="text-[11px] text-white font-medium truncate drop-shadow-sm">
                                            {task.description.length > 20 ? task.description.substring(0, 20) + '...' : task.description}
                                        </span>
                                        {position.width > 10 && (
                                            <span className="text-[10px] text-white/80 font-medium ml-1 shrink-0">
                                                {new Date(task.deadline!).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Tooltip on hover */}
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20`}>
                                        <div className="font-medium">{task.description}</div>
                                        <div className="text-slate-300 mt-1">
                                            {new Date(task.deadline!).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-slate-400 text-[10px] mt-0.5">
                                            {priority.label} Priority • {status.text}
                                        </div>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Status</span>
                    <div className="flex items-center gap-3">
                        {Object.entries(statusStyles).map(([key, style]) => (
                            <span key={key} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-md ${style.bg}`} />
                                <span className="text-xs text-slate-600">{style.text}</span>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Priority</span>
                    <div className="flex items-center gap-3">
                        {Object.entries(priorityStyles).map(([key, style]) => (
                            <span key={key} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                <span className="text-xs text-slate-600">{style.label}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS for shimmer animation - using global style */}
            <style>{`
                @keyframes gantt-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: gantt-shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
