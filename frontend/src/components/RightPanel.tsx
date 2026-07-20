import React from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import type { AnalysisResult } from '../lib/types';
import EvidenceStrengthMeter, { hasDisplayableEvidence } from './EvidenceStrengthMeter';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    result: AnalysisResult | null;
    isLoading?: boolean;
}

export const RightPanel = React.memo<RightPanelProps>(({ isOpen, onClose, result, isLoading }) => {
    const gapsArray: string[] = React.useMemo(() => {
        if (!result?.research_gaps) return [];
        if (Array.isArray(result.research_gaps)) return result.research_gaps as unknown as string[];
        return (result.research_gaps as string)
            .split(/\n|•|-\s/)
            .map((s) => s.trim())
            .filter(Boolean);
    }, [result?.research_gaps]);

    const evidence = result?.evidence_analysis;
    const showScore = hasDisplayableEvidence(evidence);

    if (!isOpen) return null;

    return (
        <aside className="w-80 h-screen bg-[#020617] border-l border-slate-800/60 flex flex-col fixed right-0 top-0 z-20 shadow-2xl transition-transform duration-300">
            <div className="p-4 flex items-center justify-between border-b border-slate-800/40">
                <h2 className="text-sm font-semibold text-slate-200">Research Details</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                <section>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Evidence Score</h3>
                    {isLoading && !result ? (
                        <p className="text-sm text-slate-400">Searching academic databases...</p>
                    ) : showScore && evidence ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-2xl font-semibold text-slate-100">{evidence.overall_score}/10</span>
                                <span className="text-[11px] text-slate-500 mt-1">Confidence Rating</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 flex items-center justify-center relative">
                                <div
                                    className="absolute inset-0 rounded-full border-4 border-indigo-500"
                                    style={{ clipPath: `inset(${100 - (evidence.overall_score * 10)}% 0 0 0)` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">Waiting for evidence...</p>
                    )}
                </section>

                {result?.evidence_analysis && (
                    <section>
                        <EvidenceStrengthMeter score={result.evidence_analysis} isLoading={isLoading && !showScore} />
                    </section>
                )}

                <section>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        Citations & Sources
                    </h3>
                    {isLoading && (!result?.papers || result.papers.length === 0) ? (
                        <p className="text-xs text-slate-400">Searching academic databases...</p>
                    ) : result?.papers && result.papers.length > 0 ? (
                        <div className="space-y-3">
                            {result.papers.map((paper, idx) => (
                                <div key={paper.id ?? idx} className="bg-slate-900/40 border border-slate-800/60 rounded-md p-3">
                                    <h4 className="text-xs font-medium text-slate-300 leading-snug line-clamp-2">
                                        {paper.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                            {(paper.source || 'source').toLowerCase()}
                                        </span>
                                        {paper.year && <span className="text-[10px] text-slate-500">{paper.year}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400">Waiting for evidence...</p>
                    )}
                </section>

                {gapsArray.length > 0 && (
                    <section>
                        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Identified Gaps
                        </h3>
                        <ul className="space-y-2">
                            {gapsArray.map((gap, idx) => (
                                <li key={idx} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
                                    {gap}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </aside>
    );
});
