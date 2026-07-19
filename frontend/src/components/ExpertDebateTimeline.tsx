import React from 'react';
import { MessagesSquare, Quote, ChevronDown, ChevronRight, User } from 'lucide-react';
import type { AnalysisResult, PipelineStep } from '../lib/types';
import { cn } from '../lib/utils';

interface ExpertDebateTimelineProps {
    steps: Record<string, PipelineStep>;
    result: AnalysisResult | null;
}

export const ExpertDebateTimeline: React.FC<ExpertDebateTimelineProps> = ({ steps, result }) => {
    
    // Extract debate content from result or steps.
    // In our backend, the result.perspectives object might hold debate points, or we parse from steps.
    const debateSteps = Object.values(steps).filter(s => s.step.includes('agent') || s.step.includes('debate') || s.step.includes('critic'));
    
    // If no active debate steps and no result, show nothing
    if (debateSteps.length === 0 && !result) return null;

    return (
        <div className="bg-[#0f172a]/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center gap-3">
                <MessagesSquare className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-medium text-slate-200">Expert Panel Review</h4>
                <span className="ml-auto text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded">Consensus Process</span>
            </div>
            
            <div className="p-5 space-y-6">
                
                {/* Simulated perspectives if we have a result */}
                {(result as any)?.perspectives && Object.entries((result as any).perspectives).map(([key, value]: [string, any], idx: number) => (
                    <div key={idx} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1 border border-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-slate-800/60">
                            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{key.replace('_', ' ')}</h5>
                            <p className="text-sm text-slate-300 leading-relaxed">{String(value)}</p>
                        </div>
                    </div>
                ))}

                {/* Live Steps if result is not yet available but agents are talking */}
                {!result && debateSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 opacity-80">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1 border border-slate-700">
                            <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-slate-800/60 relative">
                            {step.status === 'running' && (
                                <span className="absolute top-4 right-4 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                            )}
                            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">{step.step}</h5>
                            <div className="text-sm text-slate-400 font-mono leading-relaxed bg-slate-950 p-3 rounded mt-2 max-h-32 overflow-y-auto border border-slate-800/50">
                                {step.message}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
