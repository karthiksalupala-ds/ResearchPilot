// TypeScript interfaces for ResearchPilot

export interface ResearchPaper {
    id?: string;
    title: string;
    abstract: string;
    content?: string;
    source: 'arxiv' | 'semantic_scholar' | 'pubmed' | string;
    url?: string;
    authors?: string[];
    year?: number;
    citations?: number;
}

export interface EvidenceScore {
    overall_score: number;
    paper_count: number;
    source_diversity: number;
    consistency_score: number;
    label: 'Strong' | 'Moderate' | 'Limited' | 'Insufficient' | 'Cached' | string;
    /** 1-2 sentence evidence summary from the analyzer / orchestrator */
    explanation?: string;
}

export interface AnalysisResult {
    query_id?: string;
    original_query: string;
    refined_question: string;
    research_strategy: string;
    key_evidence: string;
    supporting_arguments: string;
    counterarguments: string;
    evidence_analysis: EvidenceScore;
    contradictions: string;
    critical_evaluation: string;
    research_gaps: string;
    final_insight: string;
    papers: ResearchPaper[];
    timestamp?: string;
}

export interface PipelineStep {
    step: string;
    status: 'pending' | 'running' | 'done' | 'error';
    message: string;
    data?: Record<string, unknown>;
    timestamp?: number;
    provider?: string;
}

export interface SSEEvent {
    event: 'step' | 'result' | 'error' | 'done';
    data: PipelineStep | AnalysisResult | { message: string } | Record<string, unknown>;
}

export interface ResearchRequest {
    query: string;
    max_papers?: number;
    sources?: string[];
    research_mode?: 'academic' | 'journalistic' | 'skeptic';
    depth?: 'standard' | 'comprehensive';
    user_id?: string;
}

// Pipeline step definitions (ordered)
export const PIPELINE_STEPS: Array<{ id: string; icon: string; label: string }> = [
    { id: 'cache_lookup', icon: '⚡', label: 'Neural Cache Lookup' },
    { id: 'query_refinement', icon: '🔍', label: 'Refining Research Query' },
    { id: 'retrieval', icon: '📚', label: 'Retrieving Research Papers' },
    { id: 'debate', icon: '⚖️', label: 'Conducting AI Debate (Pro vs Con)' },
    { id: 'final_insight', icon: '📄', label: 'Synthesizing Argument into Insight' },
    { id: 'evaluation', icon: '🧐', label: 'Critically Evaluating Debate Quality' },
];
