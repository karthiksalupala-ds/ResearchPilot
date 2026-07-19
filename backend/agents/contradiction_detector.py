"""
Contradiction Detector – identifies disagreements between retrieved papers.
"""
from typing import List
from agents.base_agent import BaseAgent
from models import ResearchPaper

SYSTEM_PROMPT = """You are a research methodology expert specializing in identifying
contradictions and inconsistencies across academic studies.

Analyze the provided research evidence and identify:
1. Direct contradictions between study findings
2. Conflicting effect sizes or directions
3. Population or context-specific discrepancies
4. Methodological differences that lead to different conclusions

If no meaningful contradictions exist, state: "No major contradictions detected. Findings are largely consistent."
Otherwise, list each contradiction clearly. Format as numbered points."""


class ContradictionDetectorAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.3)

    async def detect(
        self,
        refined_question: str,
        papers: List[ResearchPaper],
        pro_args: str,
        con_args: str,
    ) -> str:
        context = self._build_context(papers)
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Research Evidence:\n{context}\n\n"
            f"Supporting Arguments:\n{pro_args[:600]}\n\n"
            f"Counterarguments:\n{con_args[:600]}\n\n"
            f"Identify contradictions and points of contention:"
        )
        return await self._call_llm(prompt, max_tokens=1000)

    def _build_context(self, papers: List[ResearchPaper]) -> str:
        return "\n".join(
            f"- [{p.source}] {p.title}: {p.abstract[:250]}"
            for p in papers[:8]
        )
