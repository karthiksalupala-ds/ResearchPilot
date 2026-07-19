"""
Vector store – stores paper embeddings in Supabase pgvector
and performs similarity search. Falls back to in-memory search if Supabase is unavailable.
"""
from typing import List, Tuple, Optional
import numpy as np
from models import ResearchPaper
from retrieval.embeddings import generate_embedding
import database

# In-memory fallback store
_in_memory_store: List[Tuple[ResearchPaper, List[float]]] = []


async def store_papers(papers: List[ResearchPaper]) -> None:
    """Embed and store papers in Supabase (or in-memory fallback)."""
    texts = [f"{p.title}. {p.abstract}" for p in papers]
    embeddings = []
    from retrieval.embeddings import generate_embeddings_batch
    try:
        embeddings = await generate_embeddings_batch(texts)
    except Exception as e:
        print(f"[VectorStore] Batch embedding error: {e}")
        for t in texts:
            embeddings.append(await generate_embedding(t))

    for paper, emb in zip(papers, embeddings):
        await database.store_paper(paper, emb)
        _in_memory_store.append((paper, emb))


async def search_papers(query: str, limit: int = 10, query_embedding: Optional[List[float]] = None) -> List[ResearchPaper]:
    """Retrieve most relevant papers for a query using cosine similarity."""
    if query_embedding is None:
        query_embedding = await generate_embedding(query)

    # Try Supabase first
    results = await database.similarity_search(query_embedding, limit=limit)
    if results:
        return results

    # Fallback: in-memory cosine similarity
    return _memory_search(query_embedding, limit)


def _memory_search(query_emb: List[float], limit: int) -> List[ResearchPaper]:
    if not _in_memory_store:
        return []
    q = np.array(query_emb)
    scored = []
    for paper, emb in _in_memory_store:
        v = np.array(emb)
        sim = float(np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v) + 1e-9))
        scored.append((sim, paper))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [paper for _, paper in scored[:limit]]
