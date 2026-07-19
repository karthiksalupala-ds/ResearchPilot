from fastapi import APIRouter, HTTPException
from typing import List, Optional
import database

router = APIRouter()


@router.get("/", response_model=List[dict])
async def list_queries(limit: int = 20, user_id: Optional[str] = None):
    """List recent research queries for a user."""
    return await database.get_queries(limit=limit, user_id=user_id)


@router.get("/{query_id}/analysis", response_model=dict)
async def get_analysis(query_id: str):
    """Get the analysis for a specific query."""
    analysis = await database.get_analysis_by_query_id(query_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis
