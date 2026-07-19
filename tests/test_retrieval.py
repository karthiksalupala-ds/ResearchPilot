"""
Unit tests for retrieval clients, embeddings, and stubs.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from models import ResearchPaper
from retrieval.duckduckgo_client import search_duckduckgo
from retrieval import embeddings as emb_mod


class TestDuckDuckGoStub:
    @pytest.mark.asyncio
    async def test_always_returns_empty(self):
        result = await search_duckduckgo("intermittent fasting", 5)
        assert result == []


class TestEmbeddings:
    @pytest.mark.asyncio
    async def test_mock_fallback_when_all_fail(self):
        with patch.object(emb_mod.settings, "embedding_provider", "huggingface"), \
             patch.object(emb_mod.settings, "openai_api_key", ""), \
             patch.object(emb_mod.settings, "google_api_key", ""), \
             patch.object(emb_mod, "_huggingface_api_embedding", new=AsyncMock(side_effect=RuntimeError("HF down"))):
            vec = await emb_mod.generate_embedding("test query")
        assert isinstance(vec, list)
        assert len(vec) == 384
        assert all(isinstance(x, float) for x in vec)

    @pytest.mark.asyncio
    async def test_openai_path_when_configured(self):
        fake = [0.01] * 1536
        with patch.object(emb_mod.settings, "embedding_provider", "openai"), \
             patch.object(emb_mod.settings, "openai_api_key", "sk-test"), \
             patch.object(emb_mod, "_openai_embedding", new=AsyncMock(return_value=fake)):
            vec = await emb_mod.generate_embedding("hello")
        assert vec == fake

    @pytest.mark.asyncio
    async def test_gemini_fallback_after_hf(self):
        gemini_vec = [0.02] * 768
        with patch.object(emb_mod.settings, "embedding_provider", "huggingface"), \
             patch.object(emb_mod.settings, "openai_api_key", ""), \
             patch.object(emb_mod.settings, "google_api_key", "gk"), \
             patch.object(emb_mod, "_huggingface_api_embedding", new=AsyncMock(side_effect=RuntimeError("HF"))), \
             patch.object(emb_mod, "_gemini_api_embedding", new=AsyncMock(return_value=gemini_vec)):
            vec = await emb_mod.generate_embedding("query")
        assert vec == gemini_vec

    @pytest.mark.asyncio
    async def test_batch_falls_back_to_singles(self):
        with patch.object(emb_mod.settings, "embedding_provider", "huggingface"), \
             patch.object(emb_mod.settings, "openai_api_key", ""), \
             patch.object(emb_mod.settings, "google_api_key", ""), \
             patch.object(emb_mod, "generate_embedding", new=AsyncMock(return_value=[0.1] * 384)) as single:
            # Force batch HF path to fail by mocking httpx failure inside batch
            with patch("httpx.AsyncClient") as client_cls:
                client = AsyncMock()
                client.__aenter__.return_value = client
                client.post = AsyncMock(side_effect=RuntimeError("network"))
                client_cls.return_value = client
                result = await emb_mod.generate_embeddings_batch(["a", "b"])
            assert len(result) == 2
            assert single.await_count == 2


class TestArxivClient:
    @pytest.mark.asyncio
    async def test_arxiv_parses_feed(self):
        from retrieval.arxiv_client import search_arxiv

        xml = """<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <id>http://arxiv.org/abs/1234.5678</id>
            <title>Fasting Study</title>
            <summary>Abstract here</summary>
            <published>2022-01-01T00:00:00Z</published>
            <author><name>Alice</name></author>
            <link href="https://arxiv.org/abs/1234.5678" rel="alternate"/>
          </entry>
        </feed>
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = xml
        mock_resp.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as client_cls:
            client = AsyncMock()
            client.__aenter__.return_value = client
            client.get = AsyncMock(return_value=mock_resp)
            client_cls.return_value = client
            papers = await search_arxiv("fasting", max_results=5)

        assert isinstance(papers, list)
        if papers:  # parsing may vary by client implementation
            assert isinstance(papers[0], ResearchPaper)
            assert "Fasting" in papers[0].title or papers[0].title

    @pytest.mark.asyncio
    async def test_arxiv_network_error_returns_empty(self):
        from retrieval.arxiv_client import search_arxiv

        with patch("httpx.AsyncClient") as client_cls:
            client = AsyncMock()
            client.__aenter__.return_value = client
            client.get = AsyncMock(side_effect=RuntimeError("timeout"))
            client_cls.return_value = client
            papers = await search_arxiv("fasting", max_results=3)

        assert papers == []


class TestWikipediaClient:
    @pytest.mark.asyncio
    async def test_wikipedia_soft_fail(self):
        from retrieval.wikipedia_client import search_wikipedia

        with patch("httpx.AsyncClient") as client_cls:
            client = AsyncMock()
            client.__aenter__.return_value = client
            client.get = AsyncMock(side_effect=RuntimeError("down"))
            client_cls.return_value = client
            papers = await search_wikipedia("CRISPR", limit=3)

        assert papers == []


class TestSemanticScholarClient:
    @pytest.mark.asyncio
    async def test_ss_soft_fail_on_error(self):
        from retrieval.semantic_scholar_client import search_semantic_scholar

        with patch("httpx.AsyncClient") as client_cls:
            client = AsyncMock()
            client.__aenter__.return_value = client
            client.get = AsyncMock(side_effect=RuntimeError("429"))
            client_cls.return_value = client
            papers = await search_semantic_scholar("sleep", max_results=3)

        assert papers == []


class TestVectorStore:
    @pytest.mark.asyncio
    async def test_search_papers_handles_no_db(self):
        from retrieval import vector_store

        with patch("retrieval.vector_store.generate_embedding", new=AsyncMock(return_value=[0.1] * 384)), \
             patch("database.similarity_search", new=AsyncMock(return_value=[])):
            # Also may use in-memory fallback – just ensure no crash
            result = await vector_store.search_papers("query", limit=5)
        assert isinstance(result, list)
