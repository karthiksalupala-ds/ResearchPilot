"""
Unit tests for ResearchOrchestrator – pipeline steps, evidence scoring,
demo mode, cache hits, and depth modes.
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from models import ResearchPaper, ResearchRequest, EvidenceScore
from agents.orchestrator import ResearchOrchestrator, DEMO_RESULT


@pytest.fixture
def orchestrator():
    return ResearchOrchestrator()


class TestEvidenceScore:
    def test_empty_papers_insufficient(self, orchestrator):
        score = orchestrator._compute_evidence_score([])
        assert score.overall_score == 1.0
        assert score.label == "Insufficient"
        assert score.paper_count == 0

    def test_few_papers_limited(self, orchestrator, sample_papers):
        score = orchestrator._compute_evidence_score(sample_papers[:1])
        assert score.label == "Limited"
        assert score.paper_count == 1

    def test_moderate_papers(self, orchestrator, sample_papers):
        # 3 papers from distinct sources → Moderate (4+ needed for Moderate)
        score = orchestrator._compute_evidence_score(sample_papers)
        assert score.paper_count == 3
        assert score.label == "Limited"  # < 4 papers
        assert score.source_diversity > 0

    def test_strong_with_many_papers(self, orchestrator, sample_papers):
        many = sample_papers * 5  # 15 papers
        score = orchestrator._compute_evidence_score(many)
        assert score.label == "Strong"
        assert score.overall_score >= 9.0

    def test_score_bounds(self, orchestrator, sample_papers):
        score = orchestrator._compute_evidence_score(sample_papers)
        assert 0.0 <= score.overall_score <= 10.0
        assert 0.0 <= score.source_diversity <= 10.0
        assert 0.0 <= score.consistency_score <= 10.0


class TestSummarizeEvidence:
    def test_no_papers(self, orchestrator):
        assert "No papers" in orchestrator._summarize_evidence([])

    def test_includes_titles(self, orchestrator, sample_papers):
        summary = orchestrator._summarize_evidence(sample_papers)
        assert "Intermittent Fasting" in summary
        assert "ARXIV" in summary.upper() or "arxiv" in summary.lower()


class TestStepEvent:
    def test_step_event_shape(self, orchestrator):
        evt = orchestrator._step_event("retrieval", "running", "Searching...", {"n": 1}, "arxiv")
        assert evt["event"] == "step"
        assert evt["data"]["step"] == "retrieval"
        assert evt["data"]["status"] == "running"
        assert evt["data"]["provider"] == "arxiv"
        assert evt["data"]["data"]["n"] == 1

    def test_step_event_defaults(self, orchestrator):
        evt = orchestrator._step_event("debate", "done", "OK")
        assert evt["data"]["data"] == {}
        assert evt["data"]["provider"] is None


class TestDemoPipeline:
    @pytest.mark.asyncio
    async def test_demo_mode_yields_result(self, orchestrator, research_request):
        events = []
        async for event in orchestrator.run(research_request):
            events.append(event)

        event_types = [e["event"] for e in events]
        assert "result" in event_types
        result = next(e for e in events if e["event"] == "result")
        assert result["data"]["original_query"] == research_request.query
        assert "papers" in result["data"]
        assert len(result["data"]["papers"]) >= 1

    @pytest.mark.asyncio
    async def test_demo_emits_pipeline_steps(self, orchestrator, research_request):
        steps = []
        async for event in orchestrator.run(research_request):
            if event["event"] == "step":
                steps.append(event["data"]["step"])

        assert "demo_mode" in steps or "query_refinement" in steps
        assert "retrieval" in steps
        assert "final_insight" in steps


class TestCacheHit:
    @pytest.mark.asyncio
    async def test_cache_hit_short_circuits(self, orchestrator, research_request):
        cached = {
            "query_id": "cached-qid",
            "refined_query": "Refined cached question",
            "analysis": {
                "supporting_arguments": "Pro side",
                "counter_arguments": "Con side",
                "evidence_score": 7.5,
                "final_insight": "Cached insight",
                "contradictions": "",
                "critical_evaluation": "Eval",
                "research_gaps": "Gaps",
            },
        }

        with patch("config.get_settings") as gs:
            settings = MagicMock()
            settings.is_demo = False
            gs.return_value = settings

            with patch("database.get_cached_analysis", new=AsyncMock(return_value=cached)):
                events = []
                async for event in orchestrator.run(research_request):
                    events.append(event)

        result = next(e for e in events if e["event"] == "result")
        assert result["data"]["query_id"] == "cached-qid"
        assert result["data"]["final_insight"] == "Cached insight"
        assert result["data"]["papers"] == []
        # No retrieval after cache hit
        step_names = [e["data"]["step"] for e in events if e["event"] == "step"]
        assert "retrieval" not in step_names
        assert "cache_hit" in step_names


class TestLivePipelineStandard:
    @pytest.mark.asyncio
    async def test_standard_depth_skips_debate_agents(
        self, orchestrator, research_request, sample_papers, mock_llm_success
    ):
        with patch("config.get_settings") as gs:
            settings = MagicMock()
            settings.is_demo = False
            gs.return_value = settings

            with patch("database.get_cached_analysis", new=AsyncMock(return_value=None)), \
                 patch.object(orchestrator, "_retrieve_papers", new=AsyncMock(return_value=sample_papers)), \
                 patch("agents.orchestrator.store_papers", new=AsyncMock()), \
                 patch("database.store_query", new=AsyncMock(return_value="qid-1")), \
                 patch("database.store_analysis", new=AsyncMock(return_value=True)), \
                 patch.object(orchestrator.pro1, "argue", new=AsyncMock()) as pro1, \
                 patch.object(orchestrator.moderator, "moderate", new=AsyncMock(return_value=("Insight text", "mock"))), \
                 patch.object(orchestrator.critic, "evaluate", new=AsyncMock(return_value="### Points of Contention\nNone\n### Critical Evaluation\nOK\n### Research Gaps & Future Directions\nMore RCTs")):

                events = []
                async for event in orchestrator.run(research_request):
                    events.append(event)

                # Standard depth should NOT call debate agents
                pro1.assert_not_called()

        result = next(e for e in events if e["event"] == "result")
        assert result["data"]["final_insight"] == "Insight text"
        assert "Fast-path" in result["data"]["research_strategy"] or "skip" in result["data"]["supporting_arguments"].lower()


class TestLivePipelineComprehensive:
    @pytest.mark.asyncio
    async def test_comprehensive_runs_four_debaters(
        self, orchestrator, comprehensive_request, sample_papers
    ):
        with patch("config.get_settings") as gs:
            settings = MagicMock()
            settings.is_demo = False
            gs.return_value = settings

            with patch("database.get_cached_analysis", new=AsyncMock(return_value=None)), \
                 patch.object(orchestrator, "_retrieve_papers", new=AsyncMock(return_value=sample_papers)), \
                 patch("agents.orchestrator.store_papers", new=AsyncMock()), \
                 patch("database.store_query", new=AsyncMock(return_value="qid-2")), \
                 patch("database.store_analysis", new=AsyncMock(return_value=True)), \
                 patch.object(orchestrator.pro1, "argue", new=AsyncMock(return_value=("Pro1", "groq"))), \
                 patch.object(orchestrator.pro2, "argue", new=AsyncMock(return_value=("Pro2", "gemini"))), \
                 patch.object(orchestrator.con1, "argue", new=AsyncMock(return_value=("Con1", "groq"))), \
                 patch.object(orchestrator.con2, "argue", new=AsyncMock(return_value=("Con2", "gemini"))), \
                 patch.object(orchestrator.moderator, "moderate", new=AsyncMock(return_value=("Final", "mock"))), \
                 patch.object(orchestrator.critic, "evaluate", new=AsyncMock(return_value=("### Points of Contention\nX\n### Critical Evaluation\nY\n### Research Gaps & Future Directions\nZ", "mock"))):

                events = []
                async for event in orchestrator.run(comprehensive_request):
                    events.append(event)

        result = next(e for e in events if e["event"] == "result")
        assert "Pro 1" in result["data"]["supporting_arguments"]
        assert "Con 1" in result["data"]["counterarguments"]
        assert "Debate Mode" in result["data"]["research_strategy"]


class TestChatAndRadio:
    @pytest.mark.asyncio
    async def test_chat_uses_moderator(self, orchestrator):
        with patch.object(
            orchestrator.moderator,
            "moderate",
            new=AsyncMock(return_value=("Follow-up answer", "mock")),
        ):
            req = MagicMock()
            req.context = "Context about fasting"
            req.message = "What about women?"
            req.history = []
            answer = await orchestrator.chat(req)
            assert answer == "Follow-up answer"

    @pytest.mark.asyncio
    async def test_debate_script_parses_json(self, orchestrator):
        script_json = '[{"speaker": "Alloy", "text": "Hello"}, {"speaker": "Shimmer", "text": "Hi"}]'
        with patch.object(
            orchestrator.moderator,
            "moderate",
            new=AsyncMock(return_value=(f"```json\n{script_json}\n```", "mock")),
        ):
            script = await orchestrator.generate_debate_script("some context")
            assert len(script) == 2
            assert script[0]["speaker"] == "Alloy"

    @pytest.mark.asyncio
    async def test_debate_script_fallback_on_bad_json(self, orchestrator):
        with patch.object(
            orchestrator.moderator,
            "moderate",
            new=AsyncMock(return_value=("not valid json at all", "mock")),
        ):
            script = await orchestrator.generate_debate_script("ctx")
            assert isinstance(script, list)
            assert len(script) >= 2
            assert "speaker" in script[0]


class TestRetrievalTimeout:
    @pytest.mark.asyncio
    async def test_retrieve_respects_timeout_and_returns_partial(
        self, orchestrator, research_request, sample_papers
    ):
        async def slow_search(*args, **kwargs):
            await asyncio.sleep(10)
            return sample_papers

        async def fast_search(*args, **kwargs):
            return sample_papers[:1]

        with patch("retrieval.embeddings.generate_embedding", new=AsyncMock(return_value=[0.1] * 384)), \
             patch("retrieval.vector_store.search_papers", new=AsyncMock(return_value=[])), \
             patch("agents.orchestrator.search_arxiv", new=fast_search), \
             patch("agents.orchestrator.search_semantic_scholar", new=slow_search), \
             patch("agents.orchestrator.search_pubmed", new=slow_search), \
             patch("agents.orchestrator.search_openalex", new=slow_search), \
             patch("agents.orchestrator.search_core", new=slow_search), \
             patch("agents.orchestrator.search_crossref", new=slow_search), \
             patch("agents.orchestrator.search_duckduckgo", new=AsyncMock(return_value=[])), \
             patch("agents.orchestrator.search_wikipedia", new=slow_search), \
             patch("agents.orchestrator.search_google", new=slow_search):

            papers = await orchestrator._retrieve_papers(research_request, research_request.query)

        # Should complete without hanging and may include fast arxiv result
        assert isinstance(papers, list)
        assert len(papers) <= research_request.max_papers


class TestDeepResearchPipeline:
    @pytest.mark.asyncio
    async def test_deep_research_pipeline_success(self, orchestrator, mock_llm_success, sample_papers):
        from models import ResearchRequest
        req = ResearchRequest(
            query="Will AI replace software engineers?",
            max_papers=5,
            depth="deep",
            research_mode="academic",
        )

        with patch("config.get_settings") as gs:
            settings = MagicMock()
            settings.is_demo = False
            settings.serper_api_key = "fake-key"
            gs.return_value = settings

            with patch("database.get_cached_analysis", new=AsyncMock(return_value=None)), \
                 patch("agents.planner.PlannerAgent.plan", new=AsyncMock(return_value=(["AI replacement", "Software jobs"], "mock"))), \
                 patch("agents.orchestrator.search_arxiv", new=AsyncMock(return_value=sample_papers[:1])), \
                 patch("agents.orchestrator.search_semantic_scholar", new=AsyncMock(return_value=[])), \
                 patch("agents.orchestrator.search_pubmed", new=AsyncMock(return_value=[])), \
                 patch("agents.orchestrator.search_wikipedia", new=AsyncMock(return_value=[])), \
                 patch("agents.orchestrator.search_google", new=AsyncMock(return_value=[])), \
                 patch("agents.orchestrator.search_duckduckgo", new=AsyncMock(return_value=[])), \
                 patch("retrieval.scraper.scrape_url", new=AsyncMock(return_value={
                     "title": "McKinsey report",
                     "source": "McKinsey",
                     "summary": "AI impact details",
                     "evidence": "Coding speed increased",
                     "publication_date": "2023-06-25",
                     "url": "https://mckinsey.com/report"
                 })):
                events = []
                async for event in orchestrator.run(req):
                    events.append(event)

        # Check result
        result = next(e for e in events if e["event"] == "result")
        assert result["data"]["original_query"] == "Will AI replace software engineers?"
        
        # Verify steps yielded
        step_names = [e["data"]["step"] for e in events if e["event"] == "step" and e["data"]["status"] == "done"]
        assert "query_refinement" in step_names
        assert "retrieval" in step_names
        assert "debate" in step_names
        assert "final_insight" in step_names
