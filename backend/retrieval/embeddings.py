import httpx
import asyncio
import random
from typing import List
from config import get_settings

settings = get_settings()


async def generate_embedding(text: str) -> List[float]:
    """Generate a vector embedding for the given text."""
    provider = settings.embedding_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        try:
            return await _openai_embedding(text)
        except Exception as e:
            print(f"[Embeddings] OpenAI embedding error: {e}. Trying fallback...")

    # Default to Hugging Face
    try:
        return await _huggingface_api_embedding(text)
    except Exception as hf_err:
        print(f"[Embeddings] Hugging Face embedding error: {hf_err}.")
        
        # Fallback to Gemini if key exists
        if settings.google_api_key:
            print("[Embeddings] Attempting Gemini fallback...")
            try:
                return await _gemini_api_embedding(text)
            except Exception as gem_err:
                print(f"[Embeddings] Gemini fallback failed: {gem_err}")

        # Final resilient mock fallback (so system doesn't crash offline)
        print("[Embeddings] Warning: All embedding APIs failed. Generating mock embedding vector.")
        return [random.uniform(-0.1, 0.1) for _ in range(384)]


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
    
    if isinstance(data, list) and len(data) > 0:
        if isinstance(data[0], list):
            return data[0]
        return data
    raise ValueError("Unexpected response format from HF Inference API")


async def _gemini_api_embedding(text: str) -> List[float]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.google_api_key}"
    payload = {
        "content": {
            "parts": [{"text": text[:8000]}]
        }
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
    data = resp.json()
    if "embedding" in data and "values" in data["embedding"]:
        return data["embedding"]["values"]
    raise ValueError("Unexpected response format from Gemini Embedding API")


async def _openai_embedding(text: str) -> List[float]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text[:8000],
    )
    return response.data[0].embedding


async def _openai_embeddings_batch(texts: List[str]) -> List[List[float]]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=[t[:8000] for t in texts],
    )
    return [e.embedding for e in response.data]


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts efficiently."""
    provider = settings.embedding_provider.lower()
    if provider == "openai" and settings.openai_api_key:
        try:
            return await _openai_embeddings_batch(texts)
        except Exception as e:
            print(f"[Embeddings] Batch OpenAI embedding error: {e}. Trying fallback...")
    
    # Try Hugging Face
    try:
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
    except Exception as hf_err:
        print(f"[Embeddings] Batch Hugging Face embedding error: {hf_err}.")
        
        # Batch Gemini fallback
        if settings.google_api_key:
            print("[Embeddings] Attempting batch Gemini fallback...")
            try:
                return await asyncio.gather(*[_gemini_api_embedding(t) for t in texts])
            except Exception as gem_err:
                print(f"[Embeddings] Batch Gemini fallback failed: {gem_err}")

    # Fallback to single generation loop (which handles mock gracefully)
    return [await generate_embedding(t) for t in texts]
