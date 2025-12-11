'use client';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Status options and styling
const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
    in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
    cancelled: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
};

// Priority options and styling
const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const priorityStyles: Record<string, string> = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
    urgent: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
};

interface InlineSelectProps {
    type: 'status' | 'priority';
    value: string;
    taskId: string;
    onUpdate: (taskId: string, field: string, value: string) => Promise<void>;
}

export function InlineTaskSelect({ type, value, taskId, onUpdate }: InlineSelectProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const options = type === 'status' ? statusOptions : priorityOptions;
    const styles = type === 'status' ? statusStyles : priorityStyles;

    const handleChange = async (newValue: string) => {
        if (newValue === currentValue) return;

        setIsUpdating(true);
        const previousValue = currentValue;
        setCurrentValue(newValue); // Optimistic update

        try {
            await onUpdate(taskId, type, newValue);
        } catch (error) {
            console.error(`Failed to update ${type}:`, error);
            setCurrentValue(previousValue); // Rollback on error
        } finally {
            setIsUpdating(false);
        }
    };

    const currentLabel = options.find(o => o.value === currentValue)?.label || currentValue;

    return (
        <Select value={currentValue} onValueChange={handleChange} disabled={isUpdating}>
            <SelectTrigger
                className={cn(
                    'h-auto w-auto px-2 py-1 rounded-full text-xs font-medium border gap-1',
                    'focus:ring-0 focus:ring-offset-0 [&>svg]:hidden',
                    styles[currentValue] || styles[Object.keys(styles)[0]]
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <SelectValue>{currentLabel}</SelectValue>
                )}
            </SelectTrigger>
            <SelectContent onClick={(e) => e.stopPropagation()}>
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-xs"
                    >
                        <span className={cn(
                            'px-2 py-0.5 rounded-full border',
                            styles[option.value]
                        )}>
                            {option.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
