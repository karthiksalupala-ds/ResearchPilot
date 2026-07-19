"""
Semantic Scholar API client – retrieves papers with citation metadata.
"""
import httpx
from typing import List, Optional
from models import ResearchPaper
from config import get_settings

settings = get_settings()

SS_BASE = "https://api.semanticscholar.org/graph/v1"


def _build_headers() -> dict:
    headers = {"Accept": "application/json"}
    if settings.semantic_scholar_api_key:
        headers["x-api-key"] = settings.semantic_scholar_api_key
    return headers


async def search_semantic_scholar(query: str, max_results: int = 5) -> List[ResearchPaper]:
    params = {
        "query": query,
        "limit": max_results,
        "fields": "title,abstract,year,authors,citationCount,externalIds,url",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{SS_BASE}/paper/search",
                params=params,
                headers=_build_headers(),
            )
            response.raise_for_status()
            data = response.json()

        papers = []
        for item in data.get("data", []):
            abstract = item.get("abstract") or ""
            if not abstract:
                continue  # Skip papers without abstracts

            authors = [a.get("name", "") for a in item.get("authors", [])]
            url = item.get("url") or ""

            papers.append(ResearchPaper(
                title=item.get("title", ""),
                abstract=abstract,
                content=abstract,
                source="semantic_scholar",
                url=url,
                authors=authors,
                year=item.get("year"),
                citations=item.get("citationCount"),
            ))
        return papers

    except Exception as e:
        print(f"[Semantic Scholar] Error: {e}")
        return []
