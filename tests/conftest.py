"""
Shared pytest fixtures for ResearchPilot backend tests.
Forces demo mode and isolates settings so live API keys are never required.
"""
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend package imports resolve
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Force demo / empty keys before config is cached
os.environ["DEMO_MODE"] = "true"
os.environ.setdefault("GROQ_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("GOOGLE_API_KEY", "")
os.environ.setdefault("OPENROUTER_API_KEY", "")
os.environ.setdefault("SUPABASE_URL", "")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "")


@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Reset lru_cache on get_settings between tests."""
    from config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def sample_papers():
    from models import ResearchPaper
    return [
        ResearchPaper(
            id="p1",
            title="Intermittent Fasting and Metabolic Health",
            abstract="A review of IF effects on metabolism.",
            content="Full text excerpt...",
            source="arxiv",
            url="https://arxiv.org/abs/0000.00001",
            authors=["Alice", "Bob"],
            year=2022,
            citations=120,
        ),
        ResearchPaper(
            id="p2",
            title="Time-Restricted Eating RCT",
            abstract="Randomized trial of TRE in adults.",
            content="",
            source="pubmed",
            url="https://pubmed.ncbi.nlm.nih.gov/000",
            authors=["Carol"],
            year=2023,
            citations=45,
        ),
        ResearchPaper(
            id="p3",
            title="Risks of Prolonged Fasting",
            abstract="Adverse effects discussion.",
            content="",
            source="semantic_scholar",
            url="https://example.com/paper",
            authors=["Dan"],
            year=2021,
            citations=30,
        ),
    ]


@pytest.fixture
def research_request():
    from models import ResearchRequest
    return ResearchRequest(
        query="Does intermittent fasting improve metabolic health?",
        max_papers=10,
        sources=["arxiv", "semantic_scholar", "pubmed"],
        research_mode="academic",
        depth="standard",
    )


@pytest.fixture
def comprehensive_request():
    from models import ResearchRequest
    return ResearchRequest(
        query="Does intermittent fasting improve metabolic health?",
        max_papers=10,
        depth="comprehensive",
        research_mode="academic",
    )


@pytest.fixture
def client():
    """FastAPI TestClient with demo mode enabled."""
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_supabase_none():
    """Force get_supabase() to return None (no DB)."""
    with patch("database.get_supabase", return_value=None):
        yield


@pytest.fixture
def mock_llm_success():
    """Stub BaseAgent._call_llm to avoid network."""
    async def _fake(self, user_message, max_tokens=2048):
        return f"Stubbed response for: {user_message[:80]}", "mock"

    with patch("agents.base_agent.BaseAgent._call_llm", new=_fake):
        yield
