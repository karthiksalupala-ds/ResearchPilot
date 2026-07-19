"""
Critic Agent – evaluates the quality of the research analysis.
"""
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are a meticulous and impartial academic reviewer. Your task is to critically evaluate the provided research analysis based on the following criteria:

1.  **Objectivity:** Is the analysis balanced, or does it show bias towards the pro or con arguments?
2.  **Clarity:** Is the final insight clear, concise, and well-supported by the evidence?
3.  **Completeness:** Has the analysis overlooked any significant contradictions or gaps in the provided research?
4.  **Actionability:** Does the analysis provide a clear, actionable takeaway for the user?

Provide a concise, one-paragraph evaluation of the analysis. Start with a "Grade" from A to F, where A is outstanding and F is a complete failure. Do not be overly generous. Your critique should be constructive and help the user understand the limitations of the analysis.
"""


class CriticAgent(BaseAgent):
    def __init__(self, provider: str = None):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.5, provider=provider)

    async def evaluate(
        self,
        refined_question: str,
        pro_args,
        con_args,
        final_insight: str,
    ) -> tuple[str, str]:
        # Handle list or string inputs
        if isinstance(pro_args, list):
            pro_args = "\n\n".join(pro_args)
        if isinstance(con_args, list):
            con_args = "\n\n".join(con_args)
        
        prompt = (
            f"Research Question: {refined_question}\n\n"
            f"Supporting Arguments:\n{pro_args[:1500]}\n\n"
            f"Counterarguments:\n{con_args[:1500]}\n\n"
            f"Final Insight:\n{final_insight[:500]}\n\n"
            f"Provide your critical evaluation with the following sections:\n"
            f"### Points of Contention\n[identify contradictions]\n"
            f"### Critical Evaluation\n[evaluate the analysis quality]\n"
            f"### Research Gaps & Future Directions\n[identify gaps]"
        )
        return await self._call_llm(prompt, max_tokens=800)
