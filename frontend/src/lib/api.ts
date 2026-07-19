// API client – communicates with the FastAPI backend via SSE streaming

import type { AnalysisResult, PipelineStep, ResearchRequest } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : 'http://localhost:8000';

export type OnStep = (step: PipelineStep) => void;
export type OnResult = (result: AnalysisResult) => void;
export type OnError = (message: string) => void;
export type OnDone = () => void;

/**
 * Submit a research query and stream back pipeline step events + final result.
 * Returns a cleanup function that aborts the stream.
 */
export function analyzeResearch(
    request: ResearchRequest,
    onStep: OnStep,
    onResult: OnResult,
    onError: OnError,
    onDone: OnDone,
): () => void {
    const controller = new AbortController();

    (async () => {
        try {
            const response = await fetch(`${API_BASE}/research/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errText = await response.text();
                onError(`Server error ${response.status}: ${errText}`);
                onDone();
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) { onError('No response stream.'); onDone(); return; }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const jsonStr = trimmed.slice(5).trim();
                    if (!jsonStr) continue;

                    try {
                        const event = JSON.parse(jsonStr) as { event: string; data: unknown };
                        if (event.event === 'step') {
                            const stepData = event.data as PipelineStep;
                            onStep({ ...stepData, timestamp: Date.now() });
                        }
                        if (event.event === 'result') onResult(event.data as AnalysisResult);
                        if (event.event === 'error') onError((event.data as { message: string }).message);
                        if (event.event === 'done') onDone();
                    } catch {
                        // skip malformed event
                    }
                }
            }
            onDone();
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            onError(err instanceof Error ? err.message : 'Unknown error occurred');
            onDone();
        }
    })();

    return () => controller.abort();
}

/** Fetch recent query history */
export async function fetchQueryHistory(user_id?: string): Promise<unknown[]> {
    const url = user_id ? `${API_BASE}/research/history?user_id=${user_id}` : `${API_BASE}/queries/`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
}

/** Fetch stored papers */
export async function fetchPapers(source?: string): Promise<unknown[]> {
    const url = source ? `${API_BASE}/papers/?source=${source}` : `${API_BASE}/papers/`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
}
/** Send a follow-up chat message about the research */
export async function sendChatMessage(request: { query: string; context: string; message: string; history: any[] }): Promise<{ response: string }> {
    const res = await fetch(`${API_BASE}/research/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
}

/** Fetch analysis for a specific query */
export async function fetchAnalysis(queryId: string): Promise<AnalysisResult | null> {
    const url = `${API_BASE}/queries/${queryId}/analysis`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}
