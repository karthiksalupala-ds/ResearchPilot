import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, Search, Calendar } from 'lucide-react';

interface SavedQuery {
    id: string;
    user_query: string;
    refined_query: string;
    timestamp: string;
}

export function ProfilePage() {
    const { user, loading } = useAuth();
    const [history, setHistory] = useState<SavedQuery[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/history?user_id=${user.id}`);
                const data = await response.json();
                if (data.queries) {
                    setHistory(data.queries);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setFetching(false);
            }
        };

        fetchHistory();
    }, [user]);

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
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
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
            ) : history.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center border-dashed border-2 border-slate-700/50">
                    <p className="text-slate-400">You haven't made any searches yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="glass rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h5 className="font-medium text-white mb-1">{item.user_query}</h5>
                                    <p className="text-sm text-slate-400 line-clamp-2">{item.refined_query}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0 whitespace-nowrap hidden sm:flex">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}