// src/pages/AnalysisPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAnalysis } from '../lib/api';
import type { AnalysisResult } from '../lib/types';
import Navbar from '../components/Navbar';
import ResultsPanel from '../components/ResultsPanel';

export function AnalysisPage() {
    const { queryId } = useParams<{ queryId: string }>();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (queryId) {
            fetchAnalysis(queryId)
                .then(setAnalysis)
                .catch(() => setError('Failed to fetch analysis.'));
        }
    }, [queryId]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Analysis Details</h1>
                {error && <div className="text-red-500">{error}</div>}
                {analysis ? (
                    <ResultsPanel result={analysis} />
                ) : (
                    <div>Loading analysis...</div>
                )}
            </main>
        </div>
    );
}
