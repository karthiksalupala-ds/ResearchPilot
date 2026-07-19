"""
Evidence Analyzer – scores the strength of evidence from retrieved papers.
"""
from typing import List, Tuple
from agents.base_agent import BaseAgent
from models import ResearchPaper, EvidenceScore

SYSTEM_PROMPT = """You are an evidence quality assessor trained in systematic review methodology.
Evaluate research evidence on three dimensions:
1. Source Diversity (0-10): How many different credible sources contributed?
2. Consistency (0-10): How consistent are findings across studies?
3. Overall Strength (0-10): Holistic evidence strength

Respond in EXACTLY this format (no extra text):
SOURCE_DIVERSITY: <score>
CONSISTENCY: <score>
OVERALL: <score>
LABEL: <Strong|Moderate|Limited|Insufficient>
SUMMARY: <one-sentence explanation>"""


class EvidenceAnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.2)

    async def analyze(
        self,
        refined_question: str,
        papers: List[ResearchPaper],
        pro_args: str,
        con_args: str,
    ) -> EvidenceScore:
        context = self._summarize_papers(papers)
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Papers Retrieved: {len(papers)}\n"
            f"Sources: {self._source_breakdown(papers)}\n\n"
            f"Evidence Summary:\n{context}\n\n"
            f"Supporting Arguments:\n{pro_args[:500]}\n\n"
            f"Counterarguments:\n{con_args[:500]}\n\n"
            f"Evaluate the evidence strength:"
        )
        raw = await self._call_llm(prompt, max_tokens=300)
        return self._parse_score(raw, papers)

    def _summarize_papers(self, papers: List[ResearchPaper]) -> str:
        return "\n".join(
            f"- [{p.source}] {p.title} ({p.year or 'n/a'})"
            for p in papers[:10]
        )

    def _source_breakdown(self, papers: List[ResearchPaper]) -> str:
        from collections import Counter
        counts = Counter(p.source for p in papers)
        return ", ".join(f"{k}: {v}" for k, v in counts.items())

    def _parse_score(self, raw: str, papers: List[ResearchPaper]) -> EvidenceScore:
        scores = {}
        for line in raw.splitlines():
            for key in ["SOURCE_DIVERSITY", "CONSISTENCY", "OVERALL", "LABEL"]:
                if line.startswith(key + ":"):
                    scores[key] = line.split(":", 1)[1].strip()

        def safe_float(key: str, default: float = 5.0) -> float:
            try:
                return min(10.0, max(0.0, float(scores.get(key, default))))
            except ValueError:
                return default

        label = scores.get("LABEL", "Moderate")
        if label not in {"Strong", "Moderate", "Limited", "Insufficient"}:
            label = "Moderate"

        return EvidenceScore(
            overall_score=safe_float("OVERALL"),
            paper_count=len(papers),
            source_diversity=safe_float("SOURCE_DIVERSITY"),
            consistency_score=safe_float("CONSISTENCY"),
            label=label,
        )
