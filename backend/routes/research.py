"""
Research API routes – SSE streaming research analysis pipeline.
"""
import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models import ResearchRequest, ChatRequest
from agents.orchestrator import ResearchOrchestrator
from services.audio_service import audio_service

router = APIRouter()
orchestrator = ResearchOrchestrator()


async def _sse_generator(request: ResearchRequest):
    """Async generator that wraps the orchestrator pipeline as SSE events."""
    try:
        async for event in orchestrator.run(request):
            payload = json.dumps(event, default=str)
            yield f"data: {payload}\n\n"
    except Exception:
        # Never stream stack traces to the client
        error_payload = json.dumps({
            "event": "error",
            "data": {"message": "Research hit an unexpected issue. Please try again."},
        })
        yield f"data: {error_payload}\n\n"
    finally:
        yield "data: {\"event\": \"done\", \"data\": {}}\n\n"


@router.post("/analyze")
async def analyze_research(request: ResearchRequest):
    """
    Stream a full research analysis pipeline via Server-Sent Events.
    Events: step | result | error | done
    """
    if len(request.query.strip()) < 5:
        raise HTTPException(status_code=422, detail="Query too short. Please be more specific.")

    return StreamingResponse(
        _sse_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

from fastapi import Depends
from services.auth import get_current_user

@router.get("/history")
async def get_history(limit: int = 20, current_user = Depends(get_current_user)):
    """Fetch saved research history for a user verified by Supabase JWT."""
    import database
    
    queries = await database.get_queries(limit=limit, user_id=current_user.id)
    return {"queries": queries}


@router.post("/chat")
async def research_chat(request: ChatRequest):
    """Answer follow-up questions about research results."""
    try:
        response = await orchestrator.chat(request)
        return {"response": response}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Chat is temporarily unavailable. Please try again.",
        )

@router.post("/radio/start")
async def start_radio(request: dict):
    """Generate a podcast script and return the first few audio-enabled turns."""
    try:
        context = request.get("context", "")
        
        import time
        t0 = time.perf_counter()
        script = await orchestrator.generate_debate_script(context)
        
        # Hydrate script with audio URLs (for the first 3 turns as a start) concurrently
        async def hydrate_turn(turn):
            voice = "lead" if turn["speaker"] == "Alloy" else "support"
            try:
                turn["audio_url"] = await audio_service.generate_tts(turn["text"], voice)
            except Exception:
                turn["audio_url"] = None

        await asyncio.gather(*[hydrate_turn(turn) for turn in script[:3]])
        
        elapsed = time.perf_counter() - t0
        if elapsed < 1:
            print(f"[PERF] Podcast generation: {elapsed * 1000:.0f}ms")
        else:
            print(f"[PERF] Podcast generation: {elapsed:.1f}s")
            
        return {"script": script}
    except Exception:
        # Always return a playable fallback script for demo reliability
        return {
            "script": [
                {"speaker": "Alloy", "text": "Let's walk through the key findings from this research.", "audio_url": None},
                {"speaker": "Shimmer", "text": "I'm ready — start with the strongest evidence.", "audio_url": None},
            ]
        }

@router.post("/radio/interact")
async def interact_radio(request: dict):
    """Interrupt the radio with a question and get a response."""
    try:
        user_msg = request.get("message", "")
        context = request.get("context", "")
        response = await orchestrator.chat(type('obj', (object,), {'context': context, 'message': user_msg, 'history': []}))
        try:
            audio_url = await audio_service.generate_tts(response, "lead")
        except Exception:
            audio_url = None
        return {"response": response, "audio_url": audio_url}
    except Exception:
        return {
            "response": "I couldn't process that interruption just now. Please try again.",
            "audio_url": None,
        }
