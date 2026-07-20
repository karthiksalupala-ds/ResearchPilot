import { Loader2, MessageSquare, Sparkles, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIChatPanelProps {
    messages: Message[];
    chatInput: string;
    setChatInput: (val: string) => void;
    handleSendMessage: () => void;
    isChatLoading: boolean;
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

export default function AIChatPanel({
    messages,
    chatInput,
    setChatInput,
    handleSendMessage,
    isChatLoading
}: AIChatPanelProps) {
    return (
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
    );
}
