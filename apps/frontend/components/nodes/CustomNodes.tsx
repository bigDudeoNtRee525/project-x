import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, Folder, CheckSquare, Calendar, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NodeHandle = ({ type, position, id }: { type: 'source' | 'target'; position: Position; id?: string }) => (
    <Handle
        type={type}
        position={position}
        id={id}
        className="!w-2 !h-2 !bg-muted-foreground !border-2 !border-background"
    />
);

export const GoalNode = memo(({ data }: { data: { title: string; type: 'YEARLY' | 'QUARTERLY'; label: string; onEdit?: () => void; onDelete?: () => void } }) => {
    const isYearly = data.type === 'YEARLY';

    return (
        <div className={cn(
            "w-[300px] rounded-xl shadow-lg border transition-all hover:shadow-xl bg-card overflow-hidden group",
            isYearly ? "border-purple-500/50 shadow-purple-900/20" : "border-blue-500/50 shadow-blue-900/20"
        )}>
            <NodeHandle type="target" position={Position.Top} />

            <div className={cn(
                "px-4 py-2 flex items-center justify-between",
                isYearly ? "bg-purple-500/10" : "bg-blue-500/10"
            )}>
                <div className="flex items-center gap-2">
                    <Target className={cn("w-4 h-4", isYearly ? "text-purple-400" : "text-blue-400")} />
                    <span className={cn("text-xs font-bold tracking-wider", isYearly ? "text-purple-400" : "text-blue-400")}>
                        {data.type} GOAL
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); data.onEdit?.(); }}
                            className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground"
                            title="Edit"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                    )}
                    {data.onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
                            className="p-1 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                <h3 className="text-sm font-bold text-foreground leading-tight">
                    {data.title}
                </h3>
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

export const CategoryNode = memo(({ data }: { data: { name: string } }) => {
    return (
        <div className="w-[260px] bg-card rounded-lg shadow-md border border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-lg transition-all">
            <NodeHandle type="target" position={Position.Top} />

            <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="font-semibold text-foreground text-sm">{data.name}</span>
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

export const TaskNode = memo(({ data }: { data: { title: string; status: string; assignee?: string } }) => {
    const statusColors: Record<string, string> = {
        pending: "bg-secondary text-muted-foreground border-border",
        in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        completed: "bg-green-500/10 text-green-400 border-green-500/20",
        cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const statusStyle = statusColors[data.status] || statusColors.pending;

    return (
        <div className="w-[280px] bg-card rounded-lg shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all group">
            <NodeHandle type="target" position={Position.Top} />

            <div className="p-3">
                <div className="flex items-start gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                    <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                        {data.title}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", statusStyle)}>
                        {data.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {data.assignee && (
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground" title={data.assignee}>
                            {data.assignee.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
