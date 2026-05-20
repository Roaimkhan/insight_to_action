"""
main.py
-------
Core FastAPI gateway application entrypoint.
Registers routing systems, initiates CORS middlewares, and sets up uvicorn servers.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.agent import router as agent_router
from routers.ingest import router as ingest_router

app = FastAPI(
    title="Grid Sentinel - Content-To-Action Orchestration API",
    description="FastAPI WebSocket operational stream orchestrator for autonomous agent monitoring.",
    version="1.0.0"
)

# CORS configuration allowing cross-origin requests for mobile developers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(agent_router)
app.include_router(ingest_router)

@app.get("/")
async def root():
    """Core portal verification index."""
    return {
        "gateway": "Grid Sentinel API Core Gateway",
        "status": "online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
