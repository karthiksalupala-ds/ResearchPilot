import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, Search, Calendar } from 'lucide-react';
import { fetchResearchHistory } from '../lib/api';

interface SavedQuery {
    id: string;
    user_query: string;
    refined_query: string;
    timestamp: string;
}

export function ProfilePage() {
    const { user, session, loading } = useAuth();
    const [history, setHistory] = useState<SavedQuery[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !session) return;

        const loadHistory = async () => {
            setFetching(true);
            setError(null);
            try {
                const data = await fetchResearchHistory(session.access_token);
                setHistory((data.queries as SavedQuery[]) || []);
            } catch (err) {
                console.error('Failed to fetch history:', err);
                setError(err instanceof Error ? err.message : 'Could not load history.');
                setHistory([]);
            } finally {
                setFetching(false);
            }
        };

        loadHistory();
    }, [user, session]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in pt-24">
            <div className="glass rounded-2xl overflow-hidden mb-8">
                <div className="px-6 py-8 border-b border-white/10 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-brand-500/20 flex flex-shrink-0 items-center justify-center border border-brand-500/30">
                        <span className="text-2xl font-semibold text-brand-300">
                            {user.email?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">User Profile</h3>
                        <p className="text-brand-200/80">{user.email}</p>
                    </div>
                </div>
            </div>

            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-400" />
                Your Search History
            </h4>

            {fetching ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
            ) : error ? (
                <div className="glass rounded-xl p-6 border border-red-500/20 text-red-400 text-sm space-y-3">
                    <p>{error}</p>
                    <Link to="/" className="inline-block text-indigo-400 hover:text-indigo-300 text-sm">
                        Back to Home
                    </Link>
                </div>
            ) : history.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center border-dashed border-2 border-slate-700/50">
                    <p className="text-slate-400">You haven't made any searches yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <Link
                            key={item.id}
                            to={`/analysis/${item.id}`}
                            className="block glass rounded-xl p-5 hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h5 className="font-medium text-white mb-1">{item.user_query}</h5>
                                    <p className="text-sm text-slate-400 line-clamp-2">{item.refined_query}</p>
                                </div>
                                <div className="items-center gap-1.5 text-xs text-slate-500 flex-shrink-0 whitespace-nowrap hidden sm:flex">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
