"""
ResearchPilot – FastAPI Application Entry Point
"""
<<<<<<< HEAD
import os
=======
>>>>>>> 03eb864c4c23455f7be527dddc9067537236dbf7
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_settings

# Initialize settings/env vars before any other imports that might depend on them
settings = get_settings()

from routes import research, papers, queries, library

app = FastAPI(
    title="ResearchPilot API",
    description="Agentic AI-Powered Research Intelligence Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files (for generated audio)
<<<<<<< HEAD
os.makedirs("static", exist_ok=True)
=======
>>>>>>> 03eb864c4c23455f7be527dddc9067537236dbf7
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(research.router, prefix="/research", tags=["Research"])
app.include_router(papers.router, prefix="/papers", tags=["Papers"])
app.include_router(queries.router, prefix="/queries", tags=["Queries"])
app.include_router(library.router, prefix="/library", tags=["Library"])


@app.get("/", tags=["health"])
async def root():
    return {
        "service": "ResearchPilot API",
        "version": "1.0.0",
        "status": "operational",
        "demo_mode": settings.is_demo,
        "llm_provider": settings.llm_provider,
        "embedding_provider": settings.embedding_provider,
    }


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
