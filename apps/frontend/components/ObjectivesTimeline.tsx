'use client';

import { useState } from 'react';
import type { YearlyObjective } from '@/lib/mockData';

interface ObjectivesTimelineProps {
    objectives: YearlyObjective[];
    year: number;
    currentQuarter: number;
    onObjectiveClick?: (objective: YearlyObjective) => void;
}

// Category colors for objective bars
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    growth: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-700' },
    product: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-700' },
    team: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-green-700' },
    operations: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-orange-700' },
    revenue: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700' },
};

// Status indicator colors
const statusColors: Record<string, string> = {
    'on-track': 'bg-green-400',
    'at-risk': 'bg-yellow-400',
    'behind': 'bg-red-400',
    'completed': 'bg-blue-400',
};

export function ObjectivesTimeline({
    objectives,
    year,
    currentQuarter,
    onObjectiveClick,
}: ObjectivesTimelineProps) {
    const [hoveredObjective, setHoveredObjective] = useState<string | null>(null);

    // Calculate the start and end quarters for each objective
    const getQuarterRange = (objective: YearlyObjective) => {
        const quarters = objective.quarterlyObjectives.map(q => q.quarter);
        if (quarters.length === 0) return { start: 1, end: 4 };
        return {
            start: Math.min(...quarters),
            end: Math.max(...quarters),
        };
    };

    // Calculate position and width as percentages
    const getBarStyle = (objective: YearlyObjective) => {
        const { start, end } = getQuarterRange(objective);
        const width = ((end - start + 1) / 4) * 100;
        const left = ((start - 1) / 4) * 100;
        return { width: `${width}%`, left: `${left}%` };
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{year} Roadmap Timeline</h3>

            {/* Quarter Headers */}
            <div className="relative">
                {/* Quarter columns background */}
                <div className="flex border-b-2 border-gray-200 pb-3 mb-4">
                    {[1, 2, 3, 4].map((quarter) => (
                        <div
                            key={quarter}
                            className={`flex-1 text-center ${quarter === currentQuarter
                                ? 'font-bold text-blue-600'
                                : 'text-gray-600'
                                }`}
                        >
                            <div className="text-sm uppercase tracking-wider mb-1">Q{quarter}</div>
                            <div className="text-xs text-gray-400">
                                {quarter === 1 && 'Jan - Mar'}
                                {quarter === 2 && 'Apr - Jun'}
                                {quarter === 3 && 'Jul - Sep'}
                                {quarter === 4 && 'Oct - Dec'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Current quarter indicator */}
                <div className="absolute top-0 h-full pointer-events-none" style={{ left: `${((currentQuarter - 0.5) / 4) * 100}%` }}>
                    <div className="w-px h-full bg-blue-500 opacity-30" />
                </div>

                {/* Timeline Grid */}
                <div className="relative min-h-[200px]">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                        {[1, 2, 3, 4].map((q) => (
                            <div
                                key={q}
                                className={`flex-1 border-r border-gray-100 ${q === currentQuarter ? 'bg-blue-50/50' : ''
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Objective Bars */}
                    <div className="relative space-y-3 py-2">
                        {objectives.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No objectives to display</p>
                                <p className="text-sm">Create your first objective to see it on the timeline</p>
                            </div>
                        ) : (
                            objectives.map((objective) => {
                                const colors = categoryColors[objective.category] || categoryColors.growth;
                                const style = getBarStyle(objective);
                                const isHovered = hoveredObjective === objective.id;

                                return (
                                    <div
                                        key={objective.id}
                                        className="relative h-16"
                                        onMouseEnter={() => setHoveredObjective(objective.id)}
                                        onMouseLeave={() => setHoveredObjective(null)}
                                    >
                                        {/* Objective Bar */}
                                        <div
                                            className={`absolute h-12 rounded-lg ${colors.bg} cursor-pointer transition-all duration-200 
                                                ${isHovered ? 'ring-2 ring-offset-2 ring-blue-500 scale-[1.02] shadow-lg z-10' : 'shadow'}`}
                                            style={style}
                                            onClick={() => onObjectiveClick?.(objective)}
                                        >
                                            {/* Progress overlay */}
                                            <div
                                                className="absolute inset-0 bg-white/20 rounded-lg transition-all"
                                                style={{ width: `${objective.progress}%` }}
                                            />

                                            {/* Content */}
                                            <div className="relative h-full px-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[objective.status]}`}
                                                        title={objective.status}
                                                    />
                                                    <span className="text-white text-sm font-medium truncate">
                                                        {objective.title}
                                                    </span>
                                                </div>
                                                <span className="text-white/90 text-xs font-bold flex-shrink-0 ml-2">
                                                    {objective.progress}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Hover Tooltip */}
                                        {isHovered && (
                                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-20 w-72 bg-gray-900 text-white rounded-lg shadow-xl p-4 text-sm">
                                                <div className="font-semibold mb-2">{objective.title}</div>
                                                <p className="text-gray-300 text-xs mb-3 line-clamp-2">{objective.description}</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-400">Status:</span>
                                                        <span className="ml-1 capitalize">{objective.status.replace('-', ' ')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Progress:</span>
                                                        <span className="ml-1">{objective.progress}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Category:</span>
                                                        <span className="ml-1 capitalize">{objective.category}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Quarters:</span>
                                                        <span className="ml-1">
                                                            {objective.quarterlyObjectives.map(q => `Q${q.quarter}`).join(', ') || 'All'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <span className="font-medium">Categories:</span>
                    {Object.entries(categoryColors).map(([category, colors]) => (
                        <div key={category} className="flex items-center gap-1">
                            <div className={`w-3 h-3 rounded ${colors.bg}`} />
                            <span className="capitalize">{category}</span>
                        </div>
                    ))}
                    <span className="mx-2">|</span>
                    <span className="font-medium">Status:</span>
                    {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="capitalize">{status.replace('-', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
