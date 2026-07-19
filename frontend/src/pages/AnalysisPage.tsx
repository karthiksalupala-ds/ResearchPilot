// src/pages/AnalysisPage.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAnalysis } from '../lib/api';
import type { AnalysisResult } from '../lib/types';
import ResultsPanel from '../components/ResultsPanel';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function AnalysisPage() {
    const { queryId } = useParams<{ queryId: string }>();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!queryId) {
            setError('Missing analysis ID.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetchAnalysis(queryId)
            .then((data) => {
                if (cancelled) return;
                if (!data) {
                    setError('Analysis not found. It may have expired or never been saved.');
                    setAnalysis(null);
                } else {
                    setAnalysis(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load analysis. Please try again from Home.');
                    setAnalysis(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [queryId]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
                <h1 className="text-2xl font-semibold text-slate-50 tracking-tight mb-8">Analysis Details</h1>

                {loading && (
                    <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading analysis...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/25 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                )}

                {!loading && !error && analysis && (
                    <ResultsPanel result={analysis} />
                )}
            </main>
        </div>
    );
}
