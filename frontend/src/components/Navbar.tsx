import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FlaskConical, BookOpen, LogOut, User, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { cn } from '../lib/utils';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled
                    ? "bg-surface-900/80 backdrop-blur-xl border-white/10 py-3"
                    : "bg-transparent border-transparent py-5"
            )}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                <FlaskConical className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface-900 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                                Research<span className="text-indigo-500">Pilot</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 -mt-1">
                                Agentic Engine
                            </span>
                        </div>
                    </Link>

                    {/* Nav Action Area */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none"
                            title="Engine Settings"
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 pl-2 pr-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-200 transition-all border border-white/5"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Disconnect Engine"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Get Started
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </>
    );
}

// Support both default and named imports
export { Navbar };
