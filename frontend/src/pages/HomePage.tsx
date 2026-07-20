import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Search, Loader2, Sparkles, BookOpen, Network, Radio, MessageSquare, Flame } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import type { ResearchDepth } from '../components/SearchBar';
import ReasoningPipeline from '../components/ReasoningPipeline';
import DebateArena from '../components/DebateArena';
import { ExecutiveReport } from '../components/ExecutiveReport';
import { Sidebar } from '../components/Sidebar';
import { RightPanel } from '../components/RightPanel';
import SourceExplorer from '../components/SourceExplorer';

const KnowledgeGraph = lazy(() => import('../components/KnowledgeGraph'));
const ResearchRadio = lazy(() => import('../components/ResearchRadio'));
const AIChatPanel = lazy(() => import('../components/AIChatPanel'));

import { analyzeResearch, sendChatMessage, friendlyError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import type { AnalysisResult, PipelineStep } from '../lib/types';
import { cn } from '../lib/utils';

export default function HomePage() {
    const { user } = useAuth();
    const { researchMode } = useSettings();

    // Research State
    const [isSearching, setIsSearching] = useState(false);
    const [query, setQuery] = useState('');
    const [steps, setSteps] = useState<Record<string, PipelineStep>>({});
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Accordions and UI state (all collapsed by default)
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [isPipelineOpen, setIsPipelineOpen] = useState(false);
    const [isDebateOpen, setIsDebateOpen] = useState(false);
    const [isGraphOpen, setIsGraphOpen] = useState(false);
    const [isRadioOpen, setIsRadioOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const cleanupRef = useRef<(() => void) | null>(null);

    const resetWorkspace = useCallback(() => {
        cleanupRef.current?.();
        setIsSearching(false);
        setQuery('');
        setSteps({});
        setResult(null);
        setError(null);
        setIsLoading(false);
        setIsRightPanelOpen(false);
        setIsPipelineOpen(false);
        setIsDebateOpen(false);
        setIsGraphOpen(false);
        setIsRadioOpen(false);
        setIsChatOpen(false);
        setIsSourcesOpen(false);
        setMessages([]);
    }, []);

    useEffect(() => {
        const onNew = () => resetWorkspace();
        window.addEventListener('researchpilot:new-research', onNew);
        return () => window.removeEventListener('researchpilot:new-research', onNew);
    }, [resetWorkspace]);

    // Automatically open right side panel only when complete research evidence is resolved
    useEffect(() => {
        if (result && result.papers && result.papers.length > 0) {
            setIsRightPanelOpen(true);
        } else {
            setIsRightPanelOpen(false);
        }
    }, [result]);

    const handleSearch = useCallback((q: string, depth: ResearchDepth = 'comprehensive') => {
        cleanupRef.current?.();

        setIsSearching(true);
        setQuery(q);
        setSteps({});
        setResult(null);
        setError(null);
        setIsLoading(true);
        setIsRightPanelOpen(false);
        setIsPipelineOpen(false);
        setIsDebateOpen(false);
        setIsGraphOpen(false);
        setIsRadioOpen(false);
        setIsChatOpen(false);
        setIsSourcesOpen(false);
        setMessages([]);

        const requestPayload = {
            query: q,
            research_mode: researchMode,
            depth,
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
                setError(friendlyError(msg));
                setIsLoading(false);
            },
            () => {
                setIsLoading(false);
            },
        );
        cleanupRef.current = cleanup;
    }, [researchMode, user?.id]);

    useEffect(() => {
        return () => cleanupRef.current?.();
    }, []);

    const isPartialEvidence = !!result && (
        !result.papers?.length ||
        (result.evidence_analysis?.paper_count ?? 0) < 3 ||
        result.evidence_analysis?.label === 'Insufficient'
    );

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading || !result) return;

        const userMsg = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const context = `
                User Query: ${result.original_query}
                Final Insight: ${result.final_insight}
                Papers: ${result.papers.map(p => p.title).join(', ')}
            `;
            const { response } = await sendChatMessage({
                query: result.original_query,
                context,
                message: userMsg,
                history: messages
            });
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Center Workspace */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 ml-64 overflow-y-auto",
                isRightPanelOpen ? "mr-80" : "mr-0"
            )}>
                {/* Search Header */}
                <header className="sticky top-0 z-10 bg-[#020617]/85 backdrop-blur-md border-b border-slate-900 px-8 py-6">
                    <div className="max-w-3xl mx-auto">
                        {!isSearching && (
                            <div className="mb-6">
                                <h1 className="text-3xl font-semibold text-slate-50 tracking-tight">Research Workspace</h1>
                                <p className="text-sm text-slate-400 mt-1">Ask a question to synthesize academic and web sources.</p>
                            </div>
                        )}
                        <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
                    </div>
                </header>

                {/* Main Content Viewport */}
                <div className="flex-1 px-8 py-10">
                    <div className="max-w-3xl mx-auto space-y-10">
                        
                        {!isSearching && (
                            <div className="h-full flex flex-col items-center justify-center text-center mt-32 opacity-50">
                                <Search className="w-9 h-9 text-slate-650 mb-3" />
                                <h2 className="text-md font-medium text-slate-350">Start your research</h2>
                                <p className="text-xs text-slate-500 mt-2 max-w-sm">
                                    ResearchPilot deploys multiple AI agents to retrieve, debate, and synthesize academic literature.
                                </p>
                            </div>
                        )}

                        {isSearching && (
                            <div className="space-y-8">
                                {/* Compact Active Pipeline Summary Line */}
                                {(isLoading || Object.keys(steps).length > 0) && !result && (
                                    <ReasoningPipeline steps={steps} isActive={isLoading} />
                                )}

                                {/* Error Display */}
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <span>{error}</span>
                                        <button
                                            type="button"
                                            onClick={() => query && handleSearch(query, 'comprehensive')}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/20"
                                        >
                                            RETRY
                                        </button>
                                    </div>
                                )}

                                {/* Partial evidence trust banner */}
                                {result && isPartialEvidence && (
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-205 text-xs">
                                        Research completed with partial evidence. Some sources were unavailable or timed out.
                                    </div>
                                )}

                                {/* 1. The Executive Summary Report Document (The Hero of the Page) */}
                                {result && (
                                    <section className="mb-10">
                                        <ExecutiveReport result={result} />
                                    </section>
                                )}

                                {/* 2. Collapsible Sources Accordion (Step 8 in Hierarchy) */}
                                {result && (
                                    <section className="border-t border-slate-800/40 pt-8 space-y-4">
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isSourcesOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">Explore Sources</span>
                                                </span>
                                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono font-bold">
                                                    {result.papers?.length || 0} papers
                                                </span>
                                            </button>
                                            {isSourcesOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <SourceExplorer result={result} />
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* 3. Collapsible Advanced Research Tools (Step 9 in Hierarchy) */}
                                {result && (
                                    <section className="space-y-4">
                                        <div className="pt-2 pb-1">
                                            <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Advanced Research Tools</h4>
                                        </div>

                                        {/* Accordion: View Research Process */}
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsPipelineOpen(!isPipelineOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isPipelineOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">View Research Process</span>
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">Stepping Metrics</span>
                                            </button>
                                            {isPipelineOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <ReasoningPipeline steps={steps} isActive={isLoading} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion: View Expert Debate */}
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsDebateOpen(!isDebateOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isDebateOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">View Expert Debate</span>
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">Pro vs Con Arena</span>
                                            </button>
                                            {isDebateOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <DebateArena steps={steps} result={result} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion: View Citation Network */}
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsGraphOpen(!isGraphOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isGraphOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">View Citation Network</span>
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">Graph Model</span>
                                            </button>
                                            {isGraphOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <Suspense fallback={<div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 gap-2"><Loader2 className="w-6 h-6 animate-spin text-indigo-400"/><span>Loading Citation Graph...</span></div>}>
                                                        <KnowledgeGraph result={result} />
                                                    </Suspense>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion: Listen to Research Podcast */}
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsRadioOpen(!isRadioOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isRadioOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">Listen to Research Podcast</span>
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">Audio Cast</span>
                                            </button>
                                            {isRadioOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <Suspense fallback={<div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 gap-2"><Loader2 className="w-6 h-6 animate-spin text-brand-400"/><span>Loading Research Radio...</span></div>}>
                                                        <ResearchRadio context={`Research Summary: ${result.final_insight}`} />
                                                    </Suspense>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accordion: Open AI Research Assistant */}
                                        <div className="border border-slate-900 bg-slate-950/20 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setIsChatOpen(!isChatOpen)}
                                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors text-xs font-bold text-slate-400"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">{isChatOpen ? '▼' : '▶'}</span>
                                                    <span className="uppercase tracking-widest">Open AI Research Assistant</span>
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-bold uppercase">Interactive QA</span>
                                            </button>
                                            {isChatOpen && (
                                                <div className="p-5 border-t border-slate-900 bg-slate-950/40">
                                                    <Suspense fallback={<div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 gap-2"><Loader2 className="w-6 h-6 animate-spin text-indigo-400"/><span>Loading Chat Panel...</span></div>}>
                                                        <AIChatPanel
                                                            messages={messages}
                                                            chatInput={chatInput}
                                                            setChatInput={setChatInput}
                                                            handleSendMessage={handleSendMessage}
                                                            isChatLoading={isChatLoading}
                                                        />
                                                    </Suspense>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Right Panel (Collapsible sidebar, opens automatically ONLY when evidence is complete) */}
            <RightPanel 
                isOpen={isRightPanelOpen && !!result && result.papers && result.papers.length > 0} 
                onClose={() => setIsRightPanelOpen(false)} 
                result={result}
                isLoading={isLoading}
            />
        </div>
    );
}
