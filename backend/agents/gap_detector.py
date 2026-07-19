"""
Research Gap Detector – identifies unexplored areas and open questions.
"""
from typing import List
from agents.base_agent import BaseAgent
from models import ResearchPaper

SYSTEM_PROMPT = """You are a research strategist who specializes in identifying gaps in scientific literature.
Based on the research evidence and analysis provided:
1. Identify areas where research is absent or severely limited
2. Point out populations, contexts, or conditions not yet studied
3. Highlight methodological improvements needed
4. Suggest promising future research directions

Format as 3-5 clear research gap statements, each starting with "Gap:" on a new line."""


class GapDetectorAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.4)

    async def detect_gaps(
        self,
        refined_question: str,
        papers: List[ResearchPaper],
        pro_args: str,
        con_args: str,
        contradictions: str,
    ) -> str:
        paper_summary = "\n".join(
            f"- [{p.source}] {p.title} ({p.year or 'n/a'}): {p.abstract[:200]}"
            for p in papers[:8]
        )
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Retrieved Papers:\n{paper_summary}\n\n"
            f"Supporting Arguments Summary:\n{pro_args[:500]}\n\n"
            f"Counterarguments Summary:\n{con_args[:500]}\n\n"
            f"Points of Contention:\n{contradictions[:400]}\n\n"
            f"Identify research gaps and future directions:"
        )
        return await self._call_llm(prompt, max_tokens=1000)
