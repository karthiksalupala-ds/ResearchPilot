import { CheckCircle2, Loader2, AlertCircle, Sparkles, MessageSquareQuote } from 'lucide-react';
import type { PipelineStep } from '../lib/types';
import { PIPELINE_STEPS } from '../lib/types';

interface ReasoningPipelineProps {
    steps: Record<string, PipelineStep>;
    isActive: boolean;
}

type StepStatus = 'pending' | 'running' | 'done' | 'error';

function AIBrain({ active }: { active: boolean }) {
    return (
        <div className={`relative w-14 h-14 flex items-center justify-center ${active ? 'animate-floating' : ''}`}>
            {/* Outer Glow */}
            {active && <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse-soft" />}

            {/* Neural Connections SVG */}
            <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full text-white/40">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Connecting paths */}
                <g className={active ? 'opacity-100' : 'opacity-20'}>
                    <path d="M20 20 L10 15 M20 20 L30 15 M20 20 L15 30 M20 20 L25 30 M10 15 L30 15 M15 30 L25 30"
                        stroke="currentColor" strokeWidth="0.5" fill="none" className={active ? 'animate-pulse' : ''} />
                    <path d="M10 15 L5 20 M30 15 L35 20 M15 30 L10 25 M25 30 L30 25"
                        stroke="currentColor" strokeWidth="0.3" fill="none" className={active ? 'animate-pulse' : ''} opacity="0.5" />
                </g>

                {/* Nodes */}
                <circle cx="20" cy="20" r="2" className="fill-brand-400 brain-node" filter={active ? "url(#glow)" : ""} />
                <circle cx="10" cy="15" r="1.5" className="fill-brand-400 brain-node" style={{ animationDelay: '0.5s' }} />
                <circle cx="30" cy="15" r="1.5" className="fill-brand-400 brain-node" style={{ animationDelay: '1.2s' }} />
                <circle cx="15" cy="30" r="1.5" className="fill-brand-400 brain-node" style={{ animationDelay: '0.8s' }} />
                <circle cx="25" cy="30" r="1.5" className="fill-brand-400 brain-node" style={{ animationDelay: '1.7s' }} />
                <circle cx="5" cy="20" r="1.2" className="fill-indigo-400 brain-node" style={{ animationDelay: '2.1s' }} />
                <circle cx="35" cy="20" r="1.2" className="fill-indigo-400 brain-node" style={{ animationDelay: '0.3s' }} />
            </svg>
            <Sparkles className={`w-6 h-6 text-white relative z-10 ${active ? 'animate-pulse-soft' : 'opacity-40'}`} />
        </div>
    );
}

function StepStatusIndicator({ status }: { status: StepStatus }) {
    if (status === 'done') {
        return (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 step-node-done">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
        );
    }
    if (status === 'running') {
        return (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 step-node-active">
                <div className="absolute inset-0 bg-brand-500/10 rounded-full animate-ping" />
                <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
            </div>
        );
    }
    if (status === 'error') {
        return (
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40">
                <AlertCircle className="w-4 h-4 text-red-400 animate-bounce" />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 opacity-30">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
        </div>
    );
}

export default function ReasoningPipeline({ steps, isActive }: ReasoningPipelineProps) {
    if (!isActive && Object.keys(steps).length === 0) return null;

    const doneCount = Object.values(steps).filter(s => s.status === 'done').length;
    const total = PIPELINE_STEPS.length;
    const progress = Math.round((doneCount / total) * 100);

    const activeStep = Object.values(steps).find(s => s.status === 'running');

    return (
        <div className="glass rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in border border-white/10 max-w-5xl mx-auto mb-12">
            {/* Horizontal Header with Logo and Progress */}
            <div className="bg-white/5 border-b border-white/5 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="logo-container flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 via-indigo-700 to-purple-800 w-16 h-16 shadow-[0_0_20px_rgba(76,110,245,0.3)] border border-white/20 transition-transform duration-500 hover:scale-105">
                            <AIBrain active={isActive} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-white font-black text-xl tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Research Intelligence</h3>
                                {isActive && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Active reasoning</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black opacity-60 mt-2">Analysis Engine v1.0 • Multi-Agent Pipeline</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-sm w-full space-y-3">
                        <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-brand-400" />
                                Neural Progress
                            </span>
                            <span className="text-brand-400 font-mono text-xs">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1.5px] shadow-inner">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-600 via-purple-500 to-emerald-400 transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Stepper */}
            <div className="p-8 pb-12">
                <div className="flex items-start justify-between relative">
                    {/* Full Line Connector Background */}
                    <div className="absolute top-4 left-4 right-4 h-[1px] bg-white/5 z-0" />

                    {PIPELINE_STEPS.map((def, idx, array) => {
                        const step = steps[def.id];
                        const status: StepStatus = step?.status ?? 'pending';
                        const isRunning = status === 'running';
                        const isDone = status === 'done';
                        const isPending = status === 'pending';

                        return (
                            <div key={def.id} className="relative z-10 flex flex-col items-center flex-1 group">
                                {/* Horizontal Connector Line (Flowing) */}
                                {idx < array.length - 1 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] transition-all duration-1000 ${isDone ? 'connector-flow' : 'bg-transparent'}`} />
                                )}

                                {/* Step Indicator */}
                                <div className={`mb-4 transition-all duration-500 ${isPending ? 'scale-90 grayscale' : 'scale-110'}`}>
                                    <StepStatusIndicator status={status} />
                                </div>

                                {/* Label */}
                                <div className="text-center">
                                    <div className={`text-[11px] font-black tracking-widest uppercase transition-all duration-500 ${isRunning ? 'text-brand-400' : isDone ? 'text-emerald-400' : 'text-slate-500 opacity-40'}`}>
                                        {def.label}
                                    </div>

                                    {/* Miniature message preview */}
                                    <div className="mt-2 h-1 w-8 mx-auto rounded-full bg-white/5 overflow-hidden">
                                        {isRunning && <div className="h-full bg-brand-500/50 shimmer w-full" />}
                                        {isDone && <div className="h-full bg-emerald-500/50 w-full" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dedicated Active Thought Bubble */}
                {activeStep?.message && (
                    <div className="mt-10 animate-slide-in-right">
                        <div className="message-popup p-5 rounded-2xl bg-brand-500/5 border border-brand-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.2)] relative overflow-hidden flex items-start gap-4 backdrop-blur-sm">
                            <div className="scanning-line" />
                            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                                <MessageSquareQuote className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[13px] leading-relaxed text-slate-200 font-medium">
                                    <span className="text-brand-400 font-black mr-2 uppercase tracking-tighter text-[10px]">Processing:</span>
                                    {activeStep.message}
                                </p>
                            </div>
                            <div className="flex gap-1 self-end mb-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Subtle Tech Footer */}
            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 rounded-full ${isActive ? 'bg-brand-500/30' : 'bg-slate-800'}`} style={{ height: `${4 + Math.random() * 8}px`, opacity: 0.3 + Math.random() * 0.7 }} />
                        ))}
                    </div>
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Neural Compute Unit 01</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-tighter opacity-40">
                    STATUS: {isActive ? 'SYNC_RUNNING' : 'IDLE_WAIT'} // CORE_TEMP: 32°C
                </div>
            </div>
        </div>
    );
}
