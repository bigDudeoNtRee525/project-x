'use client';

import { cn } from '@/lib/utils';
import type { ContactWithStats, TeamStatFilter } from '@meeting-task-tool/shared';
import md5 from 'md5';
import { useState } from 'react';

interface TeamStatusCardProps {
  contact: ContactWithStats;
  onNameClick: () => void;
  onStatClick: (filter: TeamStatFilter) => void;
}

export function TeamStatusCard({ contact, onNameClick, onStatClick }: TeamStatusCardProps) {
  const [imgError, setImgError] = useState(false);

  const gravatarUrl = contact.email && !imgError
    ? `https://www.gravatar.com/avatar/${md5(contact.email.toLowerCase().trim())}?d=404&s=80`
    : null;

  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
      {/* Avatar */}
      <div
        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={onNameClick}
      >
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

      {/* Name and Role */}
      <div
        className="flex-1 min-w-0 cursor-pointer group"
        onClick={onNameClick}
      >
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {contact.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {contact.role && <span className="truncate">{contact.role}</span>}
          {contact.role && <span>·</span>}
          <span>{contact.stats.deliveryRate}% delivery</span>
        </div>
      </div>

      {/* Compact Stat Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <StatBadge
          count={contact.stats.inProgressCount}
          color="blue"
          title="In Progress"
          onClick={() => onStatClick('inProgress')}
        />
        <StatBadge
          count={contact.stats.backlogCount}
          color="red"
          title="Backlog"
          onClick={() => onStatClick('backlog')}
        />
        <StatBadge
          count={contact.stats.completedCount}
          color="green"
          title="Completed"
          onClick={() => onStatClick('completed')}
        />
      </div>
    </div>
  );
}

// Compact badge component
function StatBadge({
  count,
  color,
  title,
  onClick,
}: {
  count: number;
  color: 'blue' | 'red' | 'green';
  title: string;
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
    green: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={cn(
        'min-w-[28px] h-6 px-2 rounded text-xs font-semibold border transition-colors cursor-pointer',
        colorClasses[color]
      )}
    >
      {count}
    </button>
  );
}
