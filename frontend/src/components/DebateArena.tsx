import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ShieldAlert, CheckCircle2, ChevronRight, User } from 'lucide-react';
import type { AnalysisResult, PipelineStep } from '../lib/types';

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

export default function DebateArena({ steps, result }: DebateArenaProps) {
    const debateStep = steps['debate'];
    const isDebateRunning = debateStep?.status === 'running';
    const isDebateDone = debateStep?.status === 'done' || result !== null;
    const [selectedDebater, setSelectedDebater] = useState<string>('pro1');
    const [proPercent, setProPercent] = useState(50);

    // Dynamic Sentiment calculations
    useEffect(() => {
        if (isDebateRunning) {
            // Live animate sentiment while processing
            const interval = setInterval(() => {
                setProPercent(prev => {
                    const delta = (Math.random() - 0.5) * 10;
                    return Math.max(30, Math.min(70, prev + delta));
                });
            }, 600);
            return () => clearInterval(interval);
        } else if (isDebateDone && result) {
            // Set fixed based on evidence score
            const score = result.evidence_analysis?.overall_score || 5;
            setProPercent(score * 10);
        }
    }, [isDebateRunning, isDebateDone, result]);

    if (!isDebateRunning && !isDebateDone) return null;

    // Extract arguments from results
    const getArgument = (id: string) => {
        if (!result) return 'Synthesizing arguments...';
        if (id === 'pro1') {
            return result.supporting_arguments?.split('### Pro 2')[0] || 'Analyzing benefits...';
        }
        if (id === 'pro2') {
            return result.supporting_arguments?.split('### Pro 2')[1] || 'Analyzing systemic outcomes...';
        }
        if (id === 'con1') {
            return result.counterarguments?.split('### Con 2')[0] || 'Analyzing direct risks...';
        }
        return result.counterarguments?.split('### Con 2')[1] || 'Analyzing systemic concerns...';
    };

    return (
        <div className="glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-fade-in max-w-5xl mx-auto mb-12">
            {/* Header */}
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

            {/* Live Sentiment Meter */}
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
                    {/* Centered line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 z-10" />
                    
                    <motion.div 
                        animate={{ width: `${proPercent}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    />
                </div>
            </div>

            {/* Arena Floor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Agent Selector Grid (Left / Columns) */}
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

                {/* Speech Bubble / Output (Right / Full width) */}
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

                                        <div className="text-sm leading-relaxed text-slate-200 prose prose-invert max-w-none flex-1 overflow-y-auto whitespace-pre-wrap">
                                            {isDebateRunning ? (
                                                <div className="flex items-center gap-2 text-slate-500 italic py-4">
                                                    <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                                                    <span>Agent debating and analyzing papers...</span>
                                                </div>
                                            ) : (
                                                argument
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
