"""
Papers API – list and retrieve stored research papers.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import database
from models import ResearchPaper

router = APIRouter(prefix="/api/papers", tags=["papers"])


@router.get("/", response_model=List[dict])
async def list_papers(limit: int = 20, source: Optional[str] = None):
    """List stored research papers."""
    from database import get_supabase
    client = get_supabase()
    if not client:
        return []
    try:
        query = client.table("research_papers").select(
            "id, title, abstract, source, url, authors, year, citations, created_at"
        ).order("created_at", desc=True).limit(limit)
        if source:
            query = query.eq("source", source)
        result = query.execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{paper_id}", response_model=dict)
async def get_paper(paper_id: str):
    """Get a specific paper by ID."""
    from database import get_supabase
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        result = client.table("research_papers").select("*").eq("id", paper_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Paper not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
