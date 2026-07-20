import React from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, HelpCircle, Layers, Flame } from 'lucide-react';
import type { AnalysisResult } from '../lib/types';
import EvidenceStrengthMeter, { hasDisplayableEvidence } from './EvidenceStrengthMeter';

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
    result: AnalysisResult | null;
    isLoading?: boolean;
}

export const RightPanel = React.memo<RightPanelProps>((({ isOpen, onClose, result, isLoading }) => {
    const gapsArray: string[] = React.useMemo(() => {
        if (!result?.research_gaps) return [];
        if (Array.isArray(result.research_gaps)) return result.research_gaps as unknown as string[];
        return (result.research_gaps as string)
            .split(/\n|•|-\s/)
            .map((s) => s.trim())
            .filter(Boolean);
    }, [result?.research_gaps]);

    const conflictsCount = React.useMemo(() => {
        if (!result?.contradictions) return 0;
        return (result.contradictions as string)
            .split(/\n|•|-\s/)
            .map((s) => s.trim())
            .filter(Boolean).length;
    }, [result?.contradictions]);

    const evidence = result?.evidence_analysis;
    const showScore = hasDisplayableEvidence(evidence);

    if (!isOpen) return null;

    return (
        <aside className="w-80 h-screen bg-[#020617] border-l border-slate-800/60 flex flex-col fixed right-0 top-0 z-20 shadow-2xl transition-transform duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/40 bg-slate-900/10">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Research Intelligence</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                
                {/* 1. Evidence Score / Consensus Grid */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence Metrics</h3>
                    {isLoading && !result ? (
                        <div className="p-4 bg-slate-900/20 border border-slate-800/60 rounded-xl space-y-2">
                            <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse" />
                        </div>
                    ) : showScore && evidence ? (
                        <div className="grid grid-cols-2 gap-3">
                            {/* Evidence Score Card */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Evidence Score</span>
                                <span className="text-xl font-extrabold text-slate-200 mt-2 font-mono">{evidence.overall_score.toFixed(1)}<span className="text-xs text-slate-500">/10</span></span>
                            </div>

                            {/* Consensus Card */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Consensus</span>
                                <span className="text-xs font-bold text-indigo-400 mt-3 truncate">{evidence.label} Consensus</span>
                            </div>

                            {/* Diversity Card */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Diversity</span>
                                <span className="text-xs font-bold text-emerald-400 mt-3 font-mono">{evidence.source_diversity.toFixed(1)}/10</span>
                            </div>

                            {/* Conflicts Card */}
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Conflicts</span>
                                <span className="text-xs font-bold text-rose-400 mt-3 flex items-center gap-1 font-mono">
                                    <Flame className="w-3.5 h-3.5" />
                                    {conflictsCount} Detected
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-900/20 border border-slate-800/60 rounded-xl text-xs text-slate-500 italic">
                            Only partial evidence could be retrieved. Some databases were unavailable.
                        </div>
                    )}
                </section>

                {/* 2. Real-time Strength Meter */}
                {result?.evidence_analysis && showScore && (
                    <section className="border-t border-slate-800/40 pt-5">
                        <EvidenceStrengthMeter score={result.evidence_analysis} isLoading={isLoading && !showScore} />
                    </section>
                )}

                {/* 3. Source Library list (no placeholders) */}
                <section className="border-t border-slate-800/40 pt-5">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Analyzed Sources ({result?.papers?.length ?? 0})
                    </h3>
                    {isLoading && (!result?.papers || result.papers.length === 0) ? (
                        <p className="text-xs text-slate-400 animate-pulse">Searching databases...</p>
                    ) : result?.papers && result.papers.length > 0 ? (
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {result.papers.map((paper, idx) => (
                                <div key={paper.id ?? idx} className="bg-slate-900/30 border border-slate-850 rounded-xl p-3 transition-colors hover:bg-slate-900/50">
                                    <h4 className="text-xs font-bold text-slate-300 leading-snug line-clamp-1" title={paper.title}>
                                        {paper.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2 text-[9px] font-bold text-slate-500">
                                        <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5">{paper.source}</span>
                                        {paper.year && <span>{paper.year}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic">Only partial evidence could be retrieved.</p>
                    )}
                </section>

                {/* 4. Identified Gaps */}
                {gapsArray.length > 0 && (
                    <section className="border-t border-slate-800/40 pt-5">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Methodology Gaps
                        </h3>
                        <ul className="space-y-2">
                            {gapsArray.map((gap, idx) => (
                                <li key={idx} className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
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
}));

RightPanel.displayName = 'RightPanel';
