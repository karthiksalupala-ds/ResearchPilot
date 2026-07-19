-- ============================================================
-- ResearchPilot – 002 Auth Linking Migration
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- 1. Add user_id to research_queries to link queries to authenticated users.
ALTER TABLE research_queries
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add an index for fetching queries by user quickly
CREATE INDEX IF NOT EXISTS research_queries_user_id_idx
    ON research_queries (user_id);
