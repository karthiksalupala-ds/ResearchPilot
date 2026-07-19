"""
Pro Agent – generates supporting arguments backed by research evidence.
"""
from typing import List
from agents.base_agent import BaseAgent
from models import ResearchPaper

class ProAgent(BaseAgent):
    def __init__(self, name: str = "Pro Debater", focus: str = "general supportive evidence", provider: str = None):
        system_prompt = f"""You are a scientific advocate: {name}.
Your focus is to present the strongest evidence-based case FOR a given research position, specifically emphasizing:
{focus}

Write 2–4 numbered arguments. EACH argument MUST use this exact structure:

**Main claim:** <one clear claim>
**Evidence used:** <what the papers show; include citations>
**Confidence level:** <High|Medium|Low> — <brief reason>

CITATION FORMAT (mandatory for every major claim):
`[Source · Year](URL)` — example: `[arXiv · 2022](https://arxiv.org/abs/...)`

Rules:
- Only cite papers from the provided evidence list (use their URL when available).
- Prefer concrete findings over vague assertions.
- Keep each field to 1–3 sentences."""
        super().__init__(system_prompt=system_prompt, temperature=0.4, provider=provider)
        self.name = name

    async def argue(self, refined_question: str, papers: List[ResearchPaper]) -> tuple[str, str]:
        context = self._build_context(papers)
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Available Research Evidence:\n{context}\n\n"
            f"Generate supporting arguments in the required Main claim / Evidence used / Confidence level format:"
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
