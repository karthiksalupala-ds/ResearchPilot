"""
Critic Agent – reviews arguments for bias, weak reasoning, and logical fallacies.
"""
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a rigorous academic peer reviewer with expertise in research methodology.
Your job is to critically evaluate both supporting and opposing arguments for:
1. Logical fallacies or overgeneralizations
2. Selection bias in evidence presented
3. Causal claims not supported by correlational data
4. Missing important nuance or context
5. Rhetorical weaknesses

Provide a balanced critical evaluation (3-4 sentences). Be constructive but rigorous."""


class CriticAgent(BaseAgent):
    def __init__(self):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.3)

    async def critique(
        self,
        refined_question: str,
        pro_args: str,
        con_args: str,
        contradictions: str,
    ) -> str:
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Supporting Arguments:\n{pro_args[:700]}\n\n"
            f"Counterarguments:\n{con_args[:700]}\n\n"
            f"Detected Contradictions:\n{contradictions[:400]}\n\n"
            f"Provide a critical evaluation of the reasoning quality:"
        )
        return await self._call_llm(prompt, max_tokens=800)
