'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TaskWithRelations } from '@meeting-task-tool/shared';
import { format } from 'date-fns';
import { Play, AlertTriangle, Calendar, CheckCircle, LucideIcon } from 'lucide-react';

export type MyTasksFilterType = 'inProgress' | 'overdue' | 'dueToday' | 'completed';

interface MyTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: MyTasksFilterType;
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
}

const filterConfig: Record<MyTasksFilterType, { title: string; icon: LucideIcon; color: string }> = {
  inProgress: { title: 'In Progress', icon: Play, color: 'text-blue-500 bg-blue-500/10' },
  overdue: { title: 'Overdue Tasks', icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  dueToday: { title: 'Due Today', icon: Calendar, color: 'text-orange-500 bg-orange-500/10' },
  completed: { title: 'Completed Tasks', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function MyTasksModal({
  open,
  onOpenChange,
  filterType,
  tasks,
  onTaskClick,
}: MyTasksModalProps) {
  const config = filterConfig[filterType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center`}>
              <Icon className="h-4 w-4" />
            </div>
            <span>{config.title}</span>
            <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
              {tasks.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-3 py-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks in this category.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="space-y-1 flex-1 mr-4">
                    <p className="text-sm font-medium leading-none">
                      {task.title || task.description}
                    </p>
                    {task.title && task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    {task.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        statusColors[task.status] || statusColors.pending
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        priorityColors[task.priority] || priorityColors.medium
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
