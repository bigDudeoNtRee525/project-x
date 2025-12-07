'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Calendar, ExternalLink, CheckCircle } from 'lucide-react';
import { downloadICS, generateGoogleCalendarURL } from '@/lib/calendar';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface CalendarExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: TaskWithRelations[];
    selectedTaskIds: Set<string>;
}

export function CalendarExportModal({
    open,
    onOpenChange,
    tasks,
    selectedTaskIds,
}: CalendarExportModalProps) {
    const [downloadComplete, setDownloadComplete] = useState(false);

    const tasksWithDeadlines = tasks.filter((t) => t.deadline);
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id) && t.deadline);
    const hasSelection = selectedTaskIds.size > 0 && selectedTasks.length > 0;

    const handleDownloadAll = () => {
        downloadICS(tasksWithDeadlines, 'all-tasks.ics');
        setDownloadComplete(true);
        setTimeout(() => setDownloadComplete(false), 2000);
    };

    const handleDownloadSelected = () => {
        downloadICS(selectedTasks, 'selected-tasks.ics');
        setDownloadComplete(true);
        setTimeout(() => setDownloadComplete(false), 2000);
    };

    const handleGoogleCalendar = (task: TaskWithRelations) => {
        const url = generateGoogleCalendarURL(task);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Export to Calendar
                    </DialogTitle>
                    <DialogDescription>
                        Add task deadlines to your calendar app
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* Download ICS Section */}
                    <Card>
                        <CardContent className="pt-4">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download Calendar File (.ics)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Import into Apple Calendar, Google Calendar, Outlook, or any calendar app
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleDownloadAll}
                                    disabled={tasksWithDeadlines.length === 0}
                                    className="flex-1"
                                    variant={downloadComplete ? 'outline' : 'default'}
                                >
                                    {downloadComplete ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                            Downloaded!
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            All Tasks ({tasksWithDeadlines.length})
                                        </>
                                    )}
                                </Button>
                                {hasSelection && (
                                    <Button
                                        onClick={handleDownloadSelected}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Selected ({selectedTasks.length})
                                    </Button>
                                )}
                            </div>
                            {tasksWithDeadlines.length === 0 && (
                                <p className="text-sm text-amber-600 mt-2">
                                    No tasks have deadlines set yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Add to Google Calendar */}
                    <Card>
                        <CardContent className="pt-4">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Quick Add to Google Calendar
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Click any task to add it directly to Google Calendar
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {tasksWithDeadlines.slice(0, 10).map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleGoogleCalendar(task)}
                                        className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-800 truncate pr-2">
                                                {task.description}
                                            </span>
                                            <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Due: {new Date(task.deadline!).toLocaleDateString()}
                                        </div>
                                    </button>
                                ))}
                                {tasksWithDeadlines.length > 10 && (
                                    <p className="text-xs text-gray-400 text-center py-2">
                                        +{tasksWithDeadlines.length - 10} more tasks
                                    </p>
                                )}
                                {tasksWithDeadlines.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        No tasks with deadlines available
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
