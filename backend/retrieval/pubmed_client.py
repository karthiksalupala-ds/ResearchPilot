"""
PubMed API client – retrieves biomedical research papers from NCBI.
Uses E-utilities: esearch + efetch.
"""
import httpx
import xmltodict
from typing import List
from models import ResearchPaper
from config import get_settings

settings = get_settings()

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL  = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


def _base_params() -> dict:
    params: dict = {"retmode": "json"}
    if settings.ncbi_api_key:
        params["api_key"] = settings.ncbi_api_key
    return params


async def search_pubmed(query: str, max_results: int = 5) -> List[ResearchPaper]:
    try:
        # Step 1: Search for IDs
        search_params = {
            **_base_params(),
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "sort": "relevance",
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            search_resp = await client.get(ESEARCH_URL, params=search_params)
            search_resp.raise_for_status()
            search_data = search_resp.json()

        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []

        # Step 2: Fetch abstracts
        fetch_params = {
            **_base_params(),
            "db": "pubmed",
            "id": ",".join(ids),
            "rettype": "abstract",
            "retmode": "xml",
        }
        async with httpx.AsyncClient(timeout=7.0) as client:
            fetch_resp = await client.get(EFETCH_URL, params=fetch_params)
            fetch_resp.raise_for_status()

        articles_data = xmltodict.parse(fetch_resp.text)
        articles = articles_data.get("PubmedArticleSet", {}).get("PubmedArticle", [])
        if isinstance(articles, dict):
            articles = [articles]

        papers = []
        for article in articles:
            try:
                medline = article.get("MedlineCitation", {})
                article_data = medline.get("Article", {})

                title = article_data.get("ArticleTitle", "")
                if isinstance(title, dict):
                    title = title.get("#text", "")

                abstract_data = article_data.get("Abstract", {}).get("AbstractText", "")
                if isinstance(abstract_data, list):
                    abstract = " ".join(
                        a.get("#text", a) if isinstance(a, dict) else str(a)
                        for a in abstract_data
                    )
                elif isinstance(abstract_data, dict):
                    abstract = abstract_data.get("#text", "")
                else:
                    abstract = str(abstract_data) if abstract_data else ""

                if not abstract:
                    continue

                # Authors
                author_list = article_data.get("AuthorList", {}).get("Author", [])
                if isinstance(author_list, dict):
                    author_list = [author_list]
                authors = [
                    f"{a.get('ForeName', '')} {a.get('LastName', '')}".strip()
                    for a in author_list if isinstance(a, dict)
                ]

                # Year
                pub_date = article_data.get("Journal", {}).get("JournalIssue", {}).get("PubDate", {})
                year_str = pub_date.get("Year") or pub_date.get("MedlineDate", "")[:4]
                year = int(year_str) if year_str and year_str.isdigit() else None

                pmid = str(medline.get("PMID", {}).get("#text", "") or medline.get("PMID", ""))
                url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ""

                papers.append(ResearchPaper(
                    title=str(title),
                    abstract=abstract,
                    content=abstract,
                    source="pubmed",
                    url=url,
                    authors=authors,
                    year=year,
                ))
            except Exception as parse_err:
                print(f"[PubMed] Parse error for article: {parse_err}")
                continue

        return papers

    except Exception as e:
        print(f"[PubMed] Error: {e}")
        return []
