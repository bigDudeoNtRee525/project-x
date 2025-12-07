'use client';

interface YearlyProgressProps {
    year: number;
    objectives: { progress: number; status: string }[];
}

export function YearlyProgress({ year, objectives }: YearlyProgressProps) {
    // Calculate overall progress
    const overallProgress = objectives.length > 0
        ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)
        : 0;

    // Count by status
    const statusCounts = objectives.reduce((acc, obj) => {
        acc[obj.status] = (acc[obj.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate days remaining in the year
    const now = new Date();
    const endOfYear = new Date(year, 11, 31);
    const startOfYear = new Date(year, 0, 1);
    const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    const yearProgress = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    // Determine current quarter
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold">{year} Overview</h2>
                    <p className="text-slate-400 mt-1">
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Year completed'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Current Quarter</div>
                    <div className="text-2xl font-bold text-blue-400">Q{currentQuarter}</div>
                </div>
            </div>

            {/* Year Timeline Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Year Progress</span>
                    <span className="font-medium">{yearProgress}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${yearProgress}%` }}
                    />
                    {/* Quarter markers */}
                    <div className="absolute inset-0 flex">
                        <div className="w-1/4 border-r border-slate-600" />
                        <div className="w-1/4 border-r border-slate-600" />
                        <div className="w-1/4 border-r border-slate-600" />
                        <div className="w-1/4" />
                    </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Jan</span>
                    <span>Apr</span>
                    <span>Jul</span>
                    <span>Oct</span>
                    <span>Dec</span>
                </div>
            </div>

            {/* Overall Objectives Progress */}
            <div className="grid grid-cols-2 gap-4">
                {/* Main progress circle */}
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-slate-700"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                className={overallProgress >= 75 ? 'text-green-400' : overallProgress >= 50 ? 'text-blue-400' : overallProgress >= 25 ? 'text-yellow-400' : 'text-red-400'}
                                strokeDasharray={`${2 * Math.PI * 35}`}
                                strokeDashoffset={`${2 * Math.PI * 35 * (1 - overallProgress / 100)}`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                            {overallProgress}%
                        </span>
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">Overall Progress</div>
                        <div className="text-lg font-semibold">
                            {overallProgress >= yearProgress ? 'On Track' : 'Behind Schedule'}
                        </div>
                    </div>
                </div>

                {/* Status breakdown */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                            On Track
                        </span>
                        <span className="font-medium">{statusCounts['on-track'] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            At Risk
                        </span>
                        <span className="font-medium">{statusCounts['at-risk'] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Behind
                        </span>
                        <span className="font-medium">{statusCounts['behind'] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            Completed
                        </span>
                        <span className="font-medium">{statusCounts['completed'] || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
