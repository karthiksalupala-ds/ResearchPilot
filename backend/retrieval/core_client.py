"""
CORE API client – retrieves open access papers from CORE.ac.uk.
"""
import httpx
from typing import List, Optional
from models import ResearchPaper
from config import get_settings

settings = get_settings()

CORE_BASE = "https://api.core.ac.uk/v3"

async def search_core(query: str, max_results: int = 5) -> List[ResearchPaper]:
    if not settings.core_api_key:
        return []

    headers = {"Authorization": f"Bearer {settings.core_api_key}"}
    params = {
        "q": query,
        "limit": max_results,
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{CORE_BASE}/search/works",
                headers=headers,
                params=params, 
                json={"q": query, "limit": max_results}
            )
            response.raise_for_status()
            data = response.json()

        papers = []
        # CORE returns a list of results in 'results' field
        for item in data.get("results", []):
            abstract = item.get("abstract") or ""
            if not abstract:
                continue

            authors = [a.get("name", "") for a in item.get("authors", [])]
            url = item.get("downloadUrl") or item.get("doi") or ""

            papers.append(ResearchPaper(
                title=item.get("title", ""),
                abstract=abstract,
                content=abstract,
                source="core",
                url=url,
                authors=authors,
                year=item.get("yearPublished"),
                citations=0, # CORE v3 might have it elsewhere
            ))
        return papers

    except Exception as e:
        print(f"[CORE] Error: {e}")
        return []
