import React, { useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { PipelineStep } from '../lib/types';
import { PIPELINE_STEPS } from '../lib/types';

interface ReasoningPipelineProps {
    steps: Record<string, PipelineStep>;
    isActive: boolean;
}

function ReasoningPipeline({ steps, isActive }: ReasoningPipelineProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isActive && Object.keys(steps).length === 0) return null;

    const activeStep = Object.values(steps).find(s => s.status === 'running');

    if (!isExpanded) {
        return (
            <div className="bg-[#0f172a]/20 border border-slate-800/40 rounded-xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-medium">
                    {isActive ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 flex-shrink-0" />
                            <span className="truncate">Researching: {activeStep?.message || 'Initializing research agents...'}</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-slate-500">Research completed using:</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Query refinement</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Academic retrieval</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Multi-agent debate</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Final synthesis</span>
                        </div>
                    )}
                    <button 
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap self-end sm:self-auto"
                    >
                        [View detailed process]
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172a]/40 border border-slate-800/60 rounded-xl p-5 mb-6 flex flex-col gap-5">
            {/* Active message preview */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {isActive ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                    ) : (
                        <Check className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-300 font-medium truncate">
                        {activeStep?.message || (isActive ? 'Initializing research agents...' : 'Analysis complete')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap"
                >
                    [Hide detailed process]
                </button>
            </div>

            {/* Stepper track */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {PIPELINE_STEPS.map((def, idx, array) => {
                    const step = steps[def.id];
                    const status = step?.status ?? 'pending';
                    const isRunning = status === 'running';
                    const isDone = status === 'done';
                    const isError = status === 'error';
                    const isPending = status === 'pending';

                    return (
                        <React.Fragment key={def.id}>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full border text-[10px]
                                    ${isDone ? 'bg-slate-800 border-slate-700 text-slate-400' : ''}
                                    ${isRunning ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 ring-2 ring-indigo-500/20' : ''}
                                    ${isError ? 'bg-red-500/10 border-red-500/50 text-red-400' : ''}
                                    ${isPending ? 'bg-transparent border-slate-800 text-slate-600' : ''}
                                `}>
                                    {isDone && <Check className="w-3 h-3" />}
                                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                                    {isError && <AlertCircle className="w-3 h-3" />}
                                    {isPending && <span>{idx + 1}</span>}
                                </div>
                                <span className={`text-[11px] uppercase tracking-wider font-medium
                                    ${isRunning ? 'text-indigo-400' : isDone ? 'text-slate-400' : 'text-slate-600'}
                                `}>
                                    {def.label}
                                </span>
                            </div>
                            
                            {/* Connector */}
                            {idx < array.length - 1 && (
                                <div className={`w-8 h-[1px] flex-shrink-0 ${isDone ? 'bg-slate-700' : 'bg-slate-800/50'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(ReasoningPipeline);
