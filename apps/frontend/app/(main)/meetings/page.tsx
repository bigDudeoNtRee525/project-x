'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { meetingsApi } from '@/lib/api';
import { Plus, RefreshCw, FileText, Clock, CheckCircle, XCircle, Calendar, X, Trash2 } from 'lucide-react';
import { MeetingUploadModal } from '@/components/MeetingUploadModal';
import { SearchInput } from '@/components/SearchInput';
import type { MeetingWithCount } from '@meeting-task-tool/shared';

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<MeetingWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this meeting?')) return;

        try {
            await meetingsApi.delete(id);
            // Optimistic update
            setMeetings(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Failed to delete meeting:', err);
            alert('Failed to delete meeting');
        }
    };

    useEffect(() => {
        loadMeetings();
    }, [loadMeetings]);

    // Filter meetings based on search and date range
    const filteredMeetings = useMemo(() => {
        return meetings.filter((meeting) => {
            // Text search - match title or transcript
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = meeting.title.toLowerCase().includes(query);
                const transcriptMatch = meeting.transcript?.toLowerCase().includes(query);
                if (!titleMatch && !transcriptMatch) return false;
            }

            // Date range filter
            if (dateFrom) {
                const meetingDate = new Date(meeting.createdAt);
                const fromDate = new Date(dateFrom);
                if (meetingDate < fromDate) return false;
            }

            if (dateTo) {
                const meetingDate = new Date(meeting.createdAt);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999); // End of day
                if (meetingDate > toDate) return false;
            }

            return true;
        });
    }, [meetings, searchQuery, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = searchQuery || dateFrom || dateTo;

    // Highlight matching text in search results
    const highlightText = (text: string, maxLength: number = 150) => {
        if (!searchQuery || !text) return null;

        const query = searchQuery.toLowerCase();
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(query);

        if (index === -1) return null;

        // Get surrounding context
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + searchQuery.length + 50);

        const before = (start > 0 ? '...' : '') + text.slice(start, index);
        const match = text.slice(index, index + searchQuery.length);
        const after = text.slice(index + searchQuery.length, end) + (end < text.length ? '...' : '');

        return (
            <span className="text-sm text-muted-foreground mt-2 block">
                {before}
                <mark className="bg-primary/20 text-primary px-0.5 rounded">{match}</mark>
                {after}
            </span>
        );
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-8">
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

            {/* Search and Filter Bar */}
            <Card className="border-none bg-card shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <SearchInput
                            placeholder="Search meetings by title or content..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="flex-1 bg-input border-border text-foreground"
                        />
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-[140px] bg-input border-border text-foreground"
                                    placeholder="From"
                                />
                                <span className="text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-[140px] bg-input border-border text-foreground"
                                    placeholder="To"
                                />
                            </div>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <p className="text-sm text-muted-foreground mt-3">
                            Showing {filteredMeetings.length} of {meetings.length} meetings
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-sm">
                <CardHeader>
                    <CardTitle>Your Meetings</CardTitle>
                    <CardDescription>All uploaded meeting transcripts</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                            <Button onClick={loadMeetings} variant="outline" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    ) : filteredMeetings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {meetings.length === 0 ? (
                                <>
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                    <p className="mt-4">No meetings yet. Upload a transcript to get started!</p>
                                    <Button onClick={() => setUploadModalOpen(true)} className="mt-4 bg-primary text-primary-foreground">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload Your First Meeting
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                    <p className="mt-4">No meetings match your search.</p>
                                    <Button onClick={clearFilters} variant="outline" className="mt-4 border-border text-muted-foreground hover:text-foreground">
                                        Clear Filters
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredMeetings.map((meeting) => (
                                <Link href={`/meetings/${meeting.id}`} key={meeting.id}>
                                    <Card className="bg-card hover:bg-accent/50 transition-colors cursor-pointer border-border">
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-foreground text-lg">{meeting.title}</h3>
                                                    {/* Show transcript snippet with highlighted search term */}
                                                    {searchQuery && meeting.transcript && (
                                                        highlightText(meeting.transcript)
                                                    )}
                                                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            <span>{formatDate(meeting.createdAt)}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            {meeting.processed ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                                                    <span className="text-green-500">Processed</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-4 w-4 mr-1 text-yellow-500" />
                                                                    <span className="text-yellow-500">Pending</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end justify-between h-full">
                                                    <div>
                                                        <div className="text-2xl font-bold text-foreground">{meeting._count?.tasks || 0}</div>
                                                        <div className="text-sm text-muted-foreground">tasks</div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 mt-2"
                                                        onClick={(e) => handleDelete(e, meeting.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <MeetingUploadModal
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
                onSuccess={loadMeetings}
            />
        </div>
    );
}
