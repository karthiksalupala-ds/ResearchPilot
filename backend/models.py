from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Request Models ──────────────────────────────────────────────

class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000, description="User research query")
    max_papers: int = Field(default=10, ge=3, le=30)
    sources: List[str] = Field(default=["arxiv", "semantic_scholar", "pubmed"])
    research_mode: str = Field(default="academic", description="academic | journalistic | skeptic")
    depth: str = Field(default="standard", description="standard | comprehensive")
    user_id: Optional[str] = Field(default=None, description="Optional Supabase user ID")

class ChatRequest(BaseModel):
    query: str
    context: str # The final research insight + paper snippets
    message: str
    history: Optional[List[dict]] = []


# ── Paper Models ───────────────────────────────────────────────

class ResearchPaper(BaseModel):
    id: Optional[str] = None
    title: str
    abstract: str
    content: str = ""
    source: str  # arxiv | semantic_scholar | pubmed
    url: Optional[str] = None
    authors: Optional[List[str]] = []
    year: Optional[int] = None
    citations: Optional[int] = None


# ── Pipeline Step Model ────────────────────────────────────────

class PipelineStep(BaseModel):
    step: str
    status: str  # running | done | error
    message: str
    data: Optional[dict] = None
    provider: Optional[str] = None


# ── Analysis Output Models ─────────────────────────────────────

class EvidenceScore(BaseModel):
    overall_score: float = Field(..., ge=0.0, le=10.0)
    paper_count: int
    source_diversity: float
    consistency_score: float
    label: str  # Strong / Moderate / Limited / Insufficient
    explanation: str = Field(
        default="",
        description="1-2 sentence summary of paper count, diversity, agreement, and confidence",
    )


class AnalysisResult(BaseModel):
    query_id: Optional[str] = None
    original_query: str
    refined_question: str
    research_strategy: str
    key_evidence: str
    supporting_arguments: str
    counterarguments: str
    evidence_analysis: EvidenceScore
    contradictions: str
    critical_evaluation: str
    research_gaps: str
    final_insight: str
    papers: List[ResearchPaper] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ── SSE Event Model ────────────────────────────────────────────

class SSEEvent(BaseModel):
    event: str  # step | result | error | done
    data: dict
