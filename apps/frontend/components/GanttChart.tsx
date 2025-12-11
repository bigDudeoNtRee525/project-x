'use client';

import {
    useMemo,
    useState,
    useEffect,
    useRef,
    MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface GanttChartProps {
    tasks: TaskWithRelations[];
}

// Status colors with gradient support
const statusStyles: Record<string, { bg: string; gradient: string; text: string }> = {
    pending: {
        bg: 'bg-amber-500',
        gradient: 'from-amber-500 to-amber-600',
        text: 'Pending',
    },
    in_progress: {
        bg: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        text: 'In Progress',
    },
    completed: {
        bg: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600',
        text: 'Completed',
    },
    cancelled: {
        bg: 'bg-gray-400',
        gradient: 'from-gray-400 to-gray-500',
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

    // Refs for scroll synchronization
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const taskScrollRef = useRef<HTMLDivElement>(null);
    const timelineScrollRef = useRef<HTMLDivElement>(null);

    // Sync scrolling between panels
    useEffect(() => {
        const timeline = timelineScrollRef.current;
        const header = headerScrollRef.current;
        const taskList = taskScrollRef.current;

        if (!timeline || !header || !taskList) return;

        let isSyncing = false;

        const handleTimelineScroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            // Sync horizontal scroll with header
            header.scrollLeft = timeline.scrollLeft;
            // Sync vertical scroll with task list
            taskList.scrollTop = timeline.scrollTop;
            isSyncing = false;
        };

        const handleTaskScroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            timeline.scrollTop = taskList.scrollTop;
            isSyncing = false;
        };

        const handleHeaderScroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            timeline.scrollLeft = header.scrollLeft;
            isSyncing = false;
        };

        timeline.addEventListener('scroll', handleTimelineScroll);
        taskList.addEventListener('scroll', handleTaskScroll);
        header.addEventListener('scroll', handleHeaderScroll);

        return () => {
            timeline.removeEventListener('scroll', handleTimelineScroll);
            taskList.removeEventListener('scroll', handleTaskScroll);
            header.removeEventListener('scroll', handleHeaderScroll);
        };
    }, []);

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
            end.setDate(end.getDate() + 14);
        } else {
            const dates = tasksWithDeadlines.map((t) => new Date(t.deadline!));
            const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

            // Start a bit before the earliest deadline
            start = new Date(Math.min(minDate.getTime(), now.getTime()));
            start.setDate(start.getDate() - 14); // 2 weeks before

            // End a bit after the latest deadline
            end = new Date(Math.max(maxDate.getTime(), now.getTime()));
            end.setDate(end.getDate() + 7); // 1 week after
        }

        // Normalize times
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Align start to clean boundaries based on view
        if (viewMode === 'week') {
            // Start of week (Sunday)
            start.setDate(start.getDate() - start.getDay());
        } else if (viewMode === 'month') {
            // Start of the week containing the start date
            start.setDate(start.getDate() - start.getDay());
        } else {
            // Quarter: start of month
            start.setDate(1);
        }

        const diffMs = end.getTime() - start.getTime();
        const days = Math.max(14, Math.ceil(diffMs / DAY_MS)); // minimum 2 weeks

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
            while (current <= end) {
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
            while (current <= end) {
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

        if (endTime <= startTime) {
            return { left: 0, width: 80 };
        }

        // Parse the deadline and normalize to local midnight
        // This handles ISO strings that might be in UTC
        const deadlineDate = new Date(deadline);
        const localDeadline = new Date(
            deadlineDate.getFullYear(),
            deadlineDate.getMonth(),
            deadlineDate.getDate(),
            0, 0, 0, 0
        );
        const deadlineTime = localDeadline.getTime();

        // Bar width in days (visual representation - bar ENDS at deadline)
        const barDurationDays = viewMode === 'week' ? 3 : viewMode === 'month' ? 7 : 21;

        // Calculate where the deadline falls in our timeline (in days from start)
        // Add 1 to include the deadline day itself in the visual
        const deadlineDayIndex = (deadlineTime - startTime) / DAY_MS + 1;

        // Bar ends at deadline, starts barDurationDays before
        const barStartDayIndex = Math.max(0, deadlineDayIndex - barDurationDays);
        const barEndDayIndex = deadlineDayIndex;

        // If deadline is before visible range, don't show
        if (barEndDayIndex <= 0) {
            return { left: 0, width: 0 };
        }

        const left = barStartDayIndex * dayWidth;
        const width = Math.max((barEndDayIndex - barStartDayIndex) * dayWidth, 80);

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

            {/* Main content with synced scrolling */}
            <div className="flex">
                {/* Left column: Task header + Task list */}
                <div className="w-64 shrink-0 border-r border-border flex flex-col">
                    {/* Task header */}
                    <div className="h-12 px-4 flex items-center bg-muted/50 border-b border-border">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Task
                        </span>
                    </div>
                    {/* Task list - synced vertical scroll */}
                    <div ref={taskScrollRef} className="flex-1 overflow-y-auto scrollbar-hide" style={{ maxHeight: 400 }}>
                        <div style={{ height: tasksWithDeadlines.length * ROW_HEIGHT }}>
                            {tasksWithDeadlines.map((task) => {
                                const isHovered = hoveredTask === task.id;
                                const isSelected = selectedTaskId === task.id;
                                const status = statusStyles[task.status] || statusStyles.pending;
                                const priority = priorityStyles[task.priority] || priorityStyles.medium;

                                return (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-3 px-4 text-sm transition-colors border-b border-border/30 ${isSelected ? 'bg-muted/80' : isHovered ? 'bg-muted/50' : ''}`}
                                        style={{ height: ROW_HEIGHT }}
                                        onMouseEnter={() => setHoveredTask(task.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${priority.dot} shrink-0`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-card-foreground truncate text-sm">
                                                {task.description}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                    task.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600' :
                                                    task.status === 'in_progress' ? 'bg-blue-500/15 text-blue-600' :
                                                    task.status === 'cancelled' ? 'bg-gray-500/15 text-gray-500' :
                                                    'bg-amber-500/15 text-amber-600'
                                                }`}>
                                                    {status.text}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(task.deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right column: Timeline header + Timeline grid */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Timeline header - synced horizontal scroll */}
                    <div ref={headerScrollRef} className="h-12 overflow-x-auto scrollbar-hide bg-muted/50 border-b border-border">
                        <div className="relative h-full" style={{ width: chartWidth }}>
                            {timeUnits.map((unit, idx) => (
                                <div
                                    key={idx}
                                    className="absolute top-0 h-full flex flex-col justify-center border-l border-border/50 pl-2"
                                    style={{ left: unit.startDayIndex * dayWidth }}
                                >
                                    <div className="text-xs font-medium text-card-foreground whitespace-nowrap">
                                        {unit.label}
                                    </div>
                                    {unit.subLabel && (
                                        <div className="text-[10px] text-muted-foreground">
                                            {unit.subLabel}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline grid - main scroll area */}
                    <div ref={timelineScrollRef} className="flex-1 overflow-auto" style={{ maxHeight: 400 }}>
                        <div className="relative" style={{ width: chartWidth, height: Math.max(tasksWithDeadlines.length * ROW_HEIGHT, 200) }}>
                            {/* Vertical grid lines at each time unit */}
                            {timeUnits.map((unit, idx) => (
                                <div
                                    key={idx}
                                    className="absolute top-0 bottom-0 border-l border-border/30"
                                    style={{ left: unit.startDayIndex * dayWidth }}
                                />
                            ))}

                            {/* Horizontal row lines */}
                            {tasksWithDeadlines.map((_, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className="absolute left-0 right-0 border-b border-border/30"
                                    style={{ top: (rowIndex + 1) * ROW_HEIGHT }}
                                />
                            ))}

                            {/* Today marker */}
                            {todayIndex !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                    style={{ left: todayIndex * dayWidth }}
                                >
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                                </div>
                            )}

                            {/* Task bars */}
                            {tasksWithDeadlines.map((task, rowIndex) => {
                                const position = getTaskPositionPx(new Date(task.deadline!));
                                const isHovered = hoveredTask === task.id;
                                const isSelected = selectedTaskId === task.id;
                                const status = statusStyles[task.status] || statusStyles.pending;
                                const priority = priorityStyles[task.priority] || priorityStyles.medium;
                                const top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;

                                if (position.width === 0) return null;

                                return (
                                    <div
                                        key={task.id}
                                        className="absolute cursor-pointer transition-all duration-150"
                                        style={{ top, left: position.left, width: position.width, height: BAR_HEIGHT }}
                                        onMouseEnter={() => setHoveredTask(task.id)}
                                        onMouseLeave={() => setHoveredTask(null)}
                                        onClick={(e) => handleTaskClick(task, e)}
                                    >
                                        <div className={`relative h-full rounded-md bg-gradient-to-r ${status.gradient} shadow-sm transition-all duration-150 ${
                                            isHovered || isSelected ? `scale-[1.03] ring-2 ring-offset-1 ring-offset-card ${priority.ring} shadow-md` : ''
                                        }`}>
                                            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                                            {task.status === 'in_progress' && (
                                                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
                                                </div>
                                            )}
                                            <div className="relative h-full flex items-center px-2 gap-1 overflow-hidden">
                                                <span className="text-[11px] text-white font-medium truncate drop-shadow-sm">
                                                    {task.description}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* CSS for shimmer animation and scrollbar hiding */}
            <style>{`
        @keyframes gantt-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: gantt-shimmer 2s infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
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
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate position after render to measure actual popover size
    useEffect(() => {
        if (!mounted || !state || !popoverRef.current) return;

        const updatePosition = () => {
            const popover = popoverRef.current;
            if (!popover) return;

            const { anchor } = state;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const popoverRect = popover.getBoundingClientRect();
            const popoverHeight = popoverRect.height;
            const popoverWidth = popoverRect.width;
            const gap = 12;

            // Determine vertical placement
            const spaceBelow = viewportHeight - anchor.bottom - gap;
            const spaceAbove = anchor.top - gap;

            let top: number;

            if (spaceBelow >= popoverHeight) {
                // Enough space below
                top = anchor.bottom + gap;
            } else if (spaceAbove >= popoverHeight) {
                // Place above
                top = anchor.top - gap - popoverHeight;
            } else {
                // Not enough space either way - position to maximize visibility
                if (spaceBelow >= spaceAbove) {
                    // More space below, align to bottom of viewport
                    top = viewportHeight - popoverHeight - gap;
                } else {
                    // More space above, align to top of viewport
                    top = gap;
                }
            }

            // Final clamp to viewport
            top = Math.max(gap, Math.min(top, viewportHeight - popoverHeight - gap));

            // Calculate horizontal position (centered on bar, but clamped to viewport)
            let left = anchor.left + anchor.width / 2;
            const halfPopover = popoverWidth / 2;

            // Clamp to keep popover within viewport
            left = Math.max(halfPopover + gap, Math.min(left, viewportWidth - halfPopover - gap));

            setPosition({ top, left });
        };

        // Use requestAnimationFrame to ensure DOM has rendered
        requestAnimationFrame(updatePosition);
    }, [mounted, state]);

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

    const { task } = state;
    const status = statusStyles[task.status] || statusStyles.pending;
    const priority = priorityStyles[task.priority] || priorityStyles.medium;

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* click-away overlay */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onClick={onClose}
            />
            <div
                ref={popoverRef}
                className="absolute pointer-events-auto w-[320px]"
                style={{
                    top: position?.top ?? -9999,
                    left: position?.left ?? -9999,
                    transform: 'translateX(-50%)',
                    visibility: position ? 'visible' : 'hidden',
                }}
            >
                <div className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl px-4 py-3 text-xs">
                    <div className="flex items-start gap-2">
                        <span
                            className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${priority.dot}`}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold leading-snug break-words">
                                {task.description}
                            </div>
                            <div className="mt-2 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>
                                    Status:{' '}
                                    <span className="font-medium">{status.text}</span>
                                </span>
                                <span>•</span>
                                <span>
                                    Priority:{' '}
                                    <span className="font-medium">{priority.label}</span>
                                </span>
                                {task.assignees && task.assignees.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>Assignee: {task.assignees.map(a => a.name).join(', ')}</span>
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