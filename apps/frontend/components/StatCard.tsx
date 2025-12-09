import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { GlassIcon } from '@/components/ui/glass-icon';

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
    onIconClick?: () => void;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    color = 'primary',
    className,
    onIconClick,
}: StatCardProps) {
    // Map legacy colors to GlassIcon variants
    const variantMap: Record<string, "gold" | "green" | "blue" | "purple" | "orange"> = {
        primary: 'gold',
        success: 'green',
        blue: 'blue',
        purple: 'purple',
        orange: 'orange',
    };

    const variant = variantMap[color] || 'gold';

    return (
        <Card className={cn('border border-border bg-card', className)}>
            <CardContent className="pt-5">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    <div
                        onClick={onIconClick}
                        className={onIconClick ? 'cursor-pointer transition-transform hover:scale-110' : ''}
                    >
                        <GlassIcon variant={variant}>
                            <Icon className="h-4 w-4" />
                        </GlassIcon>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-[28px] font-bold text-white mb-1">{value}</div>
                    {(trend || description) && (
                        <div className="flex items-center text-xs font-semibold">
                            {trend && (
                                <span
                                    className={cn(
                                        'flex items-center gap-1 mr-1',
                                        trend.positive ? 'text-[#22c55e]' : 'text-[#ef4444]'
                                    )}
                                >
                                    {trend.positive ? '↗' : '↘'} {Math.abs(trend.value)}%
                                </span>
                            )}
                            <span className="text-muted-foreground">
                                {description || trend?.label}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
