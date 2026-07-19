
"""
ResearchPilot – FastAPI Application Entry Point
"""
import sys
import os

# Add the backend directory to sys.path to allow relative imports on Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
    allow_origins=[
        settings.frontend_url, 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        "http://localhost:5176", 
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Static Files (for generated audio)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(research.router, prefix="/research", tags=["Research"])
app.include_router(papers.router, prefix="/papers", tags=["Papers"])
app.include_router(queries.router, prefix="/queries", tags=["Queries"])
app.include_router(library.router, prefix="/library", tags=["Library"])


@app.get("/", tags=["health"])
@app.head("/", tags=["health"])
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
@app.head("/health", tags=["health"])
async def health():
    return {"status": "ok"}

