"""
Planner Agent – determines the research analysis strategy.
"""
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are an expert research strategist and academic methodologist.
Given a research question, produce a concise research analysis strategy that outlines:
1. Key sub-questions to investigate
2. Research angles to examine (e.g., mechanisms, outcomes, populations, limitations)
3. Types of evidence to look for (RCTs, meta-analyses, observational studies, reviews)
4. Potential confounders or methodological concerns

Format your response as a clear, structured paragraph (2-4 sentences). No bullet points."""


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.3)

    async def plan(self, refined_question: str) -> str:
        prompt = f"Research question: {refined_question}\n\nProvide a research analysis strategy:"
        return await self._call_llm(prompt, max_tokens=400)
