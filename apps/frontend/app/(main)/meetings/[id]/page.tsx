'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { meetingsApi } from '@/lib/api';
import { ArrowLeft, Calendar, CheckCircle, Clock, Edit2, FileText, RefreshCw, XCircle } from 'lucide-react';
import { TaskEditModal } from '@/components/TaskEditModal';
import type { TaskWithRelations } from '@meeting-task-tool/shared';

// Status display mapping
const statusDisplay: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

// Priority display mapping
const priorityDisplay: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

interface MeetingDetail {
    id: string;
    title: string;
    transcript: string;
    processed: boolean;
    processedAt: string | null;
    createdAt: string;
    metadata?: any;
    tasks: TaskWithRelations[];
}

export default function MeetingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.id as string;

    const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
    const [isReprocessing, setIsReprocessing] = useState(false);

    const loadMeeting = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await meetingsApi.get(meetingId);
            setMeeting((response as any).meeting);
        } catch (err: any) {
            setError(err?.error || 'Failed to load meeting');
        } finally {
            setIsLoading(false);
        }
    }, [meetingId]);

    useEffect(() => {
        if (meetingId) {
            loadMeeting();
        }
    }, [meetingId, loadMeeting]);

    const handleTaskClick = (task: TaskWithRelations) => {
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    const handleReprocess = async () => {
        setIsReprocessing(true);
        // Simulate reprocessing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsReprocessing(false);
        loadMeeting();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading meeting...</p>
                </div>
            </div>
        );
    }

    if (error || !meeting) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Meeting Not Found</h2>
                <p className="mt-2 text-gray-600">{error || 'This meeting does not exist.'}</p>
                <Button onClick={() => router.push('/meetings')} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Meetings
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/meetings">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(meeting.createdAt)}
                            </span>
                            {meeting.processed ? (
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Processed
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-yellow-600">
                                    <XCircle className="h-4 w-4" />
                                    Pending
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadMeeting} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {meeting.tasks.some(t => !t.reviewed) && (
                        <Button onClick={async () => {
                            if (!confirm('Are you sure you want to confirm all tasks? They will appear in your main task list.')) return;
                            try {
                                await meetingsApi.confirmTasks(meetingId);
                                loadMeeting();
                            } catch (err) {
                                console.error('Failed to confirm tasks:', err);
                                alert('Failed to confirm tasks');
                            }
                        }} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm Tasks
                        </Button>
                    )}
                    <Button onClick={handleReprocess} disabled={isReprocessing}>
                        <FileText className={`h-4 w-4 mr-1 ${isReprocessing ? 'animate-pulse' : ''}`} />
                        {isReprocessing ? 'Processing...' : 'Reprocess'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transcript */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Transcript
                        </CardTitle>
                        <CardDescription>
                            Full meeting transcript
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                                {meeting.transcript}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Extracted Tasks */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Extracted Tasks
                        </CardTitle>
                        <CardDescription>
                            {meeting.tasks.length} task{meeting.tasks.length !== 1 ? 's' : ''} extracted from this meeting
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {meeting.tasks.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4">No tasks extracted yet.</p>
                                <Button onClick={handleReprocess} className="mt-4" disabled={isReprocessing}>
                                    {isReprocessing ? 'Processing...' : 'Process Meeting'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {meeting.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 line-clamp-2">
                                                    {task.description}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            task.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {statusDisplay[task.status]}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                                                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                            task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {priorityDisplay[task.priority]}
                                                    </span>
                                                    {!task.reviewed && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                    <span>{task.assigneeName || 'Unassigned'}</span>
                                                    {task.deadline && (
                                                        <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                e.stopPropagation();
                                                handleTaskClick(task);
                                            }}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Task Edit Modal */}
            <TaskEditModal
                task={selectedTask}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                onSuccess={loadMeeting}
            />
        </div>
    );
}
