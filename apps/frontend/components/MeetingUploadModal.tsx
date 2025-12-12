'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { meetingsApi } from '@/lib/api';
import { toast } from 'sonner';

const MAX_TRANSCRIPT_LENGTH = 100000; // ~100k characters

const meetingSchema = z.object({
    title: z.string().min(1, 'Title is required').max(500, 'Title must be less than 500 characters'),
    transcript: z.string()
        .min(1, 'Transcript is required')
        .max(MAX_TRANSCRIPT_LENGTH, `Transcript must be less than ${MAX_TRANSCRIPT_LENGTH.toLocaleString()} characters`),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function MeetingUploadModal({
    open,
    onOpenChange,
    onSuccess,
}: MeetingUploadModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<MeetingFormValues>({
        resolver: zodResolver(meetingSchema as any),
        defaultValues: {
            title: '',
            transcript: '',
        },
    });

    const onSubmit = async (data: MeetingFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await meetingsApi.create(data);
            form.reset();
            onOpenChange(false);
            toast.success('Meeting uploaded successfully! AI is extracting tasks...');
            onSuccess?.();
        } catch (err: any) {
            setError(err?.error || 'Failed to create meeting');
            toast.error(err?.error || 'Failed to upload meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    const transcriptValue = form.watch('transcript');
    const transcriptLength = transcriptValue?.length || 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload Meeting Transcript</DialogTitle>
                    <DialogDescription>
                        Paste your meeting transcript below. AI will extract action items automatically.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Weekly Team Sync - Dec 5" disabled={isSubmitting} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="transcript"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transcript</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Paste your meeting notes or transcript here..."
                                            className="min-h-[200px]"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <FormMessage />
                                        <span className={transcriptLength > MAX_TRANSCRIPT_LENGTH ? 'text-red-500' : ''}>
                                            {transcriptLength.toLocaleString()} / {MAX_TRANSCRIPT_LENGTH.toLocaleString()}
                                        </span>
                                    </div>
                                </FormItem>
                            )}
                        />
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Uploading...' : 'Upload Meeting'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
