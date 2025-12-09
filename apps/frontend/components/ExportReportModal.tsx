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
import { Input } from '@/components/ui/input';
import { FileText, Table, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportTasksToCSV, generateWeeklyReport, downloadFile } from '@/lib/exportUtils';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

interface ExportReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: TaskWithRelations[];
}

export function ExportReportModal({
    open,
    onOpenChange,
    tasks,
}: ExportReportModalProps) {
    const [reportStartDate, setReportStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
    );
    const [reportEndDate, setReportEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const handleDownloadCSV = () => {
        const csvContent = exportTasksToCSV(tasks);
        downloadFile(csvContent, `tasks-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    };

    const handleDownloadReport = () => {
        const start = new Date(reportStartDate);
        const end = new Date(reportEndDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        const reportContent = generateWeeklyReport(tasks, start, end);
        downloadFile(reportContent, `weekly-report-${reportEndDate}.md`, 'text/markdown;charset=utf-8;');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Reports & Exports
                    </DialogTitle>
                    <DialogDescription>
                        Download task data or generate progress reports
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* CSV Export */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                        <Table className="h-4 w-4 text-green-600" />
                                        Export All Data (CSV)
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Download a complete list of all tasks, statuses, and assignees in CSV format.
                                        Compatible with Excel and Google Sheets.
                                    </p>
                                </div>
                                <Button onClick={handleDownloadCSV} variant="outline" size="sm" className="shrink-0">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CSV
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Report */}
                    <Card>
                        <CardContent className="pt-4">
                            <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Weekly Progress Report
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Generate a markdown summary of completed tasks, in-progress work, and upcoming deadlines.
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="grid gap-1.5 flex-1">
                                    <label className="text-xs font-medium text-gray-500">From</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal border-input shadow-sm h-8",
                                                    !reportStartDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {reportStartDate ? format(new Date(reportStartDate), "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 shadow-lg rounded-xl border-border/50" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={reportStartDate ? new Date(reportStartDate) : undefined}
                                                onSelect={(date) => setReportStartDate(date ? date.toISOString().split('T')[0] : '')}
                                                initialFocus
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={new Date().getFullYear() + 1}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-1.5 flex-1">
                                    <label className="text-xs font-medium text-gray-500">To</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal border-input shadow-sm h-8",
                                                    !reportEndDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {reportEndDate ? format(new Date(reportEndDate), "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 shadow-lg rounded-xl border-border/50" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={reportEndDate ? new Date(reportEndDate) : undefined}
                                                onSelect={(date) => setReportEndDate(date ? date.toISOString().split('T')[0] : '')}
                                                initialFocus
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={new Date().getFullYear() + 1}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <Button onClick={handleDownloadReport} className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Generate Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
