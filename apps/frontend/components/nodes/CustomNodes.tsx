import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Target, Folder, CheckSquare, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NodeHandle = ({ type, position, id }: { type: 'source' | 'target'; position: Position; id?: string }) => (
    <Handle
        type={type}
        position={position}
        id={id}
        className="!w-2 !h-2 !bg-gray-400 !border-2 !border-white"
    />
);

export const GoalNode = memo(({ data }: { data: { title: string; type: 'YEARLY' | 'QUARTERLY'; label: string } }) => {
    const isYearly = data.type === 'YEARLY';

    return (
        <div className={cn(
            "min-w-[280px] rounded-xl shadow-lg border-2 transition-all hover:shadow-xl bg-white overflow-hidden",
            isYearly ? "border-purple-500 shadow-purple-100" : "border-blue-500 shadow-blue-100"
        )}>
            <NodeHandle type="target" position={Position.Top} />

            <div className={cn(
                "px-4 py-2 flex items-center justify-between",
                isYearly ? "bg-purple-50" : "bg-blue-50"
            )}>
                <div className="flex items-center gap-2">
                    <Target className={cn("w-4 h-4", isYearly ? "text-purple-600" : "text-blue-600")} />
                    <span className={cn("text-xs font-bold tracking-wider", isYearly ? "text-purple-700" : "text-blue-700")}>
                        {data.type} GOAL
                    </span>
                </div>
                {data.label && (
                    <span className="text-[10px] font-semibold bg-white/50 px-2 py-0.5 rounded-full text-gray-600">
                        {data.label}
                    </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {data.title}
                </h3>
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

export const CategoryNode = memo(({ data }: { data: { name: string } }) => {
    return (
        <div className="min-w-[240px] bg-white rounded-lg shadow-md border border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all">
            <NodeHandle type="target" position={Position.Top} />

            <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">{data.name}</span>
            </div>

            <NodeHandle type="source" position={Position.Bottom} />
        </div>
    );
});

export const TaskNode = memo(({ data }: { data: { title: string; status: string; assignee?: string } }) => {
    const statusColors: Record<string, string> = {
        pending: "bg-gray-100 text-gray-600 border-gray-200",
        in_progress: "bg-blue-50 text-blue-600 border-blue-200",
        completed: "bg-green-50 text-green-600 border-green-200",
        cancelled: "bg-red-50 text-red-600 border-red-200",
    };

    const statusStyle = statusColors[data.status] || statusColors.pending;

    return (
        <div className="min-w-[220px] bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group">
            <NodeHandle type="target" position={Position.Top} />

            <div className="p-3">
                <div className="flex items-start gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0 group-hover:text-blue-500 transition-colors" />
                    <p className="text-xs font-medium text-gray-700 leading-snug line-clamp-2">
                        {data.title}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border", statusStyle)}>
                        {data.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {data.assignee && (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600" title={data.assignee}>
                            {data.assignee.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
