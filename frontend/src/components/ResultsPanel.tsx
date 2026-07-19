import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AnalysisResult } from '../lib/types';
import PaperCard from './PaperCard';
import EvidenceStrengthMeter from './EvidenceStrengthMeter';
import {
    HelpCircle, Map, BookOpen, ThumbsUp, ThumbsDown,
    Zap, AlertTriangle, Shield, Search, Lightbulb, FileText, Sparkles,
    Download, ClipboardCheck, Share2, MessageSquare, Network, User, Bot, Loader2, Radio
} from 'lucide-react';
import KnowledgeGraph from './KnowledgeGraph';
import ResearchRadio from './ResearchRadio';
import { sendChatMessage } from '../lib/api';

interface ResultsPanelProps {
    result: AnalysisResult;
}

const TABS = [
    { id: 'overview', icon: FileText, label: 'Final Insight' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
    { id: 'radio', icon: Radio, label: 'Research Radio' },
    { id: 'arguments', icon: Zap, label: 'Arguments' },
    { id: 'evaluation', icon: AlertTriangle, label: 'Evaluation' },
    { id: 'graph', icon: Network, label: 'Knowledge Graph' },
    { id: 'evidence', icon: Shield, label: 'Evidence' },
    { id: 'gaps', icon: Search, label: 'Research Gaps' },
    { id: 'papers', icon: BookOpen, label: 'Papers' },
];

function Section({ icon: Icon, title, color, children }: {
    icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) {
    return (
        <div className="glass rounded-xl p-5 animate-slide-up">
            <div className={`flex items-center gap-2 mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
                <h4 className="font-semibold text-sm">{title}</h4>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none">
                {children}
            </div>
        </div>
    );
}

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

export default function ResultsPanel({ result }: ResultsPanelProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

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

    const exportToBibTeX = () => {
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
        <div className="space-y-4 animate-fade-in">
            {/* Tab bar */}
            <div className="flex items-center gap-1 p-1 glass rounded-xl overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="space-y-3">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* New Hero Insight Card */}
                        <div className="relative group animate-slide-up">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-600 via-purple-600 to-emerald-500 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
                            <div className="relative glass-bright rounded-2xl p-6 border border-white/10 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg tracking-tight">Executive Research Summary</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Balanced Synthesis</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex border border-white/5 bg-white/5 px-2.5 py-1 rounded-full items-center gap-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Pilot-IQ 1.0</span>
                                    </div>
                                </div>

                                <div className="text-slate-200 text-base leading-relaxed font-medium prose prose-invert max-w-none">
                                    <MarkdownContent text={result.final_insight} />
                                </div>

                                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`w-6 h-6 rounded-full border-2 border-[#0B0F1A] bg-brand-${500 + i * 100} flex items-center justify-center text-[8px] font-bold text-white`}>
                                                    AI
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium italic">Multi-consensus analysis verified</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={exportToBibTeX}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            BibTeX
                                        </button>
                                        <button
                                            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                                            title="Share Research"
                                        >
                                            <Share2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Section icon={Map} title="Research Strategy" color="text-brand-400">
                                <MarkdownContent text={result.research_strategy} />
                            </Section>
                            <Section icon={BookOpen} title="Key Evidence Summary" color="text-purple-400">
                                <MarkdownContent text={result.key_evidence} />
                            </Section>
                        </div>
                    </div>
                )}

                {activeTab === 'arguments' && (
                    <>
                        <Section icon={ThumbsUp} title="Supporting Arguments" color="text-emerald-400">
                            <MarkdownContent text={result.supporting_arguments} />
                        </Section>
                        <Section icon={ThumbsDown} title="Counterarguments" color="text-red-400">
                            <MarkdownContent text={result.counterarguments} />
                        </Section>
                        <Section icon={AlertTriangle} title="Points of Contention" color="text-amber-400">
                            <MarkdownContent text={result.contradictions} />
                        </Section>
                        <Section icon={Shield} title="Critical Evaluation" color="text-purple-400">
                            <MarkdownContent text={result.critical_evaluation} />
                        </Section>
                    </>
                )}

                {activeTab === 'evidence' && (
                    <EvidenceStrengthMeter score={result.evidence_analysis} />
                )}

                {activeTab === 'evaluation' && (
                    <div className="space-y-4">
                        <Section icon={AlertTriangle} title="Points of Contention" color="text-amber-400">
                            <MarkdownContent text={result.contradictions} />
                        </Section>
                        <Section icon={Lightbulb} title="Scientific Evaluation" color="text-brand-400">
                            <MarkdownContent text={result.critical_evaluation} />
                        </Section>
                    </div>
                )}

                {activeTab === 'gaps' && (
                    <Section icon={Search} title="Research Gaps & Future Directions" color="text-teal-400">
                        <MarkdownContent text={result.research_gaps} />
                    </Section>
                )}

                {activeTab === 'radio' && (
                    <ResearchRadio context={`Research Summary: ${result.final_insight}\n\nKey Evidence: ${result.key_evidence}`} />
                )}

                {activeTab === 'graph' && (
                    <KnowledgeGraph papers={result.papers} query={result.original_query} />
                )}

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-[500px] glass rounded-2xl overflow-hidden animate-slide-up">
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center px-6">
                                    <div className="max-w-xs">
                                        <MessageSquare className="w-10 h-10 text-brand-400 mx-auto mb-4 opacity-20" />
                                        <h3 className="text-sm font-bold text-slate-300 mb-2">Interactive Research Chat</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Ask follow-up questions about this research. The AI panel will use the retrieved papers to answer.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="w-4 h-4 text-brand-400" />
                                                </div>
                                            )}
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-brand-600 text-white rounded-tr-none'
                                                : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                                                }`}>
                                                <MarkdownContent text={msg.content} />
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-brand-400" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="flex gap-3 justify-start">
                                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                                                <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
                                            </div>
                                            <div className="bg-white/5 border border-white/10 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm italic">
                                                Thinking...
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="p-4 bg-black/20 border-t border-white/5">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask a follow-up question..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/40 transition-all pr-12"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading || !chatInput.trim()}
                                    className="absolute right-2 top-1.5 p-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-all disabled:opacity-50"
                                >
                                    {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'papers' && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-500">
                                {result.papers.length} papers retrieved from arXiv, Semantic Scholar, and PubMed
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportToBibTeX}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 hover:text-white transition-colors"
                                >
                                    <Download className="w-3 h-3" /> Export BibTeX
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 hover:text-white transition-colors"
                                >
                                    <FileText className="w-3 h-3" /> Export CSV
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {result.papers.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-8">No papers stored for this query.</p>
                            )}
                            {result.papers.map((paper, i) => (
                                <PaperCard key={paper.id ?? i} paper={paper} index={i} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
