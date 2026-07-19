import httpx
import logging
from typing import List
from models import ResearchPaper
from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

async def search_google(query: str, limit: int = 5) -> List[ResearchPaper]:
    """
    Search Google using Serper.dev API to find top rated articles and web results.
    """
    if not settings.serper_api_key:
        logger.warning("SERPER_API_KEY not set. Skipping Google search.")
        return []

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query,
        "num": limit
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        papers = []
        # Process organic results
        for result in data.get("organic", []):
            papers.append(ResearchPaper(
                id=f"web-{result.get('link')[:50]}",
                title=result.get("title", "Untitled Web Result"),
                abstract=result.get("snippet", "No description available."),
                content="",
                source="Google Search",
                url=result.get("link"),
                authors=["Web Source"],
                year=None
            ))
        
        return papers[:limit]

    except Exception as e:
        logger.error(f"Error searching Google via Serper: {e}")
        return []
