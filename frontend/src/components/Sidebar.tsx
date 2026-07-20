import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, FileText, Search, Clock, Folder, LogOut } from 'lucide-react';

function ComingSoonLabel() {
    return (
        <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-600 font-medium">
            Soon
        </span>
    );
}

export const Sidebar = React.memo(() => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleNewResearch = () => {
        navigate('/');
        window.dispatchEvent(new CustomEvent('researchpilot:new-research'));
    };

    const handleHistory = () => {
        if (user) {
            navigate('/profile');
        } else {
            window.dispatchEvent(new CustomEvent('researchpilot:open-auth'));
        }
    };

    const handleSettings = () => {
        window.dispatchEvent(new CustomEvent('researchpilot:open-settings'));
    };

    return (
        <aside className="w-64 h-screen bg-[#020617] border-r border-slate-800/60 flex flex-col fixed left-0 top-0 z-20">
            <div className="p-5 flex items-center gap-3 border-b border-slate-800/40">
                <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="font-semibold text-slate-200 tracking-tight text-sm">ResearchPilot</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">Workspace</h3>
                    <nav className="space-y-0.5">
                        <button
                            type="button"
                            onClick={handleNewResearch}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors"
                        >
                            <Search className="w-4 h-4 text-slate-400" />
                            New Research
                        </button>
                        <button
                            type="button"
                            onClick={handleHistory}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-md transition-colors"
                        >
                            <Clock className="w-4 h-4" />
                            History
                        </button>
                    </nav>
                </div>

                <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">Library</h3>
                    <nav className="space-y-0.5">
                        <button
                            type="button"
                            disabled
                            title="Coming soon — available after the hackathon"
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-slate-600 rounded-md cursor-not-allowed opacity-70"
                        >
                            <FileText className="w-4 h-4" />
                            Saved Reports
                            <ComingSoonLabel />
                        </button>
                        <button
                            type="button"
                            disabled
                            title="Coming soon — available after the hackathon"
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-slate-600 rounded-md cursor-not-allowed opacity-70"
                        >
                            <Folder className="w-4 h-4" />
                            Collections
                            <ComingSoonLabel />
                        </button>
                    </nav>
                </div>
            </div>

            <div className="p-3 border-t border-slate-800/40 space-y-1">
                <button
                    type="button"
                    onClick={handleSettings}
                    className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
                <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-between px-2 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="truncate max-w-[120px]">{user?.email || 'Guest'}</span>
                    </div>
                    <LogOut className="w-3.5 h-3.5 opacity-60" />
                </button>
            </div>
        </aside>
    );
});
