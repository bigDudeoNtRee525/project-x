'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select items...',
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((item) => item !== value));
    };

    const selectedLabels = selected
        .map((value) => options.find((opt) => opt.value === value)?.label)
        .filter(Boolean);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between font-normal border-input shadow-sm hover:bg-accent hover:text-accent-foreground',
                        !selected.length && 'text-muted-foreground',
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                        {selected.length === 0 ? (
                            <span>{placeholder}</span>
                        ) : selected.length <= 2 ? (
                            selectedLabels.map((label, i) => (
                                <span
                                    key={selected[i]}
                                    className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs"
                                >
                                    {label}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                                        onClick={(e) => handleRemove(selected[i], e)}
                                    />
                                </span>
                            ))
                        ) : (
                            <span className="text-sm">{selected.length} selected</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-60 overflow-auto p-1">
                    {options.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.value}
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground',
                                    selected.includes(option.value) && 'bg-accent'
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <Checkbox
                                    checked={selected.includes(option.value)}
                                    className="pointer-events-none"
                                />
                                <span className="text-sm">{option.label}</span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
