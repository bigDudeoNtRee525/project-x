'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { meetingsApi } from '@/lib/api';
import { Plus, RefreshCw } from 'lucide-react';
import { MeetingUploadModal } from '@/components/MeetingUploadModal';
import { MeetingsCalendar } from '@/components/MeetingsCalendar';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import type { MeetingWithCount } from '@meeting-task-tool/shared';

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<MeetingWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [deletingMeeting, setDeletingMeeting] = useState<MeetingWithCount | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadMeetings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await meetingsApi.list();
            setMeetings((response as any).meetings || []);
        } catch (err: any) {
            setError(err?.error || 'Failed to load meetings');
            setMeetings([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDeleteClick = (e: React.MouseEvent, meeting: MeetingWithCount) => {
        e.preventDefault();
        setDeletingMeeting(meeting);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMeeting) return;

        const meetingToDelete = deletingMeeting;
        const previousMeetings = [...meetings];

        setIsDeleting(true);
        // Optimistic update
        setMeetings(prev => prev.filter(m => m.id !== meetingToDelete.id));
        setDeletingMeeting(null);

        try {
            await meetingsApi.delete(meetingToDelete.id);
            toast.success('Meeting deleted successfully');
        } catch (err) {
            console.error('Failed to delete meeting:', err);
            // Rollback on error
            setMeetings(previousMeetings);
            toast.error('Failed to delete meeting');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        loadMeetings();
    }, [loadMeetings]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
                    <p className="text-muted-foreground mt-1">View uploaded meeting transcripts and their extracted tasks</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={loadMeetings} disabled={isLoading} className="flex items-center space-x-1 border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </Button>
                    <Button onClick={() => setUploadModalOpen(true)} className="flex items-center space-x-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        <span>Upload Meeting</span>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="text-center py-24">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={loadMeetings} variant="outline" className="mt-4">
                        Try Again
                    </Button>
                </div>
            ) : (
                <MeetingsCalendar meetings={meetings} onDelete={(e, id) => {
                    const meeting = meetings.find(m => m.id === id);
                    if (meeting) handleDeleteClick(e, meeting);
                }} />
            )}

            <DeleteConfirmDialog
                open={!!deletingMeeting}
                onOpenChange={(open) => !open && setDeletingMeeting(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Meeting"
                description={`Are you sure you want to delete "${deletingMeeting?.title}"? This will also delete all tasks extracted from this meeting.`}
                isLoading={isDeleting}
            />

            <MeetingUploadModal
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
                onSuccess={loadMeetings}
            />
        </div>
    );
}
