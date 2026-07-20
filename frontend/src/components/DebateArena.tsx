import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, ShieldAlert, CheckCircle2, ChevronRight, User, Loader2 } from 'lucide-react';
import type { AnalysisResult, PipelineStep } from '../lib/types';
import { reportMarkdownComponents, PapersContext } from './ExecutiveReport';

interface DebateArenaProps {
    steps: Record<string, PipelineStep>;
    result: AnalysisResult | null;
}

interface Debater {
    id: string;
    name: string;
    role: 'pro' | 'con';
    focus: string;
    avatarBg: string;
    glowColor: string;
    description: string;
}

interface ArgumentBlock {
    mainClaim: string;
    evidence: string;
    confidence: string;
    raw: string;
}

const DEBATERS: Debater[] = [
    {
        id: 'pro1',
        name: 'Pro Debater 1',
        role: 'pro',
        focus: 'Direct positive impacts & immediate benefits.',
        avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        glowColor: 'shadow-emerald-500/20 border-emerald-500/50',
        description: 'Analyzes direct, measurable benefits.'
    },
    {
        id: 'pro2',
        name: 'Pro Debater 2',
        role: 'pro',
        focus: 'Long-term systemic benefits & structural gains.',
        avatarBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        glowColor: 'shadow-teal-500/20 border-teal-500/50',
        description: 'Examines system-wide improvements.'
    },
    {
        id: 'con1',
        name: 'Con Debater 1',
        role: 'con',
        focus: 'Direct risks, immediate harms, and flaws.',
        avatarBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        glowColor: 'shadow-rose-500/20 border-rose-500/50',
        description: 'Highlights immediate negative impacts.'
    },
    {
        id: 'con2',
        name: 'Con Debater 2',
        role: 'con',
        focus: 'Long-term systemic risks & ethical concerns.',
        avatarBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        glowColor: 'shadow-amber-500/20 border-amber-500/50',
        description: 'Surfaces long-term vulnerabilities.'
    }
];

