import httpx
import logging
import asyncio
from typing import List
from models import ResearchPaper

logger = logging.getLogger(__name__)

async def search_wikipedia(query: str, limit: int = 5) -> List[ResearchPaper]:
    """Retrieve articles from Wikipedia."""
    papers = []
    
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "utf8": "1"
    }
    
    headers = {"User-Agent": "ResearchPilot/1.0 (https://github.com/your-repo)"}
    try:
        async with httpx.AsyncClient(timeout=2.0, headers=headers) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            search_results = data.get("query", {}).get("search", [])
            for item in search_results:
                title = item.get("title", "")
                snippet = item.get("snippet", "").replace("<span class=\"searchmatch\">", "").replace("</span>", "")
                
                papers.append(
                    ResearchPaper(
                        id=str(item.get("pageid", "")),
                        title=title,
                        abstract=snippet,
                        authors=["Wikipedia Contributors"],
                        year=None,
                        source="Wikipedia",
                        url=f"https://en.wikipedia.org/?curid={item.get('pageid')}"
                    )
                )
    except Exception as e:
        logger.warning(f"Wikipedia search failed: {e}")
        
    return papers
