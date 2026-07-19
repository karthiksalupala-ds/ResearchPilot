"""
OpenAlex API client – retrieves papers using the /works endpoint.
"""
import httpx
import asyncio
from typing import List, Optional
from models import ResearchPaper

OPENALEX_BASE = "https://api.openalex.org"

async def search_openalex(query: str, max_results: int = 5) -> List[ResearchPaper]:
    params = {
        "search": query,
        "limit": max_results,
        "select": "title,abstract,publication_year,authorships,doi,ids",
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{OPENALEX_BASE}/works",
                params=params
            )
            response.raise_for_status()
            data = response.json()

        papers = []
        for item in data.get("results", []):
            abstract_dict = item.get("abstract_inverted_index")
            abstract = ""
            if abstract_dict:
                # Reconstruct abstract from inverted index
                # OpenAlex provides abstracts as an inverted index for copyright reasons
                word_positions = []
                for word, positions in abstract_dict.items():
                    for pos in positions:
                        word_positions.append((pos, word))
                word_positions.sort()
                abstract = " ".join([word for pos, word in word_positions])
            
            if not abstract:
                continue

            authors = [a.get("author", {}).get("display_name", "") for a in item.get("authorships", [])]
            url = item.get("doi") or item.get("ids", {}).get("mag") or ""
            if url and not url.startswith("http"):
                url = f"https://doi.org/{url}"

            papers.append(ResearchPaper(
                title=item.get("title", ""),
                abstract=abstract,
                content=abstract,
                source="openalex",
                url=url,
                authors=authors,
                year=item.get("publication_year"),
                citations=item.get("cited_by_count", 0),
            ))
        return papers

    except Exception as e:
        print(f"[OpenAlex] Error: {e}")
        return []
