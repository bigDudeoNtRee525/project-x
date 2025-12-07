'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    description?: string;
    color?: 'primary' | 'success' | 'blue' | 'purple' | 'orange';
    className?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    color = 'primary',
    className,
}: StatCardProps) {
    const colorStyles = {
        primary: 'text-primary bg-primary/10',
        success: 'text-green-500 bg-green-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        orange: 'text-orange-500 bg-orange-500/10',
    };

    const iconColor = colorStyles[color];

    return (
        <Card className={cn('border-none bg-card shadow-sm', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={cn('p-2 rounded-full', iconColor)}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-2xl font-bold text-card-foreground">{value}</div>
                    {(trend || description) && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            {trend && (
                                <span
                                    className={cn(
                                        'mr-2 font-medium',
                                        trend.positive ? 'text-green-500' : 'text-red-500'
                                    )}
                                >
                                    {trend.positive ? '↗' : '↘'} {Math.abs(trend.value)}%
                                </span>
                            )}
                            {description || trend?.label}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
