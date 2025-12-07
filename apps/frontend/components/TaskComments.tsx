'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export interface TaskComment {
    id: string;
    text: string;
    author: string;
    createdAt: Date;
}

interface TaskCommentsProps {
    comments: TaskComment[];
    onAddComment: (text: string) => void;
    onDeleteComment: (id: string) => void;
}

export function TaskComments({ comments, onAddComment, onDeleteComment }: TaskCommentsProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        onAddComment(newComment.trim());
        setNewComment('');
        setIsAdding(false);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Comments</span>
                    {comments.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {comments.length}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Comments list */}
                    {comments.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                            No comments yet. Add a note to provide context.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="bg-gray-50 rounded-lg p-3 group relative"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.text}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {comment.author} • {formatDate(comment.createdAt)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteComment(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add comment form */}
                    {isAdding ? (
                        <div className="space-y-2">
                            <Textarea
                                placeholder="Add a note or update..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[80px] text-sm"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewComment('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    Add Comment
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Note
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
