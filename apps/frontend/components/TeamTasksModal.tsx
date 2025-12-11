'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TaskWithRelations, ContactWithStats, TeamStatFilter } from '@meeting-task-tool/shared';
import { format, differenceInDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import md5 from 'md5';

interface TeamTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactWithStats | null;
  tasks: TaskWithRelations[];
  initialFilter: TeamStatFilter;
  onTaskClick: (task: TaskWithRelations) => void;
}

const filterConfig: Record<TeamStatFilter, { label: string; color: string }> = {
  all: { label: 'All', color: 'text-foreground' },
  inProgress: { label: 'In Progress', color: 'text-blue-500' },
  backlog: { label: 'Backlog', color: 'text-red-500' },
  completed: { label: 'Completed', color: 'text-green-500' },
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

export function TeamTasksModal({
  open,
  onOpenChange,
  contact,
  tasks,
  initialFilter,
  onTaskClick,
}: TeamTasksModalProps) {
  const [filter, setFilter] = useState<TeamStatFilter>(initialFilter);
  const [imgError, setImgError] = useState(false);

  // Reset filter when initialFilter or contact changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter, contact?.id]);

  // Reset image error when contact changes
  useEffect(() => {
    setImgError(false);
  }, [contact?.id]);

  const now = useMemo(() => new Date(), []);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'inProgress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'backlog':
        return tasks.filter(t => {
          if (!t.deadline || t.status === 'completed' || t.status === 'cancelled') return false;
          return new Date(t.deadline) < now;
        });
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, filter, now]);

  const gravatarUrl = useMemo(() => {
    if (!contact?.email || imgError) return null;
    return `https://www.gravatar.com/avatar/${md5(contact.email.toLowerCase().trim())}?d=404&s=64`;
  }, [contact?.email, imgError]);

  const initials = useMemo(() => {
    if (!contact?.name) return '';
    return contact.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [contact?.name]);

  const getDaysOverdue = (deadline: Date | string | null): number | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    if (deadlineDate >= now) return null;
    return differenceInDays(now, deadlineDate);
  };

  // Early return after all hooks
  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {/* Gravatar Avatar */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {gravatarUrl ? (
                <img
                  src={gravatarUrl}
                  alt={contact.name}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-sm font-medium text-primary">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate">{contact.name}</span>
              {contact.role && (
                <span className="block text-xs font-normal text-muted-foreground truncate">
                  {contact.role}
                </span>
              )}
            </div>
            <span className="ml-auto px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground rounded-full">
              {filteredTasks.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          {(['all', 'inProgress', 'backlog', 'completed'] as TeamStatFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {filterConfig[f].label}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="flex gap-4 text-xs text-muted-foreground py-2 border-b border-border">
          <span>Delivery Rate: <span className="font-medium text-foreground">{contact.stats.deliveryRate}%</span></span>
          <span>Score: <span className="font-medium text-foreground">{contact.stats.productivityScore}</span></span>
          {contact.stats.backlogCount > 0 && (
            <span className="text-red-400">
              Avg Overdue: {contact.stats.avgBacklogDays} days
            </span>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-3 py-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks in this category.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const daysOverdue = getDaysOverdue(task.deadline);
                return (
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.deadline && (
                          <span className={daysOverdue ? 'text-red-400' : ''}>
                            {daysOverdue
                              ? `${daysOverdue} days overdue`
                              : `Due ${format(new Date(task.deadline), 'MMM d, yyyy')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
