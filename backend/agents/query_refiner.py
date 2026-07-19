"""
Query Refiner Agent – converts vague user queries into precise academic research questions.
"""
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are an expert academic research librarian.
Your task is to convert a vague user query into a precise, well-scoped academic research question.
The refined question should be:
- Specific and measurable
- Researchable using academic literature
- Free of ambiguity
- Suitable for a systematic review

Return ONLY the refined research question as a single sentence. No explanations, no preamble."""


class QueryRefinerAgent(BaseAgent):
    def __init__(self, provider: str = None):
        super().__init__(system_prompt=SYSTEM_PROMPT, temperature=0.2, provider=provider)

    async def refine(self, user_query: str) -> tuple[str, str]:
        prompt = f"User query: {user_query}\n\nRefine this into a precise academic research question:"
        result, provider = await self._call_llm(prompt, max_tokens=200)
        return result.strip().strip('"').strip("'"), provider
