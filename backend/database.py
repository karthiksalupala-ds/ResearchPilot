"""
Supabase client wrapper with pgvector search support.
"""
import json
from typing import List, Optional
from supabase import create_client, Client
from config import get_settings
from models import ResearchPaper

settings = get_settings()


def get_supabase() -> Optional[Client]:
    if not settings.supabase_url or not settings.supabase_service_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_key)


# ── Paper Storage ──────────────────────────────────────────────

async def store_paper(paper: ResearchPaper, embedding: List[float]) -> Optional[str]:
    client = get_supabase()
    if not client:
        return None
    try:
        result = client.table("research_papers").upsert({
            "title": paper.title,
            "abstract": paper.abstract,
            "content": paper.content,
            "source": paper.source,
            "url": paper.url,
            "authors": json.dumps(paper.authors),
            "year": paper.year,
            "citations": paper.citations,
            "embedding": embedding,
        }, on_conflict="title").execute()
        if result.data:
            return result.data[0].get("id")
    except Exception as e:
        print(f"[DB] Error storing paper: {e}")
    return None

async def store_chunk(title: str, content: str, embedding: List[float], user_id: str) -> bool:
    client = get_supabase()
    if not client:
        return False
    try:
        client.table("research_papers").insert({
            "title": title,
            "abstract": content[:200] + "...",
            "content": content,
            "source": "personal",
            "embedding": embedding,
            "user_id": user_id
        }).execute()
        return True
    except Exception as e:
        print(f"[DB] Error storing personal chunk: {e}")
        return False


async def similarity_search(embedding: List[float], limit: int = 10, user_id: Optional[str] = None) -> List[ResearchPaper]:
    client = get_supabase()
    if not client:
        return []
    try:
        # Note: In a production app, the match_papers RPC should handle user_id filtering
        # For simplicity, we search and then filter if user_id is provided, 
        # but better to do it in the RPC.
        result = client.rpc("match_papers", {
            "query_embedding": embedding,
            "match_count": limit,
            "match_threshold": 0.5,
        }).execute()
        
        papers = []
        for row in result.data or []:
            # Filtering personal chunks to only those belonging to the user
            if row.get("source") == "personal" and row.get("user_id") != user_id:
                continue
                
            papers.append(ResearchPaper(
                id=str(row.get("id", "")),
                title=row.get("title", ""),
                abstract=row.get("abstract", ""),
                content=row.get("content", ""),
                source=row.get("source", ""),
                url=row.get("url"),
                authors=json.loads(row.get("authors", "[]")),
                year=row.get("year"),
                citations=row.get("citations"),
            ))
        return papers
    except Exception as e:
        print(f"[DB] Similarity search error: {e}")
        return []


# ── Query Storage ───────────────────────────────────────────────

async def store_query(user_query: str, refined_query: str, user_id: Optional[str] = None) -> Optional[str]:
    client = get_supabase()
    if not client:
        return None
    try:
        data = {
            "user_query": user_query,
            "refined_query": refined_query,
        }
        if user_id:
            data["user_id"] = user_id
            
        result = client.table("research_queries").insert(data).execute()
        if result.data:
            return result.data[0].get("id")
    except Exception as e:
        print(f"[DB] Error storing query: {e}")
    return None


async def store_analysis(query_id: str, analysis: dict) -> bool:
    client = get_supabase()
    if not client:
        return False
    try:
        client.table("research_analysis").insert({
            "query_id": query_id,
            "supporting_arguments": analysis.get("supporting_arguments", ""),
            "counter_arguments": analysis.get("counterarguments", ""),
            "evidence_score": analysis.get("evidence_score", 0),
            "final_insight": analysis.get("final_insight", ""),
            "contradictions": analysis.get("contradictions", ""),
            "critical_evaluation": analysis.get("critical_evaluation", ""),
            "research_gaps": analysis.get("research_gaps", ""),
        }).execute()
        return True
    except Exception as e:
        print(f"[DB] Error storing analysis: {e}")
        return False


async def get_queries(limit: int = 20, user_id: Optional[str] = None) -> List[dict]:
    client = get_supabase()
    if not client:
        return []
    try:
        query = client.table("research_queries").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
            
        result = query.order("timestamp", desc=True).limit(limit).execute()
        return result.data or []
    except Exception as e:
        print(f"[DB] Error fetching queries: {e}")
    return []


async def get_cached_analysis(user_query: str) -> Optional[dict]:
    """Checks if an analysis already exists for a similar query."""
    client = get_supabase()
    if not client:
        return None
    try:
        # Find the query first (case-insensitive)
        query_res = client.table("research_queries")\
            .select("id, refined_query")\
            .ilike("user_query", user_query)\
            .order("timestamp", desc=True)\
            .limit(1)\
            .execute()
        
        if not query_res.data:
            return None
            
        query_id = query_res.data[0]["id"]
        refined_query = query_res.data[0]["refined_query"]
        
        # Get the analysis for this query
        analysis_res = client.table("research_analysis")\
            .select("*")\
            .eq("query_id", query_id)\
            .limit(1)\
            .execute()
            
        if not analysis_res.data:
            return None
            
        analysis = analysis_res.data[0]
        return {
            "query_id": query_id,
            "refined_query": refined_query,
            "analysis": analysis
        }
    except Exception as e:
        print(f"[DB] Cache lookup error: {e}")
    return None

async def get_analysis_by_query_id(query_id: str) -> Optional[dict]:
    """Gets an analysis by its query ID."""
    client = get_supabase()
    if not client:
        return None
    try:
        analysis_res = client.table("research_analysis")\
            .select("*")\
            .eq("query_id", query_id)\
            .limit(1)\
            .execute()
        if not analysis_res.data:
            return None
        return analysis_res.data[0]
    except Exception as e:
        print(f"[DB] Error fetching analysis by query ID: {e}")
        return None
