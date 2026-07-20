"""
Moderator Agent – synthesizes all agent outputs into a final balanced research insight.
"""
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """You are the Lead Research Moderator and Synthesizer AI for ResearchPilot, creating reports in the style of NotebookLM, Perplexity, and Elicit.

Review the user's question plus the Pro and Con debater arguments grounded in scientific literature.

Your final output MUST follow this EXACT structure using markdown headers (# level) and horizontal rules (---) in this order:

# One-line Answer
Provide a concise, definitive answer to the question in exactly 2–3 sentences. Do not use bullet points here.

---

# Key Findings
State 2 to 4 major findings. Render each finding exactly as a bullet block:
- **[Finding Claim]**:
  - **Supporting evidence**: [Brief evidence summary]
  - **Confidence level**: [High | Moderate | Low]

---

# Supporting Evidence
State the detailed supporting arguments as clean evidence blocks:
- **Claim**: [Support Claim]
- **Source**: [Source Name]
- **Publication year**: [Year]
- **Confidence**: [High | Moderate | Low]
- [Open Paper](URL)

---

# Counter Arguments
Display opposing evidence or criticisms with source references in the format `[Source • Year](URL)`.

---

# Research Gaps
Explicitly list identified gaps and unanswered questions, including missing studies, contradictions, small sample sizes, or unknown long-term effects.

---

# Final Conclusion
A balanced and concise synthesis of the research resolving the debate constructively.

STRICT INFERENCE RULES:
1. Never generate claims without sources.
2. Never hallucinate paper names, authors, or publication years.
3. Explicitly mention "insufficient evidence" when evidence is weak or contradictory.
4. Assign confidence levels (High / Medium / Low) to all claims.
5. Explain disagreements and discrepancies between sources clearly.
6. Clearly distinguish peer-reviewed academic evidence (PubMed, arXiv, Semantic Scholar) from web evidence.
7. Cite EVERY major claim with this exact markdown citation format: `[Source • Year](URL)` (using the bullet dot `•`). If the exact URL is unknown, cite as `[Source • Year](#)`.
"""


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
        system_prompt: str = None,
        temperature: float = None,
    ) -> tuple[str, str]:
        prompt = (
            f"User's Question: {refined_question}\n\n"
            f"--- Pro Argument 1 (Focus: Direct Impacts) ---\n{pro1_args[:1200]}\n\n"
            f"--- Pro Argument 2 (Focus: Systemic/Long-term Impacts) ---\n{pro2_args[:1200]}\n\n"
            f"--- Con Argument 1 (Focus: Direct Risks/Harms) ---\n{con1_args[:1200]}\n\n"
            f"--- Con Argument 2 (Focus: Systemic/Long-term Risks) ---\n{con2_args[:1200]}\n\n"
            f"Produce the structured research document now:"
        )
        return await self._call_llm(prompt, max_tokens=1600, system_prompt=system_prompt, temperature=temperature)
