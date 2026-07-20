import logging
import re
import httpx
import json
from typing import Optional, Dict, Any
from html.parser import HTMLParser
from config import get_settings
from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.ignore = False

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'iframe'):
            self.ignore = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'iframe'):
            self.ignore = False

    def handle_data(self, data):
        if not self.ignore:
            cleaned = data.strip()
            if cleaned:
                # Remove excessive whitespace
                cleaned = re.sub(r'\s+', ' ', cleaned)
                self.text_parts.append(cleaned)

    def get_text(self) -> str:
        return "\n".join(self.text_parts)

SCRAPER_SYSTEM_PROMPT = """
You are the Web Content Reader for ResearchPilot. 
Your task is to analyze raw text extracted from a webpage and extract key structured information in JSON format.
You must find and extract:
- title: The title of the article or page.
- source: The website name or publisher.
- summary: A 2-3 sentence overview of the page content.
- evidence: Key empirical findings, quotes, or data points supporting or refuting relevant research claims.
- publication_date: The date published (e.g. "2024-05-12"), or "unknown" if not found.

Do not include any explanation or markdown formatting in your response. Respond ONLY with raw JSON.

Example output:
{
  "title": "McKinsey report on AI in software development",
  "source": "McKinsey & Company",
  "summary": "This study analyzes how generative AI tools affect software developer productivity across standard tasks.",
  "evidence": "Generative AI tools improved software development speed by 25% to 45% for typical coding tasks, with lesser improvements for complex architecture work.",
  "publication_date": "2023-06-25"
}
"""

class ScraperAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            system_prompt=SCRAPER_SYSTEM_PROMPT,
            temperature=0.2
        )

    async def extract_info(self, raw_html_text: str, source_url: str) -> Dict[str, Any]:
        """Use LLM to extract structured facts from raw webpage text."""
        # Truncate content to avoid exceeding context limits (approx 3000 words)
        truncated = raw_html_text[:12000].strip()
        user_msg = f"URL: {source_url}\n\nWebpage content:\n{truncated}"
        
        try:
            response_text, _ = await self._call_llm(user_msg, max_tokens=1000)
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                if len(lines) > 1:
                    cleaned = "\n".join(lines[1:])
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("\n", 1)[0]
            cleaned = cleaned.strip("`").strip()
            
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"ScraperAgent fact extraction failed: {e}")
            # Fallback structure
            return {
                "title": "Article from " + source_url.split("//")[-1].split("/")[0],
                "source": source_url.split("//")[-1].split("/")[0],
                "summary": "Could not automatically summarize this article.",
                "evidence": "No clear evidence extracted due to processing limits.",
                "publication_date": "unknown"
            }

async def scrape_url(url: str, client: Optional[httpx.AsyncClient] = None) -> Optional[Dict[str, Any]]:
    """Fetch URL, extract text, and call ScraperAgent to get structured data."""
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return None

    # Exclude typical PDF links from general web scraping for now
    if url.endswith(".pdf"):
        return None

    own_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=4.0, follow_redirects=True)
        own_client = True

    try:
        # Fetch web page
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"}
        res = await client.get(url, headers=headers)
        if res.status_code != 200:
            return None

        # Parse HTML text
        extractor = HTMLTextExtractor()
        extractor.feed(res.text)
        raw_text = extractor.get_text()

        if not raw_text.strip():
            return None

        # Call Scraper Agent to extract structured content
        agent = ScraperAgent()
        structured_data = await agent.extract_info(raw_text, url)
        structured_data["url"] = url
        return structured_data

    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return None
    finally:
        if own_client:
            await client.aclose()
