'use client';

import {
    useMemo,
    useState,
    useEffect,
    MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface GanttChartProps {
    tasks: TaskWithRelations[];
}

// Status colors with gradient support - using Opus theme variables
const statusStyles: Record<string, { bg: string; gradient: string; text: string }> = {
    pending: {
        bg: 'bg-[var(--chart-1)]',
        gradient: 'from-[var(--chart-1)] to-[oklch(from_var(--chart-1)_l_c_h_/_0.8)]',
        text: 'Pending',
    },
    in_progress: {
        bg: 'bg-[var(--chart-3)]',
        gradient: 'from-[var(--chart-3)] to-[oklch(from_var(--chart-3)_l_c_h_/_0.8)]',
        text: 'In Progress',
    },
    completed: {
        bg: 'bg-[var(--chart-2)]',
        gradient: 'from-[var(--chart-2)] to-[oklch(from_var(--chart-2)_l_c_h_/_0.8)]',
        text: 'Completed',
    },
    cancelled: {
        bg: 'bg-muted-foreground',
        gradient: 'from-muted-foreground to-muted',
        text: 'Cancelled',
    },
};

// Priority styles
const priorityStyles: Record<string, { ring: string; dot: string; label: string }> = {
    urgent: { ring: 'ring-red-500', dot: 'bg-red-500', label: 'Urgent' },
    high: { ring: 'ring-orange-500', dot: 'bg-orange-500', label: 'High' },
    medium: { ring: 'ring-yellow-500', dot: 'bg-yellow-500', label: 'Medium' },
    low: { ring: 'ring-green-500', dot: 'bg-green-500', label: 'Low' },
};

type ViewMode = 'week' | 'month' | 'quarter';

const DAY_MS = 1000 * 60 * 60 * 24;
const ROW_HEIGHT = 56; // px
const BAR_HEIGHT = 24; // px

type TimeUnit = {
    date: Date;
    label: string;
    subLabel?: string;
    startDayIndex: number;
    endDayIndex: number;
};

type PopoverState = {
    task: TaskWithRelations;
    anchor: {
        top: number;
        left: number;
        width: number;
        bottom: number;
    };
} | null;

export function GanttChart({ tasks }: GanttChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [hoveredTask, setHoveredTask] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [popover, setPopover] = useState<PopoverState>(null);

    const tasksWithDeadlines = useMemo(
        () => tasks.filter((t) => t.deadline),
        [tasks],
    );

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
            const minDate = new Date(
                Math.min(...dates.map((d) => d.getTime()), now.getTime()),
            );
            const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

            start = new Date(minDate);
            start.setDate(start.getDate() - 7);

            end = new Date(maxDate);
            end.setDate(end.getDate() + 14);
        }

        // Normalize times
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Align start to view boundaries
        if (viewMode === 'week') {
            // Start of week (Sunday)
            start.setDate(start.getDate() - start.getDay());
        } else if (viewMode === 'month') {
            // First of month
            start.setDate(1);
        } else {
            // Start of quarter
            const m = start.getMonth();
            const qStart = Math.floor(m / 3) * 3;
            start.setMonth(qStart, 1);
        }

        const diffMs = end.getTime() - start.getTime();
        const days = Math.max(1, Math.ceil(diffMs / DAY_MS));

        const units: TimeUnit[] = [];

        if (viewMode === 'week') {
            // 1 day per column
            for (let dayIndex = 0; dayIndex < days; dayIndex++) {
                const current = new Date(start.getTime() + dayIndex * DAY_MS);
                units.push({
                    date: current,
                    label: current.toLocaleDateString('en-US', { weekday: 'short' }),
                    subLabel: current.getDate().toString(),
                    startDayIndex: dayIndex,
                    endDayIndex: dayIndex + 1,
                });
            }
        } else if (viewMode === 'month') {
            // 1 label per 7 days
            let current = new Date(start);
            while (current < end) {
                const startIndex = Math.round(
                    (current.getTime() - start.getTime()) / DAY_MS,
                );
                const next = new Date(current);
                next.setDate(next.getDate() + 7);
                const endIndex = Math.min(
                    days,
                    Math.round((next.getTime() - start.getTime()) / DAY_MS),
                );

                units.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    }),
                    startDayIndex: startIndex,
                    endDayIndex: Math.max(startIndex + 1, endIndex),
                });

                current = next;
            }
        } else {
            // Quarter: 1 column per month
            let current = new Date(start);
            while (current < end) {
                const startIndex = Math.round(
                    (current.getTime() - start.getTime()) / DAY_MS,
                );
                const next = new Date(current);
                next.setMonth(next.getMonth() + 1);
                const endIndex = Math.min(
                    days,
                    Math.round((next.getTime() - start.getTime()) / DAY_MS),
                );

                units.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('en-US', { month: 'short' }),
                    subLabel: current.getFullYear().toString(),
                    startDayIndex: startIndex,
                    endDayIndex: Math.max(startIndex + 1, endIndex),
                });

                current = next;
            }
        }

        return {
            startDate: start,
            endDate: end,
            totalDays: days,
            timeUnits: units,
        };
    }, [tasksWithDeadlines, viewMode]);

    // Width of one day in pixels (controls horizontal density)
    const dayWidth = useMemo(() => {
        if (viewMode === 'week') return 32;
        if (viewMode === 'month') return 18;
        return 12; // quarter
    }, [viewMode]);

    const chartWidth = Math.max(1, totalDays * dayWidth);

    // Today marker as day index from start
    const todayIndex = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        if (now.getTime() < startTime || now.getTime() > endTime) return null;
        const diff = now.getTime() - startTime;
        return Math.round(diff / DAY_MS);
    }, [startDate, endDate]);

    function getTaskPositionPx(deadline: Date) {
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        const totalMs = endTime - startTime;

        if (totalMs <= 0) {
            return { left: 0, width: 40 };
        }

        const deadlineTime = deadline.getTime();

        // Fake "duration" before deadline for visual bar length
        const durationDays =
            viewMode === 'week' ? 2 : viewMode === 'month' ? 5 : 14;

        let startMs = deadlineTime - durationDays * DAY_MS;
        let endMs = deadlineTime;

        // Clamp to visible range
        if (endMs < startTime) {
            endMs = startTime;
        }
        if (startMs > endTime) {
            startMs = endTime;
        }

        startMs = Math.max(startMs, startTime);
        endMs = Math.min(endMs, endTime);

        const startDayIndex = (startMs - startTime) / DAY_MS;
        const endDayIndex = (endMs - startTime) / DAY_MS;

        const left = startDayIndex * dayWidth;
        const width = Math.max((endDayIndex - startDayIndex) * dayWidth, 40); // min width in px

        return { left, width };
    }

    function handleTaskClick(
        task: TaskWithRelations,
        event: MouseEvent<HTMLDivElement>,
    ) {
        const rect = event.currentTarget.getBoundingClientRect();

        setSelectedTaskId((prev) => (prev === task.id ? null : task.id));

        // Toggle: if same task is already open, close it
        setPopover((prev) => {
            if (prev && prev.task.id === task.id) {
                return null;
            }
            return {
                task,
                anchor: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    bottom: rect.bottom,
                },
            };
        });
    }

    if (tasksWithDeadlines.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                <div className="relative h-72 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 shadow-lg">
                        <svg
                            className="w-8 h-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">
                        No Tasks with Deadlines
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Add deadlines to your tasks to visualize them on the timeline
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        View:
                    </span>
                    <div className="flex rounded-lg bg-muted p-0.5">
                        {(['week', 'month', 'quarter'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => {
                                    setViewMode(mode);
                                    // Close popover on view mode change to avoid weird positions
                                    setPopover(null);
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${viewMode === mode
                                        ? 'bg-card text-card-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-card-foreground'
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Today
                    </span>
                    <span>
                        {tasksWithDeadlines.length} task
                        {tasksWithDeadlines.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Main grid (shared vertical scroll) */}
            <div className="flex min-h-[280px] max-h-[560px] overflow-y-auto">
                {/* Left: Task details column (non-clickable) */}
                <div className="w-80 shrink-0 border-r border-border bg-card">
                    <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Task
                    </div>
                    <div>
                        {tasksWithDeadlines.map((task) => {
                            const isHovered = hoveredTask === task.id;
                            const isSelected = selectedTaskId === task.id;
                            const status = statusStyles[task.status] || statusStyles.pending;
                            const priority =
                                priorityStyles[task.priority] || priorityStyles.medium;

                            return (
                                <div
                                    key={task.id}
                                    className={`flex items-center gap-3 px-4 text-sm transition-colors border-b border-border/40 last:border-b-0 ${isSelected
                                            ? 'bg-muted/80'
                                            : isHovered
                                                ? 'bg-muted/60'
                                                : 'hover:bg-muted/30'
                                        }`}
                                    style={{ height: ROW_HEIGHT }}
                                    onMouseEnter={() => setHoveredTask(task.id)}
                                    onMouseLeave={() => setHoveredTask(null)}
                                >
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full ${priority.dot} shrink-0`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-card-foreground truncate">
                                                {task.description}
                                            </span>
                                            <span
                                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${task.status === 'completed'
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/25'
                                                        : task.status === 'in_progress'
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/25'
                                                            : task.status === 'cancelled'
                                                                ? 'bg-muted text-muted-foreground border-border'
                                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25'
                                                    }`}
                                            >
                                                {status.text}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground truncate">
                                            <span>{task.assigneeName || 'Unassigned'}</span>
                                            <span>•</span>
                                            <span>
                                                Due{' '}
                                                {new Date(task.deadline!).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="flex-1 overflow-hidden">
                    <div className="relative h-full overflow-x-auto">
                        <div className="relative" style={{ minWidth: chartWidth }}>
                            {/* Timeline header */}
                            <div className="sticky top-0 z-10 flex border-b border-border bg-muted/70 backdrop-blur-sm">
                                {timeUnits.map((unit, idx) => {
                                    const colWidth =
                                        (unit.endDayIndex - unit.startDayIndex || 1) * dayWidth;

                                    return (
                                        <div
                                            key={idx}
                                            className="px-2 py-2 text-center border-r border-border last:border-r-0"
                                            style={{ width: colWidth }}
                                        >
                                            <div className="text-xs font-medium text-card-foreground">
                                                {unit.label}
                                            </div>
                                            {unit.subLabel && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    {unit.subLabel}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grid + bars */}
                            <div
                                className="relative"
                                style={{ height: tasksWithDeadlines.length * ROW_HEIGHT }}
                            >
                                {/* Vertical day grid */}
                                <div className="absolute inset-0 pointer-events-none flex">
                                    {Array.from({ length: totalDays }).map((_, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className={`h-full border-r ${dayIndex % 7 === 0
                                                    ? 'border-border'
                                                    : 'border-border/40'
                                                }`}
                                            style={{ width: dayWidth }}
                                        />
                                    ))}
                                </div>

                                {/* Horizontal row separators */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {tasksWithDeadlines.map((_, rowIndex) => (
                                        <div
                                            key={rowIndex}
                                            className="absolute left-0 right-0 border-b border-border/40"
                                            style={{ top: (rowIndex + 1) * ROW_HEIGHT }}
                                        />
                                    ))}
                                </div>

                                {/* Today marker */}
                                {todayIndex !== null && (
                                    <div className="absolute top-0 bottom-0 pointer-events-none">
                                        <div
                                            className="absolute top-0 bottom-0 w-[2px] bg-red-500"
                                            style={{ left: todayIndex * dayWidth }}
                                        >
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                                        </div>
                                    </div>
                                )}

                                {/* Task bars (clickable) */}
                                <div className="relative">
                                    {tasksWithDeadlines.map((task, rowIndex) => {
                                        const position = getTaskPositionPx(
                                            new Date(task.deadline!),
                                        );
                                        const isHovered = hoveredTask === task.id;
                                        const isSelected = selectedTaskId === task.id;
                                        const status =
                                            statusStyles[task.status] || statusStyles.pending;
                                        const priority =
                                            priorityStyles[task.priority] || priorityStyles.medium;

                                        const top =
                                            rowIndex * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;

                                        return (
                                            <div
                                                key={task.id}
                                                className="absolute cursor-pointer"
                                                style={{
                                                    top,
                                                    left: position.left,
                                                    width: position.width,
                                                    height: BAR_HEIGHT,
                                                }}
                                                onMouseEnter={() => setHoveredTask(task.id)}
                                                onMouseLeave={() => setHoveredTask(null)}
                                                onClick={(e) => handleTaskClick(task, e)}
                                            >
                                                <div
                                                    className={`relative h-full rounded-xl bg-gradient-to-r ${status.gradient} shadow-md transition-transform duration-150 ${isHovered || isSelected
                                                            ? `scale-[1.02] ring-2 ring-offset-1 ring-offset-card ${priority.ring}`
                                                            : ''
                                                        }`}
                                                >
                                                    {/* Shine effect */}
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

                                                    {/* Progress shimmer for in_progress */}
                                                    {task.status === 'in_progress' && (
                                                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                                        </div>
                                                    )}

                                                    {/* Bar content */}
                                                    <div className="relative h-full flex items-center justify-between px-3 gap-2">
                                                        <span className="text-xs text-white font-medium truncate drop-shadow-sm">
                                                            {task.description.length > 30
                                                                ? task.description.substring(0, 30) + '…'
                                                                : task.description}
                                                        </span>
                                                        {position.width > 80 && (
                                                            <span className="text-[11px] text-white/90 font-medium shrink-0 drop-shadow-sm">
                                                                {new Date(task.deadline!).toLocaleDateString(
                                                                    'en-US',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    },
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 bg-muted/30 border-t border-border">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Status
                    </span>
                    <div className="flex items-center gap-3">
                        {Object.entries(statusStyles).map(([key, style]) => (
                            <span key={key} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-md ${style.bg}`} />
                                <span className="text-xs text-muted-foreground">
                                    {style.text}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Priority
                    </span>
                    <div className="flex items-center gap-3">
                        {Object.entries(priorityStyles).map(([key, style]) => (
                            <span key={key} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                <span className="text-xs text-muted-foreground">
                                    {style.label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* CSS for shimmer animation */}
            <style>{`
        @keyframes gantt-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: gantt-shimmer 2s infinite;
        }
      `}</style>

            {/* Click info box rendered via portal (not clipped by overflow) */}
            {popover && (
                <TaskPopover
                    state={popover}
                    onClose={() => {
                        setPopover(null);
                        setSelectedTaskId(null);
                    }}
                />
            )}
        </div>
    );
}

/**
 * Renders the info box into document.body so it is not clipped
 * by the Gantt chart's overflow/scroll containers.
 */
function TaskPopover({
    state,
    onClose,
}: {
    state: PopoverState;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!state) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleScroll = () => {
            // Close on any scroll so the popover doesn't get out of sync with its anchor
            onClose();
        };

        window.addEventListener('keydown', handleKey);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [state, onClose]);

    if (!mounted || !state) return null;
    if (typeof document === 'undefined') return null;

    const { task, anchor } = state;
    const status = statusStyles[task.status] || statusStyles.pending;
    const priority = priorityStyles[task.priority] || priorityStyles.medium;

    // Position below the clicked bar; you can flip to above by using anchor.top
    const top = anchor.bottom + 8;
    const left = anchor.left + anchor.width / 2;

    return createPortal(
        <div className="fixed inset-0 z-[80] pointer-events-none">
            {/* click-away overlay */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onClick={onClose}
            />
            <div
                className="absolute pointer-events-auto max-w-xs sm:max-w-sm"
                style={{
                    top,
                    left,
                    transform: 'translateX(-50%)',
                }}
            >
                <div className="rounded-xl border border-border bg-popover text-popover-foreground shadow-xl px-3 py-2 text-xs">
                    <div className="flex items-start gap-2">
                        <span
                            className={`mt-0.5 w-2.5 h-2.5 rounded-full ${priority.dot}`}
                        />
                        <div>
                            <div className="text-sm font-semibold leading-snug break-words">
                                {task.description}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>
                                    Status:{' '}
                                    <span className="font-medium">{status.text}</span>
                                </span>
                                <span>•</span>
                                <span>
                                    Priority:{' '}
                                    <span className="font-medium">{priority.label}</span>
                                </span>
                                {task.assigneeName && (
                                    <>
                                        <span>•</span>
                                        <span>Assignee: {task.assigneeName}</span>
                                    </>
                                )}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                                Due{' '}
                                {new Date(task.deadline!).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}