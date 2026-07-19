"""
Crossref API client – retrieves metadata for research outputs.
"""
import httpx
from typing import List, Optional
from models import ResearchPaper
from config import get_settings

settings = get_settings()

CROSSREF_BASE = "https://api.crossref.org"

async def search_crossref(query: str, max_results: int = 5) -> List[ResearchPaper]:
    params = {
        "query": query,
        "rows": max_results,
        "filter": "type:journal-article",
    }
    
    # "Polite pool" header
    headers = {
        "User-Agent": f"ResearchPilot/1.0 (mailto:{settings.contact_email})"
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{CROSSREF_BASE}/works",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()

        papers = []
        for item in data.get("message", {}).get("items", []):
            title_list = item.get("title", [])
            title = title_list[0] if title_list else "Unknown Title"
            
            # Crossref metadata is often missing abstracts, but sometimes has them
            abstract = item.get("abstract") or ""
            # Clean up abstract if it has JATS XML tags
            if abstract.startswith("<"):
                import re
                abstract = re.sub(r'<[^>]+>', '', abstract)
            
            if not abstract:
                continue

            authors = [f"{a.get('given', '')} {a.get('family', '')}".strip() for a in item.get("author", [])]
            url = item.get("URL") or item.get("DOI") or ""
            if url and not url.startswith("http"):
                url = f"https://doi.org/{url}"

            year = None
            pub_date = item.get("published-print") or item.get("published-online") or item.get("created")
            if pub_date and pub_date.get("date-parts"):
                year = pub_date["date-parts"][0][0]

            papers.append(ResearchPaper(
                title=title,
                abstract=abstract,
                content=abstract,
                source="crossref",
                url=url,
                authors=authors,
                year=year,
                citations=item.get("is-referenced-by-count", 0),
            ))
        return papers

    except Exception as e:
        print(f"[Crossref] Error: {e}")
        return []
