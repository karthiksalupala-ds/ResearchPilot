import { useState, useRef, useCallback } from 'react';
import { Search, Sparkles, ChevronRight, Mic, MicOff, Paperclip, Image as ImageIcon, Globe, BrainCircuit, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const EXAMPLE_QUERIES = [
    'Does intermittent fasting improve metabolic health?',
    'What is the effect of sleep deprivation on cognitive performance?',
    'How effective is CRISPR-Cas9 in treating genetic disorders?',
    'Does social media use cause depression in adolescents?',
    'What are the long-term effects of mindfulness meditation on brain structure?',
];

interface SearchBarProps {
    onSubmit: (query: string) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [model, setModel] = useState<'agentic' | 'speed' | 'synthesis'>('agentic');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = useCallback(() => {
        const trimmed = query.trim();
        if (!trimmed || isLoading) return;
        onSubmit(trimmed);
    }, [query, isLoading, onSubmit]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleExample = (q: string) => {
        setQuery(q);
        textareaRef.current?.focus();
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Main input */}
            <div
                className={cn(
                    "relative rounded-2xl transition-all duration-500 glass-bright group/search",
                    focused
                        ? "ring-2 ring-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-indigo-500/5"
                        : "ring-1 ring-white/10 hover:ring-white/20"
                )}
            >
                <div className="flex items-start gap-4 p-5">
                    <div className={cn(
                        "mt-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        focused ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-500"
                    )}>
                        <Search className="w-5 h-5" />
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Ask a research question..."
                        className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder-slate-500 text-lg leading-relaxed min-h-[50px] max-h-[160px] py-1"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={cn(
                            "mt-1 p-2.5 rounded-xl transition-all active:scale-95",
                            isListening
                                ? "bg-red-500/20 text-red-400 animate-pulse"
                                : "text-slate-500 hover:text-indigo-400 hover:bg-white/5"
                        )}
                        title={isListening ? 'Stop Listening' : 'Voice Search'}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-5 pb-4 pt-1">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⏎</span>
                            <span>Analyze</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⇧⏎</span>
                            <span>Newline</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
                            title="Upload PDF"
                        >
                            <Paperclip className="w-4 h-4" />
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" />
                        </button>
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-all active:scale-95"
                            title="Upload Image"
                        >
                            <ImageIcon className="w-4 h-4" />
                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" />
                        </button>
                        <div className="h-4 w-px bg-white/10 mx-1" />

                        {/* Model Switcher */}
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setModel('agentic')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    model === 'agentic' ? "bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <BrainCircuit className="w-3 h-3" />
                                <span>Agentic</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModel('speed')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    model === 'speed' ? "bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Zap className="w-3 h-3" />
                                <span>Speed</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setModel('synthesis')}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    model === 'synthesis' ? "bg-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Globe className="w-3 h-3" />
                                <span>Deep</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!query.trim() || isLoading}
                        className="btn-primary !px-6 !py-2.5 !text-sm group/btn"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </span>
                                Thinking…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
                                Search
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Example queries */}
            <div className="mt-8 flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 px-3 py-1 border-t border-white/5">
                    Research Starters
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {EXAMPLE_QUERIES.slice(0, 3).map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handleExample(q)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400
                         border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5
                         transition-all duration-300 disabled:opacity-50 active:scale-95"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500" />
                            {q.length > 50 ? q.slice(0, 50) + '…' : q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
