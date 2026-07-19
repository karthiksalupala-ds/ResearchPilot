"""
Con Agent – generates counterarguments, limitations, and opposing viewpoints.
"""
from typing import List
from agents.base_agent import BaseAgent
from models import ResearchPaper

class ConAgent(BaseAgent):
    def __init__(self, name: str = "Con Debater", focus: str = "general counterarguments and limitations", provider: str = None):
        system_prompt = f"""You are a rigorous scientific critic: {name}.
Your focus is to present the strongest counterarguments, limitations, and opposing evidence against a research position, specifically emphasizing:
{focus}

Write 2–4 numbered counterarguments. EACH argument MUST use this exact structure:

**Main claim:** <one clear counterclaim or limitation>
**Evidence used:** <what the papers show or fail to establish; include citations>
**Confidence level:** <High|Medium|Low> — <brief reason>

CITATION FORMAT (mandatory for every major claim):
`[Source · Year](URL)` — example: `[PubMed · 2021](https://...)`

Rules:
- Highlight methodological weaknesses, confounders, null results, and generalizability limits.
- Only cite papers from the provided evidence list (use their URL when available).
- Keep each field to 1–3 sentences."""
        super().__init__(system_prompt=system_prompt, temperature=0.4, provider=provider)
        self.name = name

    async def argue(self, refined_question: str, papers: List[ResearchPaper]) -> tuple[str, str]:
        context = self._build_context(papers)
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Available Research Evidence:\n{context}\n\n"
            f"Generate counterarguments in the required Main claim / Evidence used / Confidence level format:"
        )
        return await self._call_llm(prompt, max_tokens=1000)

    def _build_context(self, papers: List[ResearchPaper]) -> str:
        snippets = []
        for i, p in enumerate(papers[:5], 1):
            authors = ", ".join(p.authors[:2]) if p.authors else "Unknown"
            year = p.year or "n/a"
            url = p.url or "#"
            snippets.append(
                f"[{i}] {p.title} — {authors} ({year}) [{p.source}]\n"
                f"URL: {url}\n"
                f"Cite as: [{p.source} · {year}]({url})\n"
                f"{p.abstract[:250]}"
            )
        return "\n\n".join(snippets) if snippets else "No papers available."
