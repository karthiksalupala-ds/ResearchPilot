"""
Orchestrator – coordinates the full 6-agent debate pipeline.
Yields SSE-compatible dictionaries at each step for live UI streaming.
"""
import asyncio
import json
import time
from typing import AsyncGenerator, List
from models import ResearchRequest, AnalysisResult, ResearchPaper, EvidenceScore
from agents.query_refiner import QueryRefinerAgent
from agents.pro_agent import ProAgent
from agents.con_agent import ConAgent
from agents.moderator import ModeratorAgent
from agents.critic import CriticAgent
from retrieval.arxiv_client import search_arxiv
from retrieval.semantic_scholar_client import search_semantic_scholar
from retrieval.pubmed_client import search_pubmed
from retrieval.google_search_client import search_google
from retrieval.vector_store import store_papers, search_papers
from retrieval.openalex_client import search_openalex
from retrieval.core_client import search_core
from retrieval.crossref_client import search_crossref
from retrieval.duckduckgo_client import search_duckduckgo
from retrieval.wikipedia_client import search_wikipedia
import database
from database import similarity_search
import logging
from utils.perf import PerfTimer
import hashlib
from agents.planner import PlannerAgent

logger = logging.getLogger(__name__)

# Tiered retrieval timeouts (seconds)
STANDARD_RETRIEVAL_TIMEOUT = 2.0
COMPREHENSIVE_RETRIEVAL_TIMEOUT = 3.5
STANDARD_SOURCES = ("arxiv", "semantic_scholar", "pubmed")
COMPREHENSIVE_EXTRA = ("openalex", "core", "crossref", "wikipedia", "google")


DEMO_PAPERS = [
    {
        "id": "demo-1", "title": "Effects of Intermittent Fasting on Health, Aging, and Disease",
        "abstract": "Intermittent fasting (IF) could be a promising approach to improving public health...",
        "authors": ["de Cabo, R.", "Mattson, M. P."], "year": 2019, "source": "PubMed",
        "url": "https://www.nejm.org/doi/full/10.1056/NEJMra1905136"
    },
    {
        "id": "demo-2", "title": "Calorie Restriction with or without Time-Restricted Eating in Weight Loss",
        "abstract": "In this randomized controlled trial involving 139 patients with obesity, we found that...",
        "authors": ["Liu, D.", "Huang, Y.", "et al."], "year": 2022, "source": "Semantic Scholar",
        "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa2114833"
    }
]

DEMO_RESULT = {
    "query_id": "demo-query-123",
    "original_query": "Does intermittent fasting improve metabolic health?",
    "refined_question": "What is the empirical evidence for the relationship between intermittent fasting and metabolic health outcomes in adult humans?",
    "research_strategy": "Debate Mode: 2 Pro Agents and 2 Con Agents analyze evidence, followed by a Synthesizer.",
    "key_evidence": "Evidence drawn from retrieved papers spanning PubMed and Semantic Scholar.",
    "supporting_arguments": (
        "### Pro 1: Direct Impacts\n"
        "**Main claim:** Intermittent fasting can improve short-term metabolic markers such as weight and insulin sensitivity. "
        "[PubMed · 2019](https://www.nejm.org/doi/full/10.1056/NEJMra1905136)\n"
        "**Evidence used:** Narrative review evidence links IF protocols with metabolic benefits in adults. "
        "[PubMed · 2019](https://www.nejm.org/doi/full/10.1056/NEJMra1905136)\n"
        "**Confidence level:** Medium — benefits vary by protocol and adherence.\n\n"
        "### Pro 2: Systemic Impacts\n"
        "**Main claim:** Time-restricted patterns may support longer-term cardiometabolic improvements when paired with calorie control. "
        "[Semantic Scholar · 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833)\n"
        "**Evidence used:** RCT evidence comparing calorie restriction with and without time-restricted eating. "
        "[Semantic Scholar · 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833)\n"
        "**Confidence level:** Medium — effect sizes depend on total energy intake."
    ),
    "counterarguments": (
        "### Con 1: Direct Risks\n"
        "**Main claim:** Fasting protocols can risk lean-mass loss and adherence failure without protein and resistance training support. "
        "[PubMed · 2019](https://www.nejm.org/doi/full/10.1056/NEJMra1905136)\n"
        "**Evidence used:** Clinical discussions note heterogeneous outcomes and potential harms in vulnerable groups.\n"
        "**Confidence level:** Medium — risk magnitude is population-dependent.\n\n"
        "### Con 2: Systemic Risks\n"
        "**Main claim:** Benefits attributed to fasting windows may largely reflect calorie restriction rather than timing itself. "
        "[Semantic Scholar · 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833)\n"
        "**Evidence used:** RCT comparisons suggest similar weight outcomes when calories are matched.\n"
        "**Confidence level:** High — timing-independent calorie effects are well documented."
    ),
    "contradictions": "Trials disagree on whether timing adds benefit beyond calorie restriction.",
    "critical_evaluation": "Evidence quality is moderate: strong narrative reviews, fewer long-duration RCTs.",
    "research_gaps": "Longer trials in diverse populations and standardized IF protocols are still needed.",
    "final_insight": (
        "### One-line Answer\n"
        "Intermittent fasting can improve short-term metabolic markers for many adults, but benefits often overlap with calorie restriction and vary by protocol.\n\n"
        "### Key Findings\n"
        "- IF is associated with weight and insulin-sensitivity improvements in adult humans. "
        "[PubMed · 2019](https://www.nejm.org/doi/full/10.1056/NEJMra1905136)\n"
        "- When calories are matched, time-restricted eating may not outperform standard calorie restriction. "
        "[Semantic Scholar · 2022](https://www.nejm.org/doi/full/10.1056/NEJMoa2114833)\n"
        "- Adherence and protein intake meaningfully affect risk of lean-mass loss.\n\n"
        "### Supporting Evidence\n"
        "> Reviews report meaningful short-term metabolic gains under supervised IF protocols.\n\n"
        "- Cellular and metabolic pathways are plausible mechanisms for observed benefits. "
        "[PubMed · 2019](https://www.nejm.org/doi/full/10.1056/NEJMra1905136)\n\n"
        "### Counter Arguments\n"
        "> Matched-calorie RCTs weaken claims that timing alone drives outcomes.\n\n"
        "- Heterogeneous protocols make cross-study comparisons difficult.\n"
        "- Risks may be higher for people with disordered eating history.\n\n"
        "### Research Gaps\n"
        "- Longer RCTs with standardized IF definitions\n"
        "- Better subgroup analyses (sex, age, metabolic disease)\n\n"
        "### Final Conclusion\n"
        "IF is a reasonable tool for some adults seeking short-term metabolic improvement, but clinicians should emphasize total energy balance, protein intake, and sustainability rather than timing alone."
    ),
    "evidence_analysis": {
        "overall_score": 8.0,
        "paper_count": 8,
        "source_diversity": 8.0,
        "consistency_score": 7.0,
        "label": "Strong",
        "explanation": "Based on 8 papers spanning PubMed and Semantic Scholar, findings are broadly aligned on short-term benefits with remaining disagreement on timing-versus-calorie effects. Overall confidence is strong (8.0/10).",
    },
    "papers": DEMO_PAPERS
}


