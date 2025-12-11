'use client';

import { cn } from '@/lib/utils';
import type { ContactWithStats } from '@meeting-task-tool/shared';
import md5 from 'md5';
import { useState } from 'react';

interface TeamMemberTileProps {
  contact: ContactWithStats;
  onClick: () => void;
}

export function TeamMemberTile({ contact, onClick }: TeamMemberTileProps) {
  const [imgError, setImgError] = useState(false);

  const gravatarUrl = contact.email && !imgError
    ? `https://www.gravatar.com/avatar/${md5(contact.email.toLowerCase().trim())}?d=404&s=64`
    : null;

  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Determine status color based on workload
  const hasOverdue = contact.stats.backlogCount > 0;
  const isBusy = contact.stats.inProgressCount >= 3;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-3 rounded-xl border border-border bg-card',
        'hover:bg-accent/50 transition-all cursor-pointer',
        'min-w-[80px]'
      )}
    >
      {/* Avatar with status ring */}
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center overflow-hidden mb-2',
        'ring-2 ring-offset-2 ring-offset-background',
        hasOverdue ? 'ring-red-500' : isBusy ? 'ring-orange-500' : 'ring-green-500',
        'bg-muted'
      )}>
        {gravatarUrl ? (
          <img
            src={gravatarUrl}
            alt={contact.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{initials}</span>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-medium truncate max-w-full">
        {contact.name.split(' ')[0]}
      </span>

      {/* Task count indicator */}
      <span className="text-[10px] text-muted-foreground">
        {contact.stats.inProgressCount + contact.stats.backlogCount} tasks
      </span>
    </button>
  );
}
