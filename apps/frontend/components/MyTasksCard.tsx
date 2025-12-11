'use client';

import { cn } from '@/lib/utils';
import { Play, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TaskStat {
  label: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'orange' | 'green';
  onClick: () => void;
}

interface MyTasksCardProps {
  inProgress: number;
  overdue: number;
  dueToday: number;
  completed: number;
  onStatClick: (type: 'inProgress' | 'overdue' | 'dueToday' | 'completed') => void;
}

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
  green: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
};

export function MyTasksCard({
  inProgress,
  overdue,
  dueToday,
  completed,
  onStatClick,
}: MyTasksCardProps) {
  const stats: TaskStat[] = [
    {
      label: 'In Progress',
      count: inProgress,
      icon: Play,
      color: 'blue',
      onClick: () => onStatClick('inProgress'),
    },
    {
      label: 'Overdue',
      count: overdue,
      icon: AlertTriangle,
      color: 'red',
      onClick: () => onStatClick('overdue'),
    },
    {
      label: 'Due Today',
      count: dueToday,
      icon: Calendar,
      color: 'orange',
      onClick: () => onStatClick('dueToday'),
    },
    {
      label: 'Completed',
      count: completed,
      icon: CheckCircle,
      color: 'green',
      onClick: () => onStatClick('completed'),
    },
  ];

  return (
    <div className="flex gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer',
              colorClasses[stat.color]
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-lg font-bold">{stat.count}</span>
            <span className="text-xs opacity-80">{stat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
