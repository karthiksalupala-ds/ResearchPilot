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
    if not papers:
        return

    import json
    import asyncio
    client = database.get_supabase()
    existing_embeddings = {}

    # Check in-memory store first
    for p, emb in _in_memory_store:
        existing_embeddings[p.title.lower().strip()] = emb

    # Check DB for missing ones
    missing_titles = [p.title for p in papers if p.title.lower().strip() not in existing_embeddings]

    if missing_titles and client:
        try:
            # Query Supabase in batches of 50
            for i in range(0, len(missing_titles), 50):
                batch = missing_titles[i:i+50]
                db_res = client.table("research_papers").select("title, embedding").in_("title", batch).execute()
                for row in (db_res.data or []):
                    title_key = row["title"].lower().strip()
                    emb = row["embedding"]
                    if isinstance(emb, str):
                        emb = json.loads(emb)
                    existing_embeddings[title_key] = emb
        except Exception as e:
            print(f"[VectorStore] Error checking existing papers in DB: {e}")

    # Now split papers into to_embed and cached
    to_embed_papers = []
    to_embed_texts = []

    for p in papers:
        title_key = p.title.lower().strip()
        if title_key not in existing_embeddings:
            to_embed_papers.append(p)
            to_embed_texts.append(f"{p.title}. {p.abstract}")

    # Embed only the missing ones
    new_embeddings = []
    if to_embed_papers:
        from retrieval.embeddings import generate_embeddings_batch
        try:
            new_embeddings = await generate_embeddings_batch(to_embed_texts)
        except Exception as e:
            print(f"[VectorStore] Batch embedding error: {e}")
            for t in to_embed_texts:
                try:
                    new_embeddings.append(await generate_embedding(t))
                except Exception:
                    new_embeddings.append([0.0] * 384)

    # Associate new embeddings
    for paper, emb in zip(to_embed_papers, new_embeddings):
        existing_embeddings[paper.title.lower().strip()] = emb

    # Upsert new papers concurrently and populate in-memory fallback
    tasks = []
    for paper in papers:
        title_key = paper.title.lower().strip()
        emb = existing_embeddings.get(title_key)
        if emb:
            _in_memory_store.append((paper, emb))
            if paper in to_embed_papers:
                tasks.append(database.store_paper(paper, emb))

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


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
