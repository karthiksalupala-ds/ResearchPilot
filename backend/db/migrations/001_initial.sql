-- ============================================================
-- ResearchPilot – Supabase Initial Migration
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── research_papers ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_papers (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title       TEXT NOT NULL UNIQUE,
    abstract    TEXT NOT NULL DEFAULT '',
    content     TEXT NOT NULL DEFAULT '',
    source      TEXT NOT NULL,          -- arxiv | semantic_scholar | pubmed
    url         TEXT,
    authors     JSONB DEFAULT '[]',
    year        INTEGER,
    citations   INTEGER,
    embedding   VECTOR(384),           -- all-MiniLM-L6-v2 dim (use 1536 for OpenAI)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector search
CREATE INDEX IF NOT EXISTS research_papers_embedding_idx
    ON research_papers USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── research_queries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_queries (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_query     TEXT NOT NULL,
    refined_query  TEXT NOT NULL DEFAULT '',
    timestamp      TIMESTAMPTZ DEFAULT NOW()
);

-- ── research_analysis ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_analysis (
    id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id              UUID REFERENCES research_queries(id) ON DELETE CASCADE,
    supporting_arguments  TEXT DEFAULT '',
    counter_arguments     TEXT DEFAULT '',
    evidence_score        FLOAT DEFAULT 0,
    final_insight         TEXT DEFAULT '',
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── pgvector similarity search function ─────────────────────
CREATE OR REPLACE FUNCTION match_papers(
    query_embedding VECTOR(384),
    match_count     INT DEFAULT 10,
    match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id          UUID,
    title       TEXT,
    abstract    TEXT,
    content     TEXT,
    source      TEXT,
    url         TEXT,
    authors     JSONB,
    year        INTEGER,
    citations   INTEGER,
    similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.abstract,
        p.content,
        p.source,
        p.url,
        p.authors,
        p.year,
        p.citations,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM research_papers p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── Row Level Security (optional – enable per your needs) ───
-- ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_queries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_analysis ENABLE ROW LEVEL SECURITY;

-- ── Indexes for query performance ──────────────────────────
CREATE INDEX IF NOT EXISTS research_queries_timestamp_idx
    ON research_queries (timestamp DESC);

CREATE INDEX IF NOT EXISTS research_analysis_query_idx
    ON research_analysis (query_id);
