'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { X, CheckCircle, AlertCircle, Users } from 'lucide-react';
import type { Contact } from '@meeting-task-tool/shared';

interface BulkActionBarProps {
    selectedCount: number;
    contacts: Contact[];
    onUpdateStatus: (status: string) => void;
    onUpdatePriority: (priority: string) => void;
    onUpdateAssignees: (assigneeIds: string[]) => void;
    onClearSelection: () => void;
}

export function BulkActionBar({
    selectedCount,
    contacts,
    onUpdateStatus,
    onUpdatePriority,
    onUpdateAssignees,
    onClearSelection,
}: BulkActionBarProps) {
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

    const handleAssigneesChange = (ids: string[]) => {
        setSelectedAssignees(ids);
    };

    const handleApplyAssignees = () => {
        onUpdateAssignees(selectedAssignees);
        setSelectedAssignees([]);
    };

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-popover text-popover-foreground rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 border border-border">
                {/* Selection count */}
                <div className="flex items-center gap-2 pr-4 border-r border-border">
                    <div className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium">selected</span>
                </div>

                {/* Status dropdown */}
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={onUpdateStatus}>
                        <SelectTrigger className="w-[130px] bg-muted border-input text-foreground text-sm h-9">
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
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={onUpdatePriority}>
                        <SelectTrigger className="w-[120px] bg-muted border-input text-foreground text-sm h-9">
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

                {/* Assignees multi-select */}
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="w-[180px]">
                        <MultiSelect
                            options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                            selected={selectedAssignees}
                            onChange={handleAssigneesChange}
                            placeholder="Assign to..."
                            className="bg-muted border-input text-sm h-9"
                        />
                    </div>
                    {selectedAssignees.length > 0 && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleApplyAssignees}
                            className="h-9"
                        >
                            Apply
                        </Button>
                    )}
                </div>

                {/* Clear selection button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted ml-2"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            </div>
        </div>
    );
}

