import httpx
from typing import List
from config import get_settings

settings = get_settings()


async def generate_embedding(text: str) -> List[float]:
    """Generate a vector embedding for the given text."""
    provider = settings.embedding_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        return await _openai_embedding(text)
    
    # Use Hugging Face Inference API directly (API-based, zero dependencies)
    return await _huggingface_api_embedding(text)


async def _huggingface_api_embedding(text: str) -> List[float]:
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {}
    if settings.huggingface_api_token:
        headers["Authorization"] = f"Bearer {settings.huggingface_api_token}"
    
    payload = {"inputs": [text]}
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
    data = resp.json()
    
    # Extract the embedding list
    if isinstance(data, list) and len(data) > 0:
        if isinstance(data[0], list):
            return data[0]
        return data
    raise ValueError("Unexpected response format from HF Inference API")


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
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {}
    if settings.huggingface_api_token:
        headers["Authorization"] = f"Bearer {settings.huggingface_api_token}"
    
    payload = {"inputs": texts}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
    data = resp.json()
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
        return data
        
    raise ValueError("Failed to retrieve batch embeddings from HF Inference API")
