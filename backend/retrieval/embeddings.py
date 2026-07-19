"""
Embedding generation – supports HuggingFace (free) and OpenAI.
"""
from functools import lru_cache
from typing import List
from config import get_settings

settings = get_settings()

_hf_model = None


def _get_hf_model():
    global _hf_model
    if _hf_model is None:
        from sentence_transformers import SentenceTransformer
        _hf_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _hf_model


async def generate_embedding(text: str) -> List[float]:
    """Generate a vector embedding for the given text."""
    provider = settings.embedding_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        return await _openai_embedding(text)
    else:
        return _huggingface_embedding(text)


def _huggingface_embedding(text: str) -> List[float]:
    model = _get_hf_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


async def _openai_embedding(text: str) -> List[float]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000],
    )
    return response.data[0].embedding


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts efficiently."""
    provider = settings.embedding_provider.lower()
    if provider == "openai" and settings.openai_api_key:
        return [await _openai_embedding(t) for t in texts]
    model = _get_hf_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]
