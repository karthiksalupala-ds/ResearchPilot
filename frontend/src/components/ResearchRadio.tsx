import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Mic, Volume2, Radio, Sparkles, Loader2, Quote } from 'lucide-react';

interface ScriptTurn {
    speaker: string;
    text: string;
    audio_url?: string;
}

interface ResearchRadioProps {
    context: string;
}

export default function ResearchRadio({ context }: ResearchRadioProps) {
    const [script, setScript] = useState<ScriptTurn[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleInterruption = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice interaction is not supported in this browser.');
            return;
        }

        // Stop radio playback while listening
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setIsLoading(true);
            try {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const res = await fetch(`${apiBase}/research/radio/interact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: transcript, context }),
                });
                const data = await res.json();

                // Add the response to the script or play it immediately
                const responseTurn = { speaker: 'Alloy', text: data.response, audio_url: data.audio_url };
                setScript(prev => [...prev.slice(0, currentIndex + 1), responseTurn, ...prev.slice(currentIndex + 1)]);
                setCurrentIndex(prev => prev + 1);
                setIsPlaying(true);
            } catch (err) {
                console.error('Interruption failed', err);
            } finally {
                setIsLoading(false);
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const startRadio = async () => {
        setIsLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/research/radio/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context }),
            });
            const data = await res.json();
            setScript(data.script);
            setCurrentIndex(0);
            setIsPlaying(true);
        } catch (err) {
            console.error('Radio start failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < script.length && isPlaying) {
            const turn = script[currentIndex];
            if (turn.audio_url) {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                audioRef.current = new Audio(`${apiBase}${turn.audio_url}`);
                audioRef.current.play();
                audioRef.current.onended = () => {
                    if (currentIndex < script.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                    } else {
                        setIsPlaying(false);
                    }
                };
            }
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [currentIndex, isPlaying, script]);

    return (
        <div className="flex flex-col h-[500px] glass rounded-3xl overflow-hidden animate-scale-in">
            {/* Radio Header */}
            <div className="p-6 border-b border-white/10 bg-brand-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
                        <Radio className={`w-5 h-5 text-brand-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Debate</h3>
                        <p className="text-[10px] text-brand-400 font-bold uppercase opacity-60">Live Academic Debate</p>
                    </div>
                </div>
                {currentIndex >= 0 && (
                    <div className="flex items-center gap-1">
                        <div className={`w-1 h-3 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]`} />
                        <div className={`w-1 h-5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.1s]`} />
                        <div className={`w-1 h-2 rounded-full bg-brand-300 animate-bounce [animation-delay:-0.2s]`} />
                    </div>
                )}
            </div>

            {/* Script Area */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Visualizer Mocks */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className={`w-64 h-64 border-2 border-brand-500 rounded-full transition-all duration-1000 ${isPlaying ? 'scale-150 opacity-0' : 'scale-100'}`} />
                    <div className={`w-48 h-48 border-2 border-brand-400 rounded-full transition-all duration-700 ${isPlaying ? 'scale-150 opacity-0' : 'scale-100'}`} />
                </div>

                {currentIndex === -1 ? (
                    <div className="text-center max-w-xs animate-slide-up">
                        <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
                            <Sparkles className="w-8 h-8 text-brand-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Transform findings into dialogue.</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-8">
                            Our agents Alloy and Shimmer will discuss the core arguments of this research in a conversational format.
                        </p>
                        <button
                            onClick={startRadio}
                            disabled={isLoading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Initialize Broadcast
                        </button>
                    </div>
                ) : (
                    <div className="w-full space-y-8 animate-fade-in relative z-10">
                        <div className="flex flex-col items-center text-center px-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${script[currentIndex]?.speaker === 'Alloy'
                                    ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                    }`}>
                                    {script[currentIndex]?.speaker}
                                </span>
                            </div>
                            <div className="relative">
                                <Quote className="absolute -top-6 -left-6 w-8 h-8 text-white/5" />
                                <p className="text-xl md:text-2xl font-medium text-white leading-tight tracking-tight italic">
                                    "{script[currentIndex]?.text}"
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="max-w-md mx-auto h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 transition-all duration-500"
                                style={{ width: `${((currentIndex + 1) / script.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Audio Controls */}
            {currentIndex >= 0 && (
                <div className="p-8 bg-black/20 backdrop-blur-md border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
                            </button>
                            <button
                                onClick={() => currentIndex < script.length - 1 && setCurrentIndex(prev => prev + 1)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={toggleInterruption}
                            className={`flex items-center gap-4 px-4 py-2 rounded-full border transition-all cursor-pointer group ${isListening
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-white/5 border-white/10 hover:border-brand-500/30'
                                }`}
                        >
                            <Mic className={`w-4 h-4 ${isListening ? 'animate-ping' : 'text-brand-400 opacity-60'}`} />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                {isListening ? 'Listening...' : 'Listen & Interrupt'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
