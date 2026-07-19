import { X, Settings, Database, Cpu, Globe, Layout, ShieldCheck, Zap, BookOpen, Search, Library } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import FileUpload from './FileUpload';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { researchMode, setResearchMode, compactView, setCompactView } = useSettings();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-lg glass-bright rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
                            <Settings className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
                            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold opacity-70">ResearchPilot v1.0.4</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Research Mode Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-400">
                            <Zap className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Research Intensity</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'academic', label: 'Academic', icon: BookOpen, desc: 'Precise' },
                                { id: 'journalistic', label: 'Journalistic', icon: Globe, desc: 'Engaging' },
                                { id: 'skeptic', label: 'Skeptic', icon: ShieldCheck, desc: 'Critical' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setResearchMode(mode.id as any)}
                                    className={`p-3 rounded-2xl border transition-all text-left ${researchMode === mode.id
                                        ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                                        : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                                        }`}
                                >
                                    <mode.icon className="w-4 h-4 mb-2" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest leading-none mb-1">{mode.label}</p>
                                    <p className="text-[9px] opacity-60 font-medium">{mode.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Intelligence Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-400">
                            <Cpu className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Intelligence Engine</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-white">Multi-LLM Debate</p>
                                    <p className="text-[11px] text-slate-500">Run 5 agents concurrently for balanced views</p>
                                </div>
                                <div className="w-10 h-5 bg-brand-600 rounded-full relative flex items-center px-1">
                                    <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto shadow-sm" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-white">Intelligent Fallback</p>
                                    <p className="text-[11px] text-slate-500">Auto-switch providers on API failure</p>
                                </div>
                                <div className="w-10 h-5 bg-brand-600 rounded-full relative flex items-center px-1">
                                    <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-400">
                            <Globe className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Retrieval Sources</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {['ArXiv', 'PubMed', 'Semantic Scholar', 'Google Search'].map(source => (
                                <div key={source} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300">{source}</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Library Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Library className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Personal Research Library</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                Upload your own PDF documents. We'll automatically index and chunk them so the AI can use them as primary sources in your research.
                            </p>
                            <FileUpload userId="demo-user" />
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Layout className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">UI Experience</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Compact Results View</span>
                                <input
                                    type="checkbox"
                                    checked={compactView}
                                    onChange={(e) => setCompactView(e.target.checked)}
                                    className="accent-brand-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Show Internal Reasoning</span>
                                <input type="checkbox" checked={true} className="accent-brand-500" readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 opacity-60" />
                        <div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-tight">Security & Privacy</p>
                            <p className="text-[11px] text-slate-500">ResearchPilot does not train on your personal data.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