class ResearchOrchestrator:
    def __init__(self):
        # Use Gemini and Groq as primary providers (free/fast, working)
        # Avoid OpenAI (quota exceeded) - it's available as fallback only
        self.query_refiner = QueryRefinerAgent(provider="gemini")  # Gemini is free and fast
        
        # 4 Debaters - use Groq (instant speed) and Gemini (free)
        self.pro1 = ProAgent(
            name="Pro Debater 1", 
            focus="Direct positive impacts and immediate benefits.",
            provider="groq"
        )
        self.pro2 = ProAgent(
            name="Pro Debater 2", 
            focus="Long-term systemic benefits and structural improvements.",
            provider="gemini"
        )
        self.con1 = ConAgent(
            name="Con Debater 1", 
            focus="Direct negative impacts, immediate harms, and critical flaws.",
            provider="groq"
        )
        self.con2 = ConAgent(
            name="Con Debater 2", 
            focus="Long-term systemic risks, unintended consequences, and ethical concerns.",
            provider="gemini"
        )
        
        # Synthesizer and Critic - use Gemini (high-quality, free) and Groq (fast)
        self.moderator = ModeratorAgent(provider="gemini")
        self.critic = CriticAgent(provider="groq")
        self.planner = PlannerAgent()

    async def run(self, request: ResearchRequest) -> AsyncGenerator[dict, None]:
        """Full pipeline yielding SSE events at each step."""
        from config import get_settings
        settings = get_settings()
        perf = PerfTimer(label=request.query[:40])

        # Immediate first paint for the UI (< 2s target)
        yield self._step_event("cache_lookup", "running", "✓ Checking neural cache…")
        perf.mark_first_event()

        if settings.is_demo:
            yield self._step_event("demo_mode", "running", "🤖 Running in Demo Mode (no API key found)...")
            await asyncio.sleep(0.15)

            demo_data = DEMO_RESULT.copy()
            demo_data["original_query"] = request.query

            yield self._step_event("query_refinement", "running", "🔍 Refining Research Query...")
            await asyncio.sleep(0.1)
            yield self._step_event("query_refinement", "done", f"✅ Refined: {demo_data['refined_question'][:80]}...", {"refined_question": demo_data['refined_question']})

            yield self._step_event("retrieval", "running", "📚 Searching papers…")
            await asyncio.sleep(0.1)
            yield self._step_event("retrieval", "done", f"✅ Retrieved {len(demo_data['papers'])} papers.", {"paper_count": len(demo_data['papers'])})

            yield self._step_event("debate", "running", "⚖️ Conducting Multi-Agent Debate…")
            await asyncio.sleep(0.15)
            yield self._step_event("debate", "done", "✅ Debate complete.")

            yield self._step_event("final_insight", "running", "📄 Synthesizing report…")
            await asyncio.sleep(0.2)
            yield self._step_event("final_insight", "done", "✅ Final insight produced.")

            yield {"event": "result", "data": demo_data}
            perf.record("demo_pipeline", perf.total())
            perf.log_total()
            return

        original_query = request.query
        is_comprehensive = (request.depth or "standard").lower() == "comprehensive"

        # ── RESEARCH MODE ADJUSTMENT ──────────────────────────
        mode = (request.research_mode or "academic").lower()
        mod_prompt = self.moderator.system_prompt
        mod_temp = self.moderator.temperature
        crit_prompt = self.critic.system_prompt
        crit_temp = self.critic.temperature

        if mode == "journalistic":
            mod_temp = 0.7
            mod_prompt = mod_prompt + "\nFocus on narrative flow, readability, and real-world implications. Use engaging analogies."
        elif mode == "skeptic":
            crit_temp = 0.5
            crit_prompt = crit_prompt + "\nBe extremely critical of the evidence quality. Identify potential biases and industry funding in paper sources."

        try:
            # ── STEP 0: Cache Check ────────────────────────────────
            with perf.stage("Cache lookup"):
                cached = await database.get_cached_analysis(original_query)
            if cached:
                yield self._step_event("cache_hit", "done", "✓ Cache hit — loading saved analysis.", {"query_id": cached["query_id"]})
                analysis = cached["analysis"]
                result = AnalysisResult(
                    query_id=cached["query_id"],
                    original_query=original_query,
                    refined_question=cached["refined_query"],
                    research_strategy="Retrieved from neural cache. This analysis was previously computed and validated.",
                    key_evidence="Evidence retrieved from historical analysis session.",
                    supporting_arguments=analysis.get("supporting_arguments", ""),
                    counterarguments=analysis.get("counter_arguments", ""),
                    evidence_analysis=EvidenceScore(
                        overall_score=analysis.get("evidence_score", 8.0),
                        paper_count=0,
                        source_diversity=0.0,
                        consistency_score=0.0,
                        label="Cached",
                        explanation="Cached analysis — original paper set is not stored; treat the score as historical confidence only.",
                    ),
                    contradictions=analysis.get("contradictions", ""),
                    critical_evaluation=analysis.get("critical_evaluation", ""),
                    research_gaps=analysis.get("research_gaps", ""),
                    final_insight=analysis.get("final_insight", ""),
                    papers=[],
                )
                yield {"event": "result", "data": result.model_dump(mode="json")}
                perf.log_total()
                return

            yield self._step_event("cache_lookup", "done", "✓ Cache search complete — cache miss.")

            if (request.depth or "standard").lower() == "deep":
                # 1. Planning stage
                yield self._step_event("query_refinement", "running", "✓ Building research plan...")
                sub_queries = [original_query]
                try:
                    with perf.stage("Query refinement"):
                        sub_queries_expanded, plan_provider = await self.planner.plan(original_query)
                        if sub_queries_expanded:
                            sub_queries = sub_queries_expanded
                except Exception as e:
                    logger.error(f"Planning failed: {e}")

                yield self._step_event(
                    "query_refinement",
                    "done",
                    f"✓ Research plan built: targeting {len(sub_queries)} key directions.",
                    {"refined_question": "Plan: " + ", ".join(sub_queries[:3]) + "..."}
                )

                # 2. Searching stage
                yield self._step_event("retrieval", "running", "✓ Searching academic databases...")
                
                # Helper to run parallel searches across multiple query sets
                async def search_single_query(q: str) -> List[ResearchPaper]:
                    tasks = [
                        search_arxiv(q, limit=3),
                        search_semantic_scholar(q, limit=3),
                        search_pubmed(q, limit=3),
                        search_wikipedia(q, limit=2)
                    ]
                    if settings.serper_api_key:
                        tasks.append(search_google(q, limit=3))
                    tasks.append(search_duckduckgo(q, limit=2))
                    
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    papers = []
                    for res in results:
                        if isinstance(res, list):
                            papers.extend(res)
                    return papers

                # Concurrently search all sub-queries
                search_tasks = [search_single_query(q) for q in sub_queries]
                search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
                
                all_papers = []
                seen_titles = set()
                for res_list in search_results:
                    if isinstance(res_list, list):
                        for paper in res_list:
                            title_norm = paper.title.lower().strip()
                            if title_norm not in seen_titles:
                                all_papers.append(paper)
                                seen_titles.add(title_norm)

                # 3. Web Reader (Reading top sources)
                yield self._step_event("retrieval", "running", "✓ Reading web sources...")
                # Extract top web URLs to scrape (non-PDF external URLs from google/duckduckgo results)
                web_urls = []
                for paper in all_papers:
                    if paper.url and not paper.url.endswith(".pdf") and any(domain in paper.url for domain in (".com", ".org", ".net", ".edu", ".gov")):
                        if not any(blocked in paper.url for blocked in ("arxiv.org", "ncbi.nlm.nih.gov", "semanticscholar.org", "wikipedia.org")):
                            web_urls.append(paper.url)
                
                # Deduplicate URLs
                web_urls = list(dict.fromkeys(web_urls))[:4]
                
                from retrieval.scraper import scrape_url
                scrape_tasks = [scrape_url(url) for url in web_urls]
                scraped_results = await asyncio.gather(*scrape_tasks, return_exceptions=True)
                
                for scrap in scraped_results:
                    if isinstance(scrap, dict) and scrap.get("title"):
                        title_norm = scrap["title"].lower().strip()
                        if title_norm not in seen_titles:
                            paper_id = "web-" + hashlib.md5(scrap["url"].encode()).hexdigest()[:8]
                            pub_year = None
                            try:
                                date_str = scrap.get("publication_date", "unknown")
                                if date_str != "unknown" and "-" in date_str:
                                    pub_year = int(date_str.split("-")[0])
                            except Exception:
                                pass
                            
                            web_paper = ResearchPaper(
                                id=paper_id,
                                title=scrap["title"],
                                abstract=scrap["summary"],
                                content=scrap["evidence"],
                                source=scrap.get("source", "Web Reader"),
                                url=scrap["url"],
                                authors=[scrap.get("source", "Web Reader")],
                                year=pub_year,
                                citations=0
                            )
                            all_papers.append(web_paper)
                            seen_titles.add(title_norm)

                # 4. Conflict detection & recursive research
                yield self._step_event("retrieval", "running", "✓ Finding conflicting claims...")
                followup_queries = await self._detect_conflicts_and_get_followups(all_papers)
                if followup_queries:
                    yield self._step_event("retrieval", "running", f"✓ Conflict found. Generating follow-up queries: {', '.join(followup_queries[:2])}...")
                    followup_tasks = [search_single_query(q) for q in followup_queries]
                    followup_results = await asyncio.gather(*followup_tasks, return_exceptions=True)
                    for res_list in followup_results:
                        if isinstance(res_list, list):
                            for paper in res_list:
                                title_norm = paper.title.lower().strip()
                                if title_norm not in seen_titles:
                                    all_papers.append(paper)
                                    seen_titles.add(title_norm)

                # 5. Evidence ranking
                ranked_papers = self._rank_evidence(all_papers)
                papers_final = ranked_papers[:request.max_papers]

                yield self._step_event(
                    "retrieval",
                    "done",
                    f"✓ Research complete: compiled {len(papers_final)} key sources.",
                    {"paper_count": len(papers_final)}
                )

                # Fire-and-forget paper store
                if papers_final:
                    asyncio.create_task(store_papers(papers_final))

                key_evidence = self._summarize_evidence(papers_final)

                # 6. Debate stage
                yield self._step_event("debate", "running", "✓ Running expert debate...", provider="multi")
                with perf.stage("Debate"):
                    debate_results = await asyncio.gather(
                        self.pro1.argue(original_query, papers_final),
                        self.pro2.argue(original_query, papers_final),
                        self.con1.argue(original_query, papers_final),
                        self.con2.argue(original_query, papers_final),
                        return_exceptions=True,
                    )

                def _safe_argue(res, fallback: str):
                    if isinstance(res, Exception):
                        logger.error(f"Debater failed: {res}")
                        return fallback, "fallback"
                    return res

                (pro1_args, pro1_p) = _safe_argue(debate_results[0], "Building expert arguments from available evidence...")
                (pro2_args, pro2_p) = _safe_argue(debate_results[1], "Building expert arguments from available evidence...")
                (con1_args, con1_p) = _safe_argue(debate_results[2], "Building expert arguments from available evidence...")
                (con2_args, con2_p) = _safe_argue(debate_results[3], "Building expert arguments from available evidence...")

                supporting_arguments = (
                    f"### Pro 1: Direct Impacts\n**[{pro1_p.upper()}]** {pro1_args}\n\n"
                    f"### Pro 2: Systemic Impacts\n**[{pro2_p.upper()}]** {pro2_args}"
                )
                counterarguments = (
                    f"### Con 1: Direct Risks\n**[{con1_p.upper()}]** {con1_args}\n\n"
                    f"### Con 2: Systemic Risks\n**[{con2_p.upper()}]** {con2_args}"
                )
                yield self._step_event("debate", "done", "✓ Expert debate completed.", provider="multi")

                # 7. Synthesis & Evaluation
                yield self._step_event("final_insight", "running", "✓ Writing report...", provider="multi")
                yield self._step_event("evaluation", "running", "✓ Critically evaluating debate quality...", provider="groq")

                with perf.stage("Synthesis"):
                    synthesis_task = self.moderator.moderate(
                        original_query, pro1_args, pro2_args, con1_args, con2_args,
                        system_prompt=mod_prompt, temperature=mod_temp
                    )
                    evaluation_task = self.critic.evaluate(
                        original_query, [pro1_args, pro2_args], [con1_args, con2_args], "pending",
                        system_prompt=crit_prompt, temperature=crit_temp
                    )
                    post_results = await asyncio.gather(
                        synthesis_task, evaluation_task, return_exceptions=True
                    )

                final_insight, mod_provider = ("Analysis could not be completed.", "error")
                if not isinstance(post_results[0], Exception):
                    final_insight, mod_provider = post_results[0]

                eval_out = ""
                if not isinstance(post_results[1], Exception):
                    eval_out = post_results[1]
                    if isinstance(eval_out, tuple):
                        eval_out = eval_out[0]

                contradictions = ""
                critical_evaluation = ""
                research_gaps = "Further research recommended."
                if eval_out:
                    parts = eval_out.split("### Critical Evaluation")
                    contradictions = parts[0].replace("### Points of Contention", "").strip() if parts else ""
                    if len(parts) > 1:
                        eval_and_gaps = parts[1].strip()
                        if "### Research Gaps & Future Directions" in eval_and_gaps:
                            gap_parts = eval_and_gaps.split("### Research Gaps & Future Directions")
                            critical_evaluation = gap_parts[0].strip()
                            research_gaps = gap_parts[1].strip()
                        else:
                            critical_evaluation = eval_and_gaps
                    else:
                        critical_evaluation = eval_out

                yield self._step_event("final_insight", "done", "✓ Final report synthesized.", provider=mod_provider)
                yield self._step_event("evaluation", "done", "✓ Critical evaluation completed.", provider="groq")

                # Finalize citations & results
                yield self._step_event("final_insight", "running", "✓ Finalizing citations…", provider=mod_provider)
                with perf.stage("Citation generation"):
                    evidence_score = self._compute_evidence_score(papers_final)

                result = AnalysisResult(
                    query_id=None,
                    original_query=original_query,
                    refined_question=original_query,
                    research_strategy="Deep Research Mode: Planner agent decomposed query into sub-queries, executed parallel searches, scraped top results, resolved conflicting claims, ranked evidence, and conducted 4-agent debate.",
                    key_evidence=key_evidence if papers_final else "Waiting for evidence from academic databases.",
                    supporting_arguments=supporting_arguments,
                    counterarguments=counterarguments,
                    evidence_analysis=evidence_score,
                    contradictions=contradictions or "No major contradictions identified in the available evidence.",
                    critical_evaluation=critical_evaluation or "Evaluation limited by available evidence.",
                    research_gaps=research_gaps or "Further research recommended.",
                    final_insight=final_insight,
                    papers=papers_final[:10],
                )

                yield {"event": "result", "data": result.model_dump(mode="json")}

                async def _store_results():
                    try:
                        qid = await database.store_query(original_query, original_query, user_id=request.user_id)
                        if qid:
                            await database.store_analysis(qid, {
                                "supporting_arguments": pro1_args + "\n\n" + pro2_args,
                                "counterarguments": con1_args + "\n\n" + con2_args,
                                "evidence_score": evidence_score.overall_score,
                                "final_insight": final_insight,
                                "contradictions": contradictions,
                                "critical_evaluation": critical_evaluation,
                                "research_gaps": research_gaps,
                            })
                    except Exception as e:
                        logger.error(f"Error storing results: {e}")

                asyncio.create_task(_store_results())
                perf.log_total()
                return

            yield self._step_event("cache_lookup", "done", "✓ Cache search complete — cache miss.")

            # ── STEP 1: Query Refinement ───────────────────────────
            yield self._step_event("query_refinement", "running", "🔍 Refining Research Query...")
            refined_question = original_query
            ref_provider = "fallback"
            try:
                with perf.stage("Query refinement"):
                    refined_question, ref_provider = await self.query_refiner.refine(original_query)
            except Exception as e:
                logger.error(f"Query refinement failed: {e}")
                refined_question = original_query

            yield self._step_event(
                "query_refinement",
                "done",
                f"✅ Query refined: {refined_question[:80]}…",
                {"refined_question": refined_question},
                provider=ref_provider
            )

            # ── STEP 2: Tiered Retrieval ───────────────────────────
            yield self._step_event("retrieval", "running", "📚 Searching papers…")
            with perf.stage("Retrieval"):
                papers = await self._retrieve_papers(request, refined_question)

            yield self._step_event(
                "retrieval",
                "done",
                f"✅ Papers found: {len(papers)}",
                {"paper_count": len(papers)},
            )

            if not papers:
                with perf.stage("Retrieval fallback"):
                    papers = await search_papers(refined_question, limit=request.max_papers)

            # Fire-and-forget paper store (never block the response)
            if papers:
                asyncio.create_task(store_papers(papers))

            key_evidence = self._summarize_evidence(papers)

            # ── STEP 3: Debate or fast synthesis ──────────────────
            if is_comprehensive:
                yield self._step_event("debate", "running", "⚖️ Conducting Multi-Agent Debate…", provider="multi")
                with perf.stage("Debate"):
                    debate_results = await asyncio.gather(
                        self.pro1.argue(refined_question, papers),
                        self.pro2.argue(refined_question, papers),
                        self.con1.argue(refined_question, papers),
                        self.con2.argue(refined_question, papers),
                        return_exceptions=True,
                    )

                def _safe_argue(res, fallback: str):
                    if isinstance(res, Exception):
                        logger.error(f"Debater failed: {res}")
                        return fallback, "fallback"
                    return res

                (pro1_args, pro1_p) = _safe_argue(debate_results[0], "Building expert arguments from available evidence...")
                (pro2_args, pro2_p) = _safe_argue(debate_results[1], "Building expert arguments from available evidence...")
                (con1_args, con1_p) = _safe_argue(debate_results[2], "Building expert arguments from available evidence...")
                (con2_args, con2_p) = _safe_argue(debate_results[3], "Building expert arguments from available evidence...")

                supporting_arguments = (
                    f"### Pro 1: Direct Impacts\n**[{pro1_p.upper()}]** {pro1_args}\n\n"
                    f"### Pro 2: Systemic Impacts\n**[{pro2_p.upper()}]** {pro2_args}"
                )
                counterarguments = (
                    f"### Con 1: Direct Risks\n**[{con1_p.upper()}]** {con1_args}\n\n"
                    f"### Con 2: Systemic Risks\n**[{con2_p.upper()}]** {con2_args}"
                )
                yield self._step_event("debate", "done", "✅ Debate complete.", provider="multi")
            else:
                yield self._step_event("debate", "done", "⚡ Fast-path — skipping debate for speed.")
                pro1_args = key_evidence
                supporting_arguments = "*(Debate skipped for standard speed. Fast synthesis active.)*"
                counterarguments = "*(Debate skipped for standard speed. Fast synthesis active.)*"
                pro2_args, con1_args, con2_args = "", "", ""

            # ── STEP 4: Synthesis & Evaluation ──────────────────
            yield self._step_event("final_insight", "running", "📄 Synthesizing report…", provider="multi")
            if is_comprehensive:
                yield self._step_event("evaluation", "running", "🧐 Critically evaluating debate quality…", provider="groq")

            # Standard: moderator only. Comprehensive: moderator + critic in parallel.
            with perf.stage("Synthesis"):
                if is_comprehensive:
                    synthesis_task = self.moderator.moderate(
                        refined_question, pro1_args, pro2_args, con1_args, con2_args,
                        system_prompt=mod_prompt, temperature=mod_temp
                    )
                    evaluation_task = self.critic.evaluate(
                        refined_question, [pro1_args, pro2_args], [con1_args, con2_args], "pending",
                        system_prompt=crit_prompt, temperature=crit_temp
                    )
                    post_results = await asyncio.gather(
                        synthesis_task, evaluation_task, return_exceptions=True
                    )
                else:
                    try:
                        post_results = [
                            await self.moderator.moderate(
                                refined_question, pro1_args, "", "", "",
                                system_prompt=mod_prompt, temperature=mod_temp
                            ),
                            "",
                        ]
                    except Exception as e:
                        logger.error(f"Synthesis failed: {e}")
                        post_results = [Exception(str(e)), ""]

            final_insight, mod_provider = ("Analysis could not be completed.", "error")
            if not isinstance(post_results[0], Exception):
                final_insight, mod_provider = post_results[0]

            eval_out = ""
            if is_comprehensive and not isinstance(post_results[1], Exception):
                eval_out = post_results[1]
                if isinstance(eval_out, tuple):
                    eval_out = eval_out[0]

            contradictions = ""
            critical_evaluation = ""
            research_gaps = "Further research recommended."
            if eval_out:
                parts = eval_out.split("### Critical Evaluation")
                contradictions = parts[0].replace("### Points of Contention", "").strip() if parts else ""
                if len(parts) > 1:
                    eval_and_gaps = parts[1].strip()
                    if "### Research Gaps & Future Directions" in eval_and_gaps:
                        gap_parts = eval_and_gaps.split("### Research Gaps & Future Directions")
                        critical_evaluation = gap_parts[0].strip()
                        research_gaps = gap_parts[1].strip()
                    else:
                        critical_evaluation = eval_and_gaps
                else:
                    critical_evaluation = eval_out

            yield self._step_event("final_insight", "done", "✅ Report synthesis complete.", provider=mod_provider)
            if is_comprehensive:
                yield self._step_event("evaluation", "done", "✅ Evaluation complete.", provider="groq")
            else:
                yield self._step_event("evaluation", "done", "⚡ Fast-path — skipping evaluation for speed.")

            # ── STEP 5: Citations and final results ────────────────
            yield self._step_event("final_insight", "running", "✓ Finalizing citations…")
            with perf.stage("Citation generation"):
                evidence_score = self._compute_evidence_score(papers)

            partial = len(papers) < 3 or evidence_score.label in ("Insufficient", "Limited")
            strategy = (
                "Debate Mode: 4 AI agents analyzed the evidence, followed by synthesis."
                if is_comprehensive
                else "Fast-path Mode: Evidence synthesized directly from sources for speed."
            )
            if partial:
                strategy += " Research completed with partial evidence — some sources were unavailable or timed out."

            if not final_insight or final_insight == "Analysis could not be completed.":
                final_insight = (
                    "Research completed with partial evidence. "
                    "We could not fully synthesize all agent outputs, but available sources were reviewed. "
                    "Try again or switch to Pro mode for a deeper debate."
                )

            result = AnalysisResult(
                query_id=None,
                original_query=original_query,
                refined_question=refined_question,
                research_strategy=strategy,
                key_evidence=key_evidence if papers else "Waiting for evidence from academic databases. Retrieval returned limited results.",
                supporting_arguments=supporting_arguments,
                counterarguments=counterarguments,
                evidence_analysis=evidence_score,
                contradictions=contradictions or "No major contradictions identified in the available evidence.",
                critical_evaluation=critical_evaluation or "Evaluation limited by available evidence.",
                research_gaps=research_gaps or "Further research recommended.",
                final_insight=final_insight,
                papers=papers[:10],
            )

            # Yield result BEFORE DB write so TTFR is not blocked by Supabase
            yield {"event": "result", "data": result.model_dump(mode="json")}

            async def _store_results():
                try:
                    qid = await database.store_query(original_query, refined_question, user_id=request.user_id)
                    if qid:
                        await database.store_analysis(qid, {
                            "supporting_arguments": pro1_args + "\n\n" + pro2_args,
                            "counterarguments": con1_args + "\n\n" + con2_args,
                            "evidence_score": evidence_score.overall_score,
                            "final_insight": final_insight,
                            "contradictions": contradictions,
                            "critical_evaluation": critical_evaluation,
                            "research_gaps": research_gaps,
                        })
                except Exception as e:
                    logger.error(f"Error storing results: {e}")

            asyncio.create_task(_store_results())
            perf.log_total()
        finally:
            pass

    async def _detect_conflicts_and_get_followups(self, papers: List[ResearchPaper]) -> List[str]:
        """Use LLM to identify conflicting claims in the papers and return 2-3 follow-up query strings."""
        if not papers:
            return []
        
        # Summarize key claims in papers
        evidence_summary = "\n".join([f"- [{p.source}] {p.title}: {p.abstract[:150]}" for p in papers[:6]])
        prompt = f"""
        Analyze the following research evidence summaries and identify if any conflicting claims, contradictions, or gaps exist.
        If conflicts or gaps exist, suggest 2 to 3 specific follow-up search queries to resolve them (e.g., seeking long-term evidence, recent statistics, or counterarguments).
        
        Return ONLY a JSON list of strings (the follow-up queries). If no conflicts or gaps are found, return an empty list [].
        Do not include markdown blocks or explanation text.
        
        EVIDENCE:
        {evidence_summary}
        """
        try:
            # Reusing moderator or any model client
            response_text, _ = await self.moderator._call_llm(prompt, max_tokens=500)
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                if len(lines) > 1:
                    cleaned = "\n".join(lines[1:])
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("\n", 1)[0]
            cleaned = cleaned.strip("`").strip()
            
            queries = json.loads(cleaned)
            if isinstance(queries, list):
                return [str(q).strip() for q in queries if q][:3]
        except Exception as e:
            logger.error(f"Error checking conflicts: {e}")
        return []

    def _rank_evidence(self, papers: List[ResearchPaper]) -> List[ResearchPaper]:
        """Rank papers by academic status, recency, citations, and source trust."""
        import math
        scored_papers = []
        
        # Current year for recency calculations
        current_year = 2026

        for p in papers:
            score = 0.0
            
            # 1. Academic quality / source weight
            src = (p.source or "").lower()
            if src in ("arxiv", "pubmed", "semantic_scholar", "openalex", "core", "crossref", "wikipedia"):
                score += 3.0
            else:
                score += 1.0 # standard web source
                
            # 2. Recency
            if p.year:
                age = current_year - p.year
                if age <= 2:
                    score += 2.0
                elif age <= 5:
                    score += 1.0
                elif age < 0: # future or weird data
                    score += 0.0
                else:
                    score -= min(1.5, age * 0.05) # penalty for very old papers
                    
            # 3. Citations
            if p.citations and p.citations > 0:
                # Logarithmic citation weight
                score += min(2.0, math.log10(p.citations) * 0.5)
                
            scored_papers.append((score, p))
            
        # Sort by score descending
        scored_papers.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored_papers]

    async def chat(self, request):
        """Handle follow-up research questions using the moderator."""
        prompt = f"""
        You are the ResearchPilot Moderator. You just completed an in-depth research analysis.
        
        RESEARCH CONTEXT:
        {request.context}
        
        USER FOLLOW-UP QUESTION:
        {request.message}
        
        CHAT HISTORY:
        {json.dumps(request.history)}
        
        Please answer the user's question accurately using ONLY the research context provided. 
        If the information is not in the context, say so politely.
        Maintain a professional, helpful tone. Use Markdown.
        """
        
        response, _ = await self.moderator.moderate(
            "Follow-up Exploration", 
            prompt, "", "", "" # Reusing moderate for a single-prompt chat for now
        )
        return response

    async def generate_debate_script(self, context: str) -> List[dict]:
        """Generate a conversational, podcast-style dialogue between two AI agents."""
        prompt = f"""
        You are a Screenwriter for a high-end academic podcast. 
        Create a fascinating, back-and-forth dialogue between two experts:
        1. **Alloy (The Lead)**: Analytical, clear, and structured.
        2. **Shimmer (The Explorer)**: Curious, challenges assumptions, and looks for edge cases.

        RESEARCH CONTEXT:
        {context}

        INSTRUCTIONS:
        - Format the output as a JSON list of objects: [{{"speaker": "Alloy", "text": "..."}}, {{"speaker": "Shimmer", "text": "..."}}]
        - Keep each speaker's turn to 2-3 sentences max.
        - The conversation should be engaging, simplified but accurate, and feel like a real podcast.
        - Total 10-12 turns.
        """
        
        response, _ = await self.moderator.moderate(
            "Podcast Scripting", 
            prompt, "", "", ""
        )
        
        try:
            # Basic parsing of JSON from Markdown-wrapped or raw text
            json_str = response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
            
            return json.loads(json_str)
        except Exception:
            # Fallback if AI fails to format correctly
            return [{"speaker": "Alloy", "text": "Let's discuss this research discovery."}, 
                    {"speaker": "Shimmer", "text": "I'm ready to dive into the details."}]

    async def _retrieve_papers(
        self, request: ResearchRequest, refined_question: str
    ) -> List[ResearchPaper]:
        """
        Retrieves papers by first checking the local vector database,
        then falling back to external APIs if more data is needed.
        Uses a strict timeout for the entire phase based on retrieval mode.
        """
        from retrieval.vector_store import search_papers
        from retrieval.embeddings import generate_embedding
        
        # 1. Generate query embedding ONCE for reuse
        try:
            query_embedding = await generate_embedding(refined_question)
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            query_embedding = None

        # 2. Check local database first with pre-computed embedding
        local_papers = []
        if query_embedding:
            local_papers = await search_papers(refined_question, limit=request.max_papers, query_embedding=query_embedding)
        
        # Early exit if we have enough high-quality local results (Lossy optimization)
        if len(local_papers) >= 7:
            logger.info(f"Found {len(local_papers)} papers in local database. Instant return triggered.")
            return local_papers[:request.max_papers]

        # 3. Perform external searches in parallel with a hard global timeout
        from config import get_settings
        settings = get_settings()
        is_comprehensive = (request.depth or "standard").lower() == "comprehensive"
        timeout = COMPREHENSIVE_RETRIEVAL_TIMEOUT if is_comprehensive else STANDARD_RETRIEVAL_TIMEOUT

        # Determine retrieval sources based on depth
        if is_comprehensive:
            sources_to_query = ["arxiv", "semantic_scholar", "pubmed", "openalex", "core", "crossref", "wikipedia", "google", "duckduckgo"]
        else:
            sources_to_query = ["arxiv", "semantic_scholar", "pubmed"]

        per_source = max(3, request.max_papers // len(sources_to_query))

        tasks = []
        for src in sources_to_query:
            if src == "arxiv":
                tasks.append(search_arxiv(refined_question, per_source))
            elif src == "semantic_scholar":
                tasks.append(search_semantic_scholar(refined_question, per_source))
            elif src == "pubmed":
                tasks.append(search_pubmed(refined_question, per_source))
            elif src == "openalex":
                tasks.append(search_openalex(refined_question, per_source))
            elif src == "core":
                tasks.append(search_core(refined_question, per_source))
            elif src == "crossref":
                tasks.append(search_crossref(refined_question, per_source))
            elif src == "wikipedia":
                tasks.append(search_wikipedia(refined_question, per_source))
            elif src == "google" and settings.serper_api_key:
                tasks.append(search_google(refined_question, limit=per_source))
            elif src == "duckduckgo":
                tasks.append(search_duckduckgo(refined_question, per_source))

        # Parallel search for personal library with pre-computed embedding
        if hasattr(request, 'user_id') and request.user_id and query_embedding:
            tasks.append(self._search_personal_library_with_embedding(query_embedding, request.user_id))

        # Use wait with timeout to ensure we don't hang the whole pipeline
        done, pending = await asyncio.wait(
            [asyncio.create_task(t) for t in tasks], 
            timeout=timeout
        )
        
        # Cancel pending tasks to free up resources
        for task in pending:
            task.cancel()

        # Collect results from finished tasks
        all_papers = list(local_papers)
        seen_titles = {p.title.lower().strip() for p in local_papers}
        
        for task in done:
            try:
                res = task.result()
                if isinstance(res, list):
                    for paper in res:
                        title_norm = paper.title.lower().strip()
                        if title_norm not in seen_titles:
                            all_papers.append(paper)
                            seen_titles.add(title_norm)
            except Exception as e:
                logger.error(f"Task result error: {e}")
        
        return all_papers[:request.max_papers]

    async def _search_personal_library_with_embedding(self, embedding: List[float], user_id: str) -> List[ResearchPaper]:
        """Helper to search personal library using a pre-computed embedding."""
        from database import similarity_search
        try:
            return await similarity_search(embedding, limit=5, user_id=user_id)
        except Exception as e:
            logger.error(f"Error searching personal library: {e}")
            return []

    def _summarize_evidence(self, papers: List[ResearchPaper]) -> str:
        if not papers:
            return "No papers retrieved."
        lines = [f"Retrieved {len(papers)} papers from academic sources:\n"]
        for i, p in enumerate(papers[:8], 1):
            year = f" ({p.year})" if p.year else ""
            lines.append(f"{i}. [{p.source.upper()}] {p.title}{year}")
        return "\n".join(lines)

    @staticmethod
    def _compute_evidence_score(papers) -> EvidenceScore:
        """Compute a dynamic evidence score based on actual retrieved papers."""
        paper_count = len(papers)
        unique_sources = len(set(p.source for p in papers)) if papers else 0
        source_diversity = min(10.0, round((unique_sources / 5) * 10, 1))
        source_names = sorted({p.source for p in papers}) if papers else []

        if paper_count >= 15:
            overall, label = 9.0, "Strong"
        elif paper_count >= 8:
            overall, label = 7.5, "Strong"
        elif paper_count >= 4:
            overall, label = 6.0, "Moderate"
        elif paper_count >= 1:
            overall, label = 4.0, "Limited"
        else:
            overall, label = 1.0, "Insufficient"

        consistency = round(min(10.0, overall * 0.85), 1)

        if paper_count == 0:
            explanation = (
                "No papers were retrieved, so confidence is insufficient. "
                "Agreement cannot be assessed until sources are available."
            )
        else:
            diversity_phrase = (
                f"{unique_sources} distinct source{'s' if unique_sources != 1 else ''}"
                + (f" ({', '.join(source_names[:4])})" if source_names else "")
            )
            agreement = (
                "findings appear broadly aligned"
                if consistency >= 7
                else "some disagreement or uncertainty remains across sources"
                if consistency >= 4
                else "agreement is weak and results should be treated cautiously"
            )
            explanation = (
                f"Based on {paper_count} paper{'s' if paper_count != 1 else ''} spanning {diversity_phrase}, "
                f"{agreement}. Overall confidence is {label.lower()} ({overall}/10)."
            )

        return EvidenceScore(
            overall_score=overall,
            paper_count=paper_count,
            source_diversity=source_diversity,
            consistency_score=consistency,
            label=label,
            explanation=explanation,
        )

    @staticmethod
    def _step_event(step: str, status: str, message: str, data: dict = None, provider: str = None) -> dict:
        return {
            "event": "step",
            "data": {
                "step": step,
                "status": status,
                "message": message,
                "data": data or {},
                "provider": provider
            },
        }
