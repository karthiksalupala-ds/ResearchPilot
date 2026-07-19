import httpx
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
    
    # Try Hugging Face Inference API first (super fast, no model download)
    try:
        return await _huggingface_api_embedding(text)
    except Exception as e:
        print(f"[Embeddings] HF Inference API failed: {e}. Falling back to local SentenceTransformer...")
        return _huggingface_local_embedding(text)


async def _huggingface_api_embedding(text: str) -> List[float]:
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {}
    if settings.huggingface_api_token:
        headers["Authorization"] = f"Bearer {settings.huggingface_api_token}"
    
    payload = {"inputs": [text]}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
    data = resp.json()
    
    # Extract the embedding list
    if isinstance(data, list) and len(data) > 0:
        if isinstance(data[0], list):
            return data[0]
        return data
    raise ValueError("Unexpected response format from HF Inference API")


def _huggingface_local_embedding(text: str) -> List[float]:
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
    
    # Try HF API in batch
    try:
        url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        headers = {}
        if settings.huggingface_api_token:
            headers["Authorization"] = f"Bearer {settings.huggingface_api_token}"
        
        payload = {"inputs": texts}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            return data
    except Exception as e:
        print(f"[Embeddings] HF Batch Inference API failed: {e}. Falling back to local SentenceTransformer...")
    
    model = _get_hf_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]

