import type { EvidenceScore } from '../lib/types';

interface Props {
    score: EvidenceScore;
}

const LABEL_CONFIG = {
    Strong: { color: 'text-emerald-400', bar: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    Moderate: { color: 'text-brand-400', bar: 'from-brand-500 to-purple-500', bg: 'bg-brand-500/10 border-brand-500/30' },
    Limited: { color: 'text-amber-400', bar: 'from-amber-500 to-orange-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    Insufficient: { color: 'text-red-400', bar: 'from-red-500 to-rose-400', bg: 'bg-red-500/10 border-red-500/30' },
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono text-slate-300">{value.toFixed(1)}/10</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${(value / 10) * 100}%` }}
                />
            </div>
        </div>
    );
}

export default function EvidenceStrengthMeter({ score }: Props) {
    const cfg = LABEL_CONFIG[score.label] ?? LABEL_CONFIG.Moderate;
    const pct = (score.overall_score / 10) * 100;

    // Circumference of the circle
    const R = 40;
    const C = 2 * Math.PI * R;
    const offset = C - (pct / 100) * C;

    return (
        <div className="glass rounded-2xl p-5 space-y-5">
            <h4 className="text-sm font-semibold text-slate-200">📊 Evidence Strength Analysis</h4>

            <div className="flex items-center gap-6">
                {/* Circular gauge */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle
                            cx="50" cy="50" r={R} fill="none"
                            stroke="url(#evidenceGrad)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={C}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000"
                        />
                        <defs>
                            <linearGradient id="evidenceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#4c6ef5" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xl font-bold font-mono ${cfg.color}`}>
                            {score.overall_score.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-600">/ 10</span>
                    </div>
                </div>

                {/* Label + meta */}
                <div className="flex-1 space-y-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
                        {score.label} Evidence
                    </div>
                    <p className="text-xs text-slate-500">
                        Based on <span className="text-slate-300 font-medium">{score.paper_count} papers</span> retrieved from arXiv, Semantic Scholar, and PubMed.
                    </p>
                </div>
            </div>

            {/* Sub-scores */}
            <div className="space-y-3 pt-1">
                <ScoreBar label="Source Diversity" value={score.source_diversity} color={cfg.bar} />
                <ScoreBar label="Finding Consistency" value={score.consistency_score} color={cfg.bar} />
            </div>
        </div>
    );
}
