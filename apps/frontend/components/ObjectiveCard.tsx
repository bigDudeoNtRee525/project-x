'use client';

import { CheckCircle, Circle, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { YearlyObjective, QuarterlyObjective } from '@/lib/mockData';
import { getTasksByQuarterlyObjectiveId } from '@/lib/mockData';

interface ObjectiveCardProps {
    objective: YearlyObjective;
    isExpanded: boolean;
    onToggle: () => void;
    currentQuarter: number;
    onEdit?: (objective: YearlyObjective) => void;
    onDelete?: (objective: YearlyObjective) => void;
}

// Category colors and icons
const categoryStyles: Record<string, { bg: string; text: string; icon: string }> = {
    growth: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📈' },
    product: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🚀' },
    team: { bg: 'bg-green-100', text: 'text-green-700', icon: '👥' },
    operations: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '⚙️' },
    revenue: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '💰' },
};

// Status colors
const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    'on-track': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'at-risk': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'behind': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'completed': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const quarterStatusStyles: Record<string, { bg: string; text: string }> = {
    'not-started': { bg: 'bg-gray-100', text: 'text-gray-600' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'completed': { bg: 'bg-green-100', text: 'text-green-700' },
    'at-risk': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

export function ObjectiveCard({ objective, isExpanded, onToggle, currentQuarter, onEdit, onDelete }: ObjectiveCardProps) {
    const category = categoryStyles[objective.category] || categoryStyles.growth;
    const status = statusStyles[objective.status] || statusStyles['on-track'];

    return (
        <div className={`rounded-xl border-2 ${status.border} ${status.bg} overflow-hidden transition-all duration-300`}>
            {/* Header */}
            <div
                className="p-5 cursor-pointer hover:bg-white/50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.bg} ${category.text}`}>
                                {category.icon} {objective.category.charAt(0).toUpperCase() + objective.category.slice(1)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.text} ${status.bg} border ${status.border}`}>
                                {objective.status.replace('-', ' ').toUpperCase()}
                            </span>
                            {/* Action buttons */}
                            {(onEdit || onDelete) && (
                                <div className="flex items-center gap-1 ml-auto">
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(objective);
                                            }}
                                            className="h-7 w-7 p-0 hover:bg-blue-100"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(objective);
                                            }}
                                            className="h-7 w-7 p-0 hover:bg-red-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{objective.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{objective.description}</p>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                className="text-gray-200"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                className={objective.progress >= 75 ? 'text-green-500' : objective.progress >= 50 ? 'text-blue-500' : objective.progress >= 25 ? 'text-yellow-500' : 'text-red-500'}
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - objective.progress / 100)}`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                            {objective.progress}%
                        </span>
                    </div>
                </div>

                {/* Quick Quarter Overview */}
                <div className="flex items-center gap-2 mt-4">
                    {objective.quarterlyObjectives.map((q) => (
                        <div
                            key={q.id}
                            className={`flex-1 h-2 rounded-full ${q.progress === 100 ? 'bg-green-500' :
                                q.progress > 0 ? 'bg-blue-500' :
                                    'bg-gray-300'
                                }`}
                            title={`Q${q.quarter}: ${q.progress}%`}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Q1</span>
                    <span>Q2</span>
                    <span>Q3</span>
                    <span>Q4</span>
                </div>
            </div>

            {/* Expanded Quarterly Details */}
            {isExpanded && (
                <div className="border-t border-gray-200 bg-white/80">
                    {objective.quarterlyObjectives.map((quarter) => (
                        <QuarterlyObjectiveRow
                            key={quarter.id}
                            quarter={quarter}
                            isCurrentQuarter={quarter.quarter === currentQuarter}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function QuarterlyObjectiveRow({
    quarter,
    isCurrentQuarter
}: {
    quarter: QuarterlyObjective;
    isCurrentQuarter: boolean;
}) {
    const status = quarterStatusStyles[quarter.status] || quarterStatusStyles['not-started'];

    // Get linked tasks
    const linkedTasks = getTasksByQuarterlyObjectiveId(quarter.id);
    const completedTasks = linkedTasks.filter(t => t.status === 'completed').length;
    const totalTasks = linkedTasks.length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className={`p-4 border-b last:border-b-0 ${isCurrentQuarter ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isCurrentQuarter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            Q{quarter.quarter}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                            {quarter.status.replace('-', ' ')}
                        </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{quarter.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{quarter.description}</p>

                    {/* Linked Tasks Section */}
                    {totalTasks > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Linked Tasks
                                </span>
                                <span className="text-xs font-bold text-gray-900">
                                    {completedTasks}/{totalTasks} ({taskProgress}%)
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full rounded-full transition-all ${taskProgress === 100 ? 'bg-green-500' :
                                        taskProgress >= 50 ? 'bg-blue-500' :
                                            taskProgress > 0 ? 'bg-yellow-500' :
                                                'bg-gray-300'
                                        }`}
                                    style={{ width: `${taskProgress}%` }}
                                />
                            </div>
                            <div className="space-y-1">
                                {linkedTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-2 text-xs">
                                        {task.status === 'completed' ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : task.status === 'in_progress' ? (
                                            <Clock className="h-3 w-3 text-blue-500" />
                                        ) : (
                                            <Circle className="h-3 w-3 text-gray-400" />
                                        )}
                                        <span className={`flex-1 truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                            {task.description}
                                        </span>
                                        <span className="text-gray-400">{task.assigneeName || 'Unassigned'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Results */}
                    {quarter.keyResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {quarter.keyResults.map((kr) => {
                                const progress = Math.min(100, (kr.currentValue / kr.targetValue) * 100);
                                return (
                                    <div key={kr.id} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-gray-600">{kr.title}</span>
                                                <span className="font-medium text-gray-900">
                                                    {kr.currentValue.toLocaleString()}{kr.unit !== 'launch' && kr.unit !== 'doc' && kr.unit !== 'hire' ? '' : ''} / {kr.targetValue.toLocaleString()}{kr.unit}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' :
                                                        progress >= 70 ? 'bg-blue-500' :
                                                            progress >= 40 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quarter Progress */}
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{quarter.progress}%</div>
                    <div className="text-xs text-gray-500">complete</div>
                </div>
            </div>
        </div>
    );
}
