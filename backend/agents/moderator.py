"""
Moderator Agent – synthesizes all agent outputs into a final balanced research insight.
"""
from agents.base_agent import BaseAgent
from models import EvidenceScore

SYSTEM_PROMPT = """You are a master Synthesizer AI, combining information from multiple debaters into a final, comprehensive, and highly engaging response in the style of Perplexity or ChatGPT. 

Your task is to review the refined user question, along with the distinct arguments provided by two Pro debaters and two Con debaters based on scientific literature.

Your final output MUST:
- Provide a clear, nuanced, and detailed academic answer to the user's question based on the debate.
- Synthesize the strongest points from both the Pro and Con sides.
- Constructively resolve conflicts where possible, and clearly highlight areas of true scientific uncertainty.
- Clearly cite the synthesized evidence.
- Be structured with clear markdown headings and bullet points for readability.
- Be highly informative, objective, and authoritative.

Do not just list the debaters' arguments. Weave them together to form a highly polished answer."""


class ModeratorAgent(BaseAgent):
    def __init__(self, provider: str = None):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.4, provider=provider)

    async def moderate(
        self,
        refined_question: str,
        pro1_args: str,
        pro2_args: str,
        con1_args: str,
        con2_args: str,
    ) -> tuple[str, str]:
        prompt = (
            f"User's Question: {refined_question}\n\n"
            f"--- Pro Argument 1 (Focus: Direct Impacts) ---\n{pro1_args[:1000]}\n\n"
            f"--- Pro Argument 2 (Focus: Systemic/Long-term Impacts) ---\n{pro2_args[:1000]}\n\n"
            f"--- Con Argument 1 (Focus: Direct Risks/Harms) ---\n{con1_args[:1000]}\n\n"
            f"--- Con Argument 2 (Focus: Systemic/Long-term Risks) ---\n{con2_args[:1000]}\n\n"
            f"Synthesize the debate into a comprehensive, Perplexity-style final response:"
        )
        return await self._call_llm(prompt, max_tokens=800)
