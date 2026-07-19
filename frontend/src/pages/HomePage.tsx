import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Zap, BookOpen, Shield, Search, ArrowRight, Star, Sparkles, Brain, Cpu, MessageSquare, RotateCcw } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ReasoningPipeline from '../components/ReasoningPipeline';
import ResultsPanel from '../components/ResultsPanel';
import { analyzeResearch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import type { AnalysisResult, PipelineStep } from '../lib/types';
import { cn } from '../lib/utils';

const FEATURES = [
    {
        icon: BookOpen,
        title: 'Multi-Source Retrieval',
        desc: 'Aggregates intelligence from arXiv, Semantic Scholar, and PubMed in real-time.',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10'
    },
    {
        icon: Brain,
        title: '9-Agent Pipeline',
        desc: 'A coordinated swarm of AI agents handling everything from planning to critique.',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10'
    },
    {
        icon: Shield,
        title: 'Evidence Verification',
        desc: 'Rigorous cross-referencing to score evidence quality and source diversity.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
    },
    {
        icon: Search,
        title: 'Gap Discovery',
        desc: 'Automatically identifies unexplored territories and future research directions.',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10'
    },
];

const STATS = [
    { value: '9', label: 'Reasoning Agents', color: 'from-indigo-400 to-blue-500' },
    { value: '3', label: 'Academic Engines', color: 'from-purple-400 to-pink-500' },
    { value: '10', label: 'Analysis Vectors', color: 'from-emerald-400 to-teal-500' },
    { value: '∞', label: 'Deep Insights', color: 'from-orange-400 to-amber-500' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1] as const // Using a cubic bezier array for better compatibility and feel
        }
    }
};

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { researchMode } = useSettings();

    // Research State
    const [isSearching, setIsSearching] = useState(false);
    const [query, setQuery] = useState('');
    const [steps, setSteps] = useState<Record<string, PipelineStep>>({});
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanupRef = useRef<(() => void) | null>(null);

    const handleSearch = useCallback((q: string) => {
        // Abort any in-flight request
        cleanupRef.current?.();

        setIsSearching(true);
        setQuery(q);
        setSteps({});
        setResult(null);
        setError(null);
        setIsLoading(true);

        const requestPayload = {
            query: q,
            research_mode: researchMode,
            max_papers: 12,
            ...(user?.id ? { user_id: user.id } : {})
        };

        const cleanup = analyzeResearch(
            requestPayload,
            (step: PipelineStep) => {
                setSteps(prev => ({ ...prev, [step.step]: step }));
            },
            (res: AnalysisResult) => {
                setResult(res);
            },
            (msg: string) => {
                setError(msg);
                setIsLoading(false);
            },
            () => {
                setIsLoading(false);
                // We keep isSearching true to show the results
            },
        );
        cleanupRef.current = cleanup;
    }, [researchMode, user?.id]);

    useEffect(() => {
        return () => cleanupRef.current?.();
    }, []);

    const resetSearch = () => {
        setIsSearching(false);
        setQuery('');
        setResult(null);
        setSteps({});
        setError(null);
    };

    return (
        <div className="relative min-h-screen pt-24 overflow-hidden">
            {/* Ambient Background */}
            <div className="mesh-gradient" />

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
                {/* Hero Elements - Disappear during search */}
                <AnimatePresence>
                    {!isSearching && (
                        <motion.div
                            initial={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex flex-col items-center text-center space-y-8 overflow-hidden"
                        >
                            {/* Badge */}
                            <motion.div
                                variants={itemVariants}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-4"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                                    v2.0 Agentic Engine Live
                                </span>
                            </motion.div>

                            {/* Headline */}
                            <div className="relative group">
                                <motion.h1
                                    variants={itemVariants}
                                    className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-5xl mx-auto px-4 relative z-10"
                                >
                                    Research <span className="gradient-text relative inline-block">
                                        Intelligence
                                        <span className="absolute -inset-2 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-reasoning" />
                                    </span> at Scale
                                </motion.h1>
                            </div>

                            <motion.div
                                variants={itemVariants}
                                className="flex items-center gap-3 text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]"
                            >
                                <span className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.span
                                            key={i}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-1 h-1 rounded-full bg-indigo-500"
                                        />
                                    ))}
                                </span>
                                <span>Neural Reasoning Active</span>
                            </motion.div>

                            <motion.p
                                variants={itemVariants}
                                className="text-base md:text-lg text-slate-400 max-w-xl font-medium leading-relaxed"
                            >
                                Deploy a coordinated swarm of 9 AI agents to analyze academic literature,
                                debate perspectives, and surface breakthrough insights in seconds.
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search bar - Always visible, but moves up */}
                <motion.div
                    layout
                    variants={itemVariants}
                    className={cn(
                        "w-full max-w-3xl mx-auto transition-all duration-500",
                        isSearching ? "pt-0 mb-8" : "pt-4"
                    )}
                >
                    <div className="glass-card !p-2 !rounded-2xl glow-border">
                        <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
                    </div>
                    {isSearching && (
                        <button
                            onClick={resetSearch}
                            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-400 flex items-center gap-2 transition-colors mx-auto"
                        >
                            <RotateCcw className="w-3 h-3" /> Start New Research
                        </button>
                    )}
                </motion.div>

                {/* Results / Pipeline - Visible only during search */}
                {isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-6xl mx-auto mt-4 space-y-8"
                    >
                        {/* Top: Full-width Pipeline */}
                        {(isLoading || Object.keys(steps).length > 0) && (
                            <ReasoningPipeline steps={steps} isActive={isLoading} />
                        )}

                        {/* Bottom: Results Panel */}
                        <div className="min-h-[400px]">
                            {isLoading && !result && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="glass rounded-2xl h-32 shimmer border border-white/5" />
                                    ))}
                                </div>
                            )}
                            {result && <ResultsPanel result={result} />}
                        </div>
                    </motion.div>
                )}

                {/* Stats - Disappear during search */}
                <AnimatePresence>
                    {!isSearching && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            variants={itemVariants}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-12 overflow-hidden"
                        >
                            {STATS.map((stat, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <span className={cn(
                                        "text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br",
                                        stat.color
                                    )}>
                                        {stat.value}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-2">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                    <div className="max-w-xl">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Beyond Simple Search
                        </h2>
                        <p className="text-slate-400 font-medium">
                            ResearchPilot doesn't just find papers; it understands them. Our multi-agent
                            orchestration layer transforms raw information into structured intelligence.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-1 w-12 rounded-full bg-indigo-500" />
                        <div className="h-1 w-4 rounded-full bg-white/10" />
                        <div className="h-1 w-4 rounded-full bg-white/10" />
                    </div>
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="glass-card group"
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                                f.bg
                            )}>
                                <f.icon className={cn("w-6 h-6", f.color)} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Orcherstration Visualizer */}
            <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="glass-card overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Cpu className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-white">Swarm Orchestration</h3>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/[0.03]" />)}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Connecting lines (visual only) */}
                        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-y-1/2" />

                        <div className="relative flex flex-wrap justify-center gap-4">
                            {[
                                { name: 'Refiner', icon: Search },
                                { name: 'Planner', icon: Zap },
                                { name: 'Pro Agent', icon: MessageSquare },
                                { name: 'Con Agent', icon: MessageSquare },
                                { name: 'Critic', icon: Shield },
                                { name: 'Moderator', icon: Sparkles }
                            ].map((agent, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-14 h-14 rounded-2xl glass-bright flex items-center justify-center text-slate-400 border border-white/5 relative group cursor-default">
                                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <agent.icon className="w-6 h-6 z-10" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{agent.name}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
