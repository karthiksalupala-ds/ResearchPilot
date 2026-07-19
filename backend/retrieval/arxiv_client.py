"""
arXiv API client – retrieves research papers via the arXiv REST API.
"""
import httpx
import xmltodict
from typing import List
from models import ResearchPaper


ARXIV_BASE = "https://export.arxiv.org/api/query"


async def search_arxiv(query: str, max_results: int = 5) -> List[ResearchPaper]:
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    try:
        async with httpx.AsyncClient(timeout=7.0) as client:
            response = await client.get(ARXIV_BASE, params=params)
            response.raise_for_status()

        data = xmltodict.parse(response.text)
        feed = data.get("feed", {})
        entries = feed.get("entry", [])

        # Handle single result (not a list)
        if isinstance(entries, dict):
            entries = [entries]

        papers = []
        for entry in entries:
            title = entry.get("title", "").replace("\n", " ").strip()
            abstract = entry.get("summary", "").replace("\n", " ").strip()
            url = entry.get("id", "")

            # Authors
            author_data = entry.get("author", [])
            if isinstance(author_data, dict):
                author_data = [author_data]
            authors = [a.get("name", "") for a in author_data]

            # Year from published date
            published = entry.get("published", "")
            year = int(published[:4]) if published else None

            papers.append(ResearchPaper(
                title=title,
                abstract=abstract,
                content=abstract,  # Use abstract as content (full text not available via API)
                source="arxiv",
                url=url,
                authors=authors,
                year=year,
            ))
        return papers

    except Exception as e:
        print(f"[arXiv] Error: {e}")
        return []
