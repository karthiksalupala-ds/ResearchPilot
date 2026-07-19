"""
DuckDuckGo search client – retrieves broad web context.
"""
import httpx
from typing import List
from models import ResearchPaper

async def search_duckduckgo(query: str, max_results: int = 5) -> List[ResearchPaper]:
    """
    Simulated DuckDuckGo search. 
    Reduced to simple return to avoid redundant Google search calls already handled in orchestrator.
    """
    return [] # Placeholder - let Google search handle the broad web context for now
