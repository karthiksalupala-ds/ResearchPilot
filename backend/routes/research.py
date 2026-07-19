"""
Research API routes – SSE streaming research analysis pipeline.
"""
import json
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
    except Exception as e:
        error_payload = json.dumps({"event": "error", "data": {"message": str(e)}})
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

@router.get("/history")
async def get_history(user_id: str, limit: int = 20):
    """Fetch saved research history for a user."""
    import database
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    queries = await database.get_queries(limit=limit, user_id=user_id)
    
    # Optional: fetch analysis for these queries if needed, 
    # but returning the queries is a good start.
    return {"queries": queries}

@router.post("/chat")
async def research_chat(request: ChatRequest):
    """Answer follow-up questions about research results."""
    try:
        response = await orchestrator.chat(request)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/radio/start")
async def start_radio(request: dict):
    """Generate a podcast script and return the first few audio-enabled turns."""
    try:
        context = request.get("context", "")
        script = await orchestrator.generate_debate_script(context)
        
        # Hydrate script with audio URLs (for the first 3 turns as a start)
        for turn in script[:3]:
            voice = "lead" if turn["speaker"] == "Alloy" else "support"
            turn["audio_url"] = await audio_service.generate_tts(turn["text"], voice)
            
        return {"script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/radio/interact")
async def interact_radio(request: dict):
    """Interrupt the radio with a question and get a response."""
    # Logic similar to chat but specifically for the radio context
    try:
        user_msg = request.get("message", "")
        context = request.get("context", "")
        # Get response from moderator
        response = await orchestrator.chat(type('obj', (object,), {'context': context, 'message': user_msg, 'history': []}))
        
        # Generate audio for the response
        audio_url = await audio_service.generate_tts(response, "lead")
        return {"response": response, "audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
