import json
import logging
from typing import List, Tuple
from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

PLANNER_SYSTEM_PROMPT = """
You are the Lead Research Planner for ResearchPilot. 
Your job is to analyze the user's main query and break it down into 3 to 5 highly specific, distinct search queries.
These sub-queries should cover:
1. Core context and key definitions.
2. Prominent empirical studies, statistics, or reports.
3. Supporting arguments or positive effects.
4. Counterarguments, risks, or contrasting evidence.

You MUST respond ONLY with a raw JSON array of strings containing the sub-queries. Do not include markdown wraps (like ```json) or explanation text.

Example output:
[
  "AI impact on software engineering jobs",
  "AI coding productivity studies",
  "McKinsey software employment report",
  "Arguments against AI replacing developers",
  "Economic effects of AI coding tools"
]
"""

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            system_prompt=PLANNER_SYSTEM_PROMPT,
            temperature=0.3
        )

    async def plan(self, original_query: str) -> Tuple[List[str], str]:
        """Convert a user query into a list of 3-5 distinct sub-queries."""
        try:
            response_text, provider = await self._call_llm(original_query)
            # Remove any markdown code block formatting if present
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                if len(lines) > 1:
                    cleaned = "\n".join(lines[1:])
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("\n", 1)[0]
            cleaned = cleaned.strip("`").strip()
            
            queries = json.loads(cleaned)
            if isinstance(queries, list) and len(queries) > 0:
                # Ensure they are strings and limit to max 5
                valid_queries = [str(q).strip() for q in queries if q][:5]
                return valid_queries, provider
            
            raise ValueError("LLM response was not a valid list")
        except Exception as e:
            logger.error(f"PlannerAgent failed: {e}. Falling back to default list.")
            # Safe fallbacks in case of LLM parsing error
            return [
                original_query,
                f"{original_query} empirical evidence",
                f"{original_query} controversies and risks"
            ], "fallback"
