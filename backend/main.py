"""
AetherDx AI Backend — FastAPI Application
Pre-Symptomatic Health Intelligence Platform
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv()

from services.ml_pipeline import ml_pipeline
from routes.predict import router as predict_router
from routes.assess import router as assess_router
from routes.orchestrate import router as orchestrate_router
from routes.abha_routes import router as abha_router
from routes.auth_routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML models on startup."""
    print("\n" + "="*60)
    print("  🧬 AetherDx AI Backend Starting...")
    print("  Pre-Symptomatic Health Intelligence Platform")
    print("="*60 + "\n")
    
    # Train/load ML models
    ml_pipeline.initialize()
    
    print("\n" + "="*60)
    print("  ✨ AetherDx AI Engine v2.0 — Ready")
    print("  🔗 ABHA (ABDM) Integration Active")
    print("="*60 + "\n")
    
    yield
    
    print("🛑 AetherDx AI Backend shutting down...")


app = FastAPI(
    title="AetherDx AI",
    description="Pre-Symptomatic Health Intelligence Platform — Predict Before You Feel",
    version="1.0.0",
    lifespan=lifespan
)

# CORS config for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(predict_router, prefix="/api")
app.include_router(assess_router, prefix="/api")
app.include_router(orchestrate_router, prefix="/api/orchestrator")
app.include_router(abha_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

from fastapi.exceptions import RequestValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse

def _make_serializable(obj):
    """Recursively convert non-serializable objects to strings."""
    if isinstance(obj, dict):
        return {k: _make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_make_serializable(item) for item in obj]
    if isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    return str(obj)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print(f"Validation Error for {request.url}:")
    print(f"Body: {body.decode('utf-8')}")
    print(f"Errors: {exc.errors()}")
    safe_errors = _make_serializable(exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors, "body": body.decode('utf-8')}
    )


@app.get("/")
async def root():
    return {
        "name": "AetherDx AI",
        "version": "2.0.0",
        "tagline": "Predict. Prevent. Personalize Healthcare.",
        "status": "operational",
        "abha_integration": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