function extractDebaterSection(blob: string, which: 'pro1' | 'pro2' | 'con1' | 'con2'): string {
    if (!blob) return '';

    const patterns: Record<string, RegExp[]> = {
        pro1: [
            /###\s*Pro\s*1[\s\S]*?(?=###\s*Pro\s*2|$)/i,
            /Pro\s*1[\s\S]*?(?=###\s*Pro\s*2|Pro\s*2|$)/i,
        ],
        pro2: [
            /###\s*Pro\s*2[\s\S]*$/i,
            /Pro\s*2[\s\S]*$/i,
        ],
        con1: [
            /###\s*Con\s*1[\s\S]*?(?=###\s*Con\s*2|$)/i,
            /Con\s*1[\s\S]*?(?=###\s*Con\s*2|Con\s*2|$)/i,
        ],
        con2: [
            /###\s*Con\s*2[\s\S]*$/i,
            /Con\s*2[\s\S]*$/i,
        ],
    };

    for (const re of patterns[which]) {
        const m = blob.match(re);
        if (m?.[0]?.trim()) return m[0].trim();
    }

    if (which === 'pro1') return blob.split(/###\s*Pro\s*2/i)[0] || blob;
    if (which === 'pro2') return blob.split(/###\s*Pro\s*2/i)[1] || '';
    if (which === 'con1') return blob.split(/###\s*Con\s*2/i)[0] || blob;
    return blob.split(/###\s*Con\s*2/i)[1] || '';
}

function parseArgumentBlocks(text: string): ArgumentBlock[] {
    const cleaned = text
        .replace(/^\s*###[^\n]*\n?/, '')
        .replace(/\*\*\[[^\]]*\]\*\*\s*/g, '')
        .trim();

    if (!cleaned) return [];

    const chunks = cleaned
        .split(/(?=\*\*Main claim:\*\*)|(?=^\d+[\.\)]\s)/im)
        .map(c => c.trim())
        .filter(Boolean);

    const blocks: ArgumentBlock[] = [];
    for (const chunk of chunks) {
        const main = chunk.match(/\*\*Main claim:\*\*\s*([\s\S]*?)(?=\*\*Evidence used:\*\*|$)/i)?.[1]?.trim() || '';
        const evidence = chunk.match(/\*\*Evidence used:\*\*\s*([\s\S]*?)(?=\*\*Confidence level:\*\*|$)/i)?.[1]?.trim() || '';
        const confidence = chunk.match(/\*\*Confidence level:\*\*\s*([\s\S]*?)$/i)?.[1]?.trim() || '';

        if (main || evidence || confidence) {
            blocks.push({ mainClaim: main, evidence, confidence, raw: chunk });
        } else if (chunk.length > 25 && !chunk.includes('Debate skipped')) {
            blocks.push({ mainClaim: '', evidence: '', confidence: '', raw: chunk });
        }
    }

    return blocks;
}

function ArgumentRenderer({ text, isRunning }: { text: string; isRunning: boolean }) {
    const blocks = useMemo(() => parseArgumentBlocks(text), [text]);

    if (isRunning) {
        return (
            <div className="flex items-center gap-2 text-slate-500 italic py-4">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>Building expert arguments...</span>
            </div>
        );
    }

    if (!text || text.includes('Debate skipped') || text.length < 20) {
        return <p className="text-slate-500 italic py-4">Building expert arguments...</p>;
    }

    if (blocks.length === 0) {
        return (
            <div className="text-sm leading-relaxed text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                    {text}
                </ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
            {blocks.map((block, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                    {block.mainClaim ? (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Main claim</p>
                            <div className="text-sm text-slate-100 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                                    {block.mainClaim}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                                {block.raw}
                            </ReactMarkdown>
                        </div>
                    )}
                    {block.evidence && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Evidence used</p>
                            <div className="text-sm text-slate-300 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
                                    {block.evidence}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {block.confidence && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Confidence level</p>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-200">
                                {block.confidence.replace(/\n/g, ' ')}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function DebateArena({ steps, result }: DebateArenaProps) {
    const debateStep = steps['debate'];
    const isDebateRunning = debateStep?.status === 'running';
    const isDebateDone = debateStep?.status === 'done' || result !== null;
    const [selectedDebater, setSelectedDebater] = useState<string>('pro1');
    const [proPercent, setProPercent] = useState(50);

    const isFastPath =
        !!result && (
            (result.supporting_arguments || '').includes('Debate skipped') ||
            (result.research_strategy || '').toLowerCase().includes('fast-path')
        );

    const shouldShow =
        isDebateRunning ||
        (isDebateDone && !!result && !isFastPath);

    useEffect(() => {
        if (isDebateRunning) {
            const interval = setInterval(() => {
                setProPercent(prev => {
                    const delta = (Math.random() - 0.5) * 10;
                    return Math.max(30, Math.min(70, prev + delta));
                });
            }, 600);
            return () => clearInterval(interval);
        } else if (isDebateDone && result && !isFastPath) {
            const score = result.evidence_analysis?.overall_score || 5;
            setProPercent(Math.max(35, Math.min(65, score * 10)));
        }
    }, [isDebateRunning, isDebateDone, result, isFastPath]);

    if (!shouldShow) return null;

    const getArgument = (id: string) => {
        if (!result) return '';
        if (id === 'pro1') return extractDebaterSection(result.supporting_arguments || '', 'pro1');
        if (id === 'pro2') return extractDebaterSection(result.supporting_arguments || '', 'pro2');
        if (id === 'con1') return extractDebaterSection(result.counterarguments || '', 'con1');
        return extractDebaterSection(result.counterarguments || '', 'con2');
    };

    return (
        <PapersContext.Provider value={result?.papers || []}>
            <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-fade-in max-w-5xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                        <Brain className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Multi-Agent Debate Arena</h3>
                        <p className="text-xs text-slate-400">Pro vs Con evaluation of evidence</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full border ${
                        isDebateRunning
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                        {isDebateRunning ? 'Debating...' : 'Debate Complete'}
                    </span>
                </div>
            </div>

            <div className="mb-10 space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Supporting Evidence ({Math.round(proPercent)}%)
                    </span>
                    <span className="text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Counter Evidence ({Math.round(100 - proPercent)}%)
                    </span>
                </div>
                <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-[2px] border border-white/5 relative">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 z-10" />
                    <motion.div
                        animate={{ width: `${proPercent}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {DEBATERS.map((debater) => {
                        const isSelected = selectedDebater === debater.id;
                        return (
                            <motion.button
                                key={debater.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedDebater(debater.id)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                                    isSelected
                                        ? `bg-white/5 border-brand-500 shadow-lg ${debater.glowColor}`
                                        : 'bg-black/20 border-white/5 hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${debater.avatarBg}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-white truncate">{debater.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{debater.description}</p>
                                </div>
                                {isSelected && <ChevronRight className="w-4 h-4 text-brand-400 hidden lg:block" />}
                            </motion.button>
                        );
                    })}
                </div>

                <div className="lg:col-span-2 h-full">
                    <AnimatePresence mode="wait">
                        {DEBATERS.map((debater) => {
                            if (selectedDebater !== debater.id) return null;
                            const argument = getArgument(debater.id);

                            return (
                                <motion.div
                                    key={debater.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 shadow-xl flex-1 flex flex-col min-h-[220px]">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${
                                                debater.role === 'pro'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                                {debater.role === 'pro' ? 'Pro Side' : 'Con Side'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                Focus: {debater.focus}
                                            </span>
                                        </div>

                                        <ArgumentRenderer text={argument} isRunning={isDebateRunning} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    </PapersContext.Provider>
    );
}

export default memo(DebateArena);
