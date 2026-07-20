import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, Network, Radio, MessageSquare } from 'lucide-react';
import type { AnalysisResult } from '../lib/types';
import { ExecutiveReport } from './ExecutiveReport';
import { RightPanel } from './RightPanel';
import SourceExplorer from './SourceExplorer';
import DebateArena from './DebateArena';

const KnowledgeGraph = lazy(() => import('./KnowledgeGraph'));
const ResearchRadio = lazy(() => import('./ResearchRadio'));
const AIChatPanel = lazy(() => import('./AIChatPanel'));

import { sendChatMessage } from '../lib/api';
import { cn } from '../lib/utils';

interface ResultsPanelProps {
    result: AnalysisResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
    // Accordions and UI state (all collapsed by default)
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [isDebateOpen, setIsDebateOpen] = useState(false);
    const [isGraphOpen, setIsGraphOpen] = useState(false);
    const [isRadioOpen, setIsRadioOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Automatically open right side panel only when complete research evidence is resolved
    useEffect(() => {
        if (result && result.papers && result.papers.length > 0) {
            setIsRightPanelOpen(true);
        } else {
            setIsRightPanelOpen(false);
        }
    }, [result]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

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
        <div className="flex relative overflow-hidden animate-fade-in font-sans min-h-screen">
            
            {/* Center Content Workspace */}
            <div className={cn(
                "flex-1 transition-all duration-300 overflow-y-auto px-4 pb-20",
                isRightPanelOpen ? "mr-80" : "mr-0"
            )}>
                <div className="max-w-3xl mx-auto space-y-10">
                    
                    {/* Link back to home */}
                    <div className="pb-2">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to workspace
                        </Link>
                    </div>

                    {/* 1. Executive Summary Report (The Hero) */}
                    <section className="mb-10">
                        <ExecutiveReport result={result} />
                    </section>

                    {/* 2. Sources Accordion */}
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

                    {/* 3. Advanced Tools Accordions */}
                    <section className="space-y-4">
                        <div className="pt-2 pb-1">
                            <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Advanced Research Tools</h4>
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
                                    <DebateArena steps={{}} result={result} />
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
                </div>
            </div>

            {/* Right Panel sidebar (opens automatically ONLY when evidence is complete) */}
            <RightPanel
                isOpen={isRightPanelOpen && !!result && result.papers && result.papers.length > 0}
                onClose={() => setIsRightPanelOpen(false)}
                result={result}
                isLoading={false}
            />
        </div>
    );
}
