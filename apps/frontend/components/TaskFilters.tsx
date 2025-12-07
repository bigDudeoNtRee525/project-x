'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import type { Contact } from '@meeting-task-tool/shared';

interface TaskFiltersProps {
    contacts: Contact[];
    filters: {
        status: string;
        priority: string;
        assigneeId: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function TaskFilters({
    contacts,
    filters,
    onFilterChange,
    onClearFilters,
}: TaskFiltersProps) {
    const hasActiveFilters =
        filters.status !== 'all' ||
        filters.priority !== 'all' ||
        filters.assigneeId !== 'all';

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <Select
                value={filters.status}
                onValueChange={(value) => onFilterChange('status', value)}
            >
                <SelectTrigger className="w-[140px] bg-background border-input">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
                value={filters.priority}
                onValueChange={(value) => onFilterChange('priority', value)}
            >
                <SelectTrigger className="w-[140px] bg-background border-input">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                </SelectContent>
            </Select>

            {/* Assignee Filter */}
            <Select
                value={filters.assigneeId}
                onValueChange={(value) => onFilterChange('assigneeId', value)}
            >
                <SelectTrigger className="w-[160px] bg-background border-input">
                    <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}
