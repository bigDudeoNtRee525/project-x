'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, CheckCircle, AlertCircle, User } from 'lucide-react';
import type { Contact } from '@meeting-task-tool/shared';

interface BulkActionBarProps {
    selectedCount: number;
    contacts: Contact[];
    onUpdateStatus: (status: string) => void;
    onUpdatePriority: (priority: string) => void;
    onUpdateAssignee: (assigneeId: string | null) => void;
    onClearSelection: () => void;
}

export function BulkActionBar({
    selectedCount,
    contacts,
    onUpdateStatus,
    onUpdatePriority,
    onUpdateAssignee,
    onClearSelection,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                {/* Selection count */}
                <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
                    <div className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium">selected</span>
                </div>

                {/* Status dropdown */}
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <Select onValueChange={onUpdateStatus}>
                        <SelectTrigger className="w-[130px] bg-gray-800 border-gray-700 text-white text-sm h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Priority dropdown */}
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <Select onValueChange={onUpdatePriority}>
                        <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white text-sm h-9">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignee dropdown */}
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <Select onValueChange={(value) => onUpdateAssignee(value === 'unassigned' ? null : value)}>
                        <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white text-sm h-9">
                            <SelectValue placeholder="Assign to" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                    {contact.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear selection button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="text-gray-400 hover:text-white hover:bg-gray-800 ml-2"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            </div>
        </div>
    );
}
