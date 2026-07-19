import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    Search, Loader2, ChevronDown, ChevronUp,
    Network, Radio, MessageSquare, BookOpen,
    Download, ExternalLink, Sparkles, Bot, User
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import type { ResearchDepth } from '../components/SearchBar';
import ReasoningPipeline from '../components/ReasoningPipeline';
import DebateArena from '../components/DebateArena';
import { ExecutiveReport } from '../components/ExecutiveReport';
import { Sidebar } from '../components/Sidebar';
import { RightPanel } from '../components/RightPanel';
import KnowledgeGraph from '../components/KnowledgeGraph';
import ResearchRadio from '../components/ResearchRadio';
import EvidenceStrengthMeter, { hasDisplayableEvidence } from '../components/EvidenceStrengthMeter';
import { analyzeResearch, sendChatMessage, friendlyError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import type { AnalysisResult, PipelineStep } from '../lib/types';
import { cn } from '../lib/utils';

// Advanced tools tab definitions
const ADVANCED_TABS = [
    { id: 'citation-graph', icon: Network, label: 'Citation Graph' },
    { id: 'radio', icon: Radio, label: 'Research Radio' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
    { id: 'sources', icon: BookOpen, label: 'Source Explorer' },
];

function MarkdownContent({ text }: { text: string }) {
    return (
        <ReactMarkdown
            components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                li: ({ children }) => <li className="ml-4 mb-1">{children}</li>,
                strong: ({ children }) => <strong className="text-slate-100 font-semibold">{children}</strong>,
            }}
        >
            {text}
        </ReactMarkdown>
    );
}

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
    
    // UI State
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [advancedTab, setAdvancedTab] = useState('citation-graph');

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
        setIsAdvancedOpen(false);
        setMessages([]);
    }, []);

    useEffect(() => {
        const onNew = () => resetWorkspace();
        window.addEventListener('researchpilot:new-research', onNew);
        return () => window.removeEventListener('researchpilot:new-research', onNew);
    }, [resetWorkspace]);

    const handleSearch = useCallback((q: string, depth: ResearchDepth = 'comprehensive') => {
        cleanupRef.current?.();

        setIsSearching(true);
        setQuery(q);
        setSteps({});
        setResult(null);
        setError(null);
        setIsLoading(true);
        setIsRightPanelOpen(true);
        setIsAdvancedOpen(false);
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

    // Chat handler
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
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I could not answer that just now. Please try again in a moment.',
            }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Export functions
    const exportToBibTeX = () => {
        if (!result) return;
        const bib = result.papers.map((p, i) => {
            const authorPart = p.authors?.[0]?.split(' ')?.[0]?.toLowerCase() || 'anon';
            const key = authorPart + (p.year || '2024') + i;
            return `@article{${key},\n  title={${p.title}},\n  author={${p.authors?.join(' and ') || 'Anonymous'}},\n  year={${p.year || '2024'}},\n  url={${p.url || ''}}\n}`;
        }).join('\n\n');

        const blob = new Blob([bib], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `researchpilot_citations_${result.query_id || 'export'}.bib`;
        a.click();
    };

    const exportToCSV = () => {
        if (!result) return;
        const headers = ['Title', 'Authors', 'Year', 'Source', 'URL'];
        const rows = result.papers.map(p => [
            `"${p.title.replace(/"/g, '""')}"`,
            `"${p.authors?.join(', ').replace(/"/g, '""')}"`,
            p.year,
            p.source,
            p.url
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `researchpilot_citations_${result.query_id || 'export'}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex">
            {/* 1. Left Sidebar */}
            <Sidebar />

            {/* 2. Center Workspace */}
            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300 ml-64",
                isRightPanelOpen && (result || isLoading) ? "mr-80" : "mr-0"
            )}>
                {/* Search / Header Area */}
                <header className="sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/40 px-8 py-6">
                    <div className="max-w-4xl mx-auto">
                        {!isSearching && (
                            <div className="mb-6">
                                <h1 className="text-3xl font-semibold text-slate-50 tracking-tight">Research Workspace</h1>
                                <p className="text-sm text-slate-400 mt-1">Ask a question to synthesize academic and web sources.</p>
                            </div>
                        )}
                        <SearchBar onSubmit={handleSearch} isLoading={isLoading} />
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-10">
                    <div className="max-w-4xl mx-auto space-y-12">
                        
                        {!isSearching && (
                            <div className="h-full flex flex-col items-center justify-center text-center mt-32 opacity-60">
                                <Search className="w-10 h-10 text-slate-600 mb-4" />
                                <h2 className="text-lg font-medium text-slate-300">Start your research</h2>
                                <p className="text-sm text-slate-500 mt-2 max-w-md">
                                    ResearchPilot deploys multiple AI agents to retrieve, debate, and synthesize academic literature.
                                </p>
                            </div>
                        )}

                        {isSearching && (
                            <>
                                {/* Progress Pipeline */}
                                {(isLoading || Object.keys(steps).length > 0) && (
                                    <section>
                                        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                                            Research Pipeline
                                        </h3>
                                        <ReasoningPipeline steps={steps} isActive={isLoading} />
                                    </section>
                                )}

                                {/* Error State */}
                                {error && (
                                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <span>{error}</span>
                                        <button
                                            type="button"
                                            onClick={() => query && handleSearch(query, 'comprehensive')}
                                            className="px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium hover:bg-red-500/20"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {/* Partial evidence trust banner */}
                                {result && isPartialEvidence && (
                                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-sm">
                                        Research completed with partial evidence. Some sources were unavailable or timed out.
                                    </div>
                                )}

                                {/* Multi-Agent Debate Arena — only mounts when debate is active/complete */}
                                <section>
                                    <DebateArena steps={steps} result={result} />
                                </section>

                                {/* Executive Report */}
                                {result && (
                                    <section>
                                        <ExecutiveReport result={result} />
                                    </section>
                                )}

                                {/* ═══════════════════════════════════════════════════════ */}
                                {/* Advanced Research Tools (Expandable Section)            */}
                                {/* ═══════════════════════════════════════════════════════ */}
                                {result && (
                                    <section className="border border-slate-800 rounded-xl overflow-hidden">
                                        {/* Toggle Header */}
                                        <button
                                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                            className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/50 hover:bg-slate-900/70 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                                <span className="text-sm font-semibold text-slate-200">Advanced Research Tools</span>
                                                <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-medium">
                                                    Citation Graph · Radio · Chat · Sources
                                                </span>
                                            </div>
                                            {isAdvancedOpen ? (
                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Expanded Content */}
                                        <AnimatePresence>
                                            {isAdvancedOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 space-y-6 bg-[#020617]">
                                                        {/* Tab Bar */}
                                                        <div className="flex items-center gap-1.5 p-1.5 bg-black/45 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
                                                            {ADVANCED_TABS.map(tab => (
                                                                <button
                                                                    key={tab.id}
                                                                    onClick={() => setAdvancedTab(tab.id)}
                                                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                                                                        advancedTab === tab.id
                                                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                                    }`}
                                                                >
                                                                    <tab.icon className="w-4 h-4" />
                                                                    {tab.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Tab Content */}
                                                        <div className="min-h-[400px]">
                                                            {/* Citation Graph */}
                                                            {advancedTab === 'citation-graph' && (
                                                                <KnowledgeGraph result={result} />
                                                            )}

                                                            {/* Research Radio */}
                                                            {advancedTab === 'radio' && (
                                                                <ResearchRadio context={`Research Summary: ${result.final_insight}\n\nKey Evidence: ${result.key_evidence}`} />
                                                            )}

                                                            {/* AI Chat */}
                                                            {advancedTab === 'chat' && (
                                                                <div className="flex flex-col h-[520px] bg-[#0f172a]/50 border border-slate-800 rounded-xl overflow-hidden">
                                                                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                                                                        {messages.length === 0 ? (
                                                                            <div className="h-full flex items-center justify-center text-center px-6">
                                                                                <div className="max-w-xs">
                                                                                    <MessageSquare className="w-10 h-10 text-indigo-400 mx-auto mb-4 opacity-20" />
                                                                                    <h3 className="text-sm font-bold text-slate-300 mb-2">Interactive Research Assistant</h3>
                                                                                    <p className="text-xs text-slate-500 leading-relaxed">
                                                                                        Ask follow-up questions about this research. The AI will evaluate against retrieved papers.
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                {messages.map((msg, i) => (
                                                                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                                        {msg.role === 'assistant' && (
                                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                                                                <Bot className="w-4 h-4 text-indigo-400" />
                                                                                            </div>
                                                                                        )}
                                                                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                                                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                                                                            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                                                                                        }`}>
                                                                                            <MarkdownContent text={msg.content} />
                                                                                        </div>
                                                                                        {msg.role === 'user' && (
                                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                                                                <User className="w-4 h-4 text-indigo-400" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                                {isChatLoading && (
                                                                                    <div className="flex gap-3 justify-start">
                                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                                                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                                                                        </div>
                                                                                        <div className="bg-white/5 border border-white/10 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm italic">
                                                                                            Formulating response...
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div className="p-4 bg-black/45 border-t border-white/5">
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text"
                                                                                value={chatInput}
                                                                                onChange={(e) => setChatInput(e.target.value)}
                                                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                                                placeholder="Ask a follow-up question..."
                                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all pr-12"
                                                                                disabled={isChatLoading}
                                                                            />
                                                                            <button
                                                                                onClick={handleSendMessage}
                                                                                disabled={isChatLoading || !chatInput.trim()}
                                                                                className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                                                                            >
                                                                                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Source Explorer */}
                                                            {advancedTab === 'sources' && (
                                                                <div className="space-y-6">
                                                                    {result.evidence_analysis && hasDisplayableEvidence(result.evidence_analysis) && (
                                                                        <EvidenceStrengthMeter score={result.evidence_analysis} />
                                                                    )}

                                                                    <div className="bg-[#0f172a]/50 border border-slate-800 rounded-xl p-6 space-y-4">
                                                                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                                                            <div className="flex items-center gap-2 text-indigo-400">
                                                                                <BookOpen className="w-4 h-4" />
                                                                                <h4 className="text-xs font-bold uppercase tracking-widest">Library Sources</h4>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                                                                                {result.papers?.length ?? 0}
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                                                            {(result.papers?.length ?? 0) === 0 ? (
                                                                                <p className="text-sm text-slate-400 py-6 text-center">Waiting for evidence...</p>
                                                                            ) : (
                                                                                result.papers.map((paper, i) => (
                                                                                <div key={paper.id ?? i} className="p-3 bg-black/25 hover:bg-white/[0.02] border border-white/5 rounded-xl transition-all group flex flex-col justify-between gap-2 min-w-0">
                                                                                    <div>
                                                                                        <h5 className="text-xs font-bold text-slate-200 leading-snug truncate group-hover:text-white transition-colors" title={paper.title}>
                                                                                            {paper.title}
                                                                                        </h5>
                                                                                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                                                                                            {paper.authors?.join(', ') || 'Unknown'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-slate-500">
                                                                                        <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5">{paper.source}</span>
                                                                                        {paper.url && (
                                                                                            <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                                                                                                Open <ExternalLink className="w-2.5 h-2.5" />
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                            )}
                                                                        </div>

                                                                        {/* Export tools */}
                                                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                                                            <button
                                                                                onClick={exportToBibTeX}
                                                                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest transition-all"
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" />
                                                                                BibTeX
                                                                            </button>
                                                                            <button
                                                                                onClick={exportToCSV}
                                                                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-[10px] font-bold text-teal-300 uppercase tracking-widest transition-all"
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" />
                                                                                CSV
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* 3. Right Panel (Collapsible) */}
            <RightPanel 
                isOpen={isRightPanelOpen && (!!result || isLoading)} 
                onClose={() => setIsRightPanelOpen(false)} 
                result={result}
                isLoading={isLoading}
            />
        </div>
    );
}
