import { useState, useRef, useCallback } from 'react';
import { ChevronRight, Mic, MicOff, Paperclip, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const EXAMPLE_QUERIES = [
    'Does intermittent fasting improve metabolic health?',
    'What is the effect of sleep deprivation on cognitive performance?',
    'How effective is CRISPR-Cas9 in treating genetic disorders?',
];

export type ResearchDepth = 'standard' | 'comprehensive';

interface SearchBarProps {
    onSubmit: (query: string, depth: ResearchDepth) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSubmit, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    // Pro = comprehensive debate; Quick = standard fast synthesis
    const [mode, setMode] = useState<'pro' | 'quick'>('pro');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    const handleSubmit = useCallback(() => {
        const trimmed = query.trim();
        if (!trimmed || isLoading) return;
        const depth: ResearchDepth = mode === 'pro' ? 'comprehensive' : 'standard';
        onSubmit(trimmed, depth);
    }, [query, isLoading, onSubmit, mode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
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
        <div className="w-full">
            <div
                className={cn(
                    "relative rounded-xl transition-all duration-300 overflow-hidden border",
                    focused
                        ? "bg-slate-900 border-slate-700 shadow-md ring-1 ring-indigo-500/20"
                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                )}
            >
                <div className="flex items-start p-4">
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent resize-none outline-none text-slate-200 placeholder-slate-500 text-base leading-relaxed min-h-[50px] max-h-[200px]"
                        rows={1}
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center justify-between px-4 pb-3">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled
                            title="Coming soon"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 cursor-not-allowed opacity-60"
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                            Attach
                            <span className="text-[9px] uppercase tracking-wide text-slate-600">Soon</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode(mode === 'pro' ? 'quick' : 'pro')}
                            title={mode === 'pro' ? 'Pro: full multi-agent debate' : 'Quick: fast synthesis'}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                                mode === 'pro'
                                    ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            )}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {mode === 'pro' ? 'Pro' : 'Quick'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleListening}
                            disabled={isLoading}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isListening
                                    ? "bg-red-500/10 text-red-400"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            )}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!query.trim() || isLoading}
                            className="p-2 rounded-lg bg-indigo-500 text-white disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-600 transition-colors flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {!query && !focused && !isLoading && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {EXAMPLE_QUERIES.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => { setQuery(q); textareaRef.current?.focus(); }}
                            className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/30 text-xs text-slate-400 hover:text-slate-300 hover:border-slate-700 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
