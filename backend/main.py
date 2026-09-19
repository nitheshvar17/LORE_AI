from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.db.database import init_db, SessionLocal
from backend.db.seed import seed_database
from backend.api import (
    stats, decisions, issues, promises, merge_requests,
    onboarding, ask, webhooks, simulator, seed_router
)

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Institutional Memory System for GitLab"
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(stats.router, prefix=settings.API_V1_PREFIX)
app.include_router(decisions.router, prefix=settings.API_V1_PREFIX)
app.include_router(issues.router, prefix=settings.API_V1_PREFIX)
app.include_router(promises.router, prefix=settings.API_V1_PREFIX)
app.include_router(merge_requests.router, prefix=settings.API_V1_PREFIX)
app.include_router(onboarding.router, prefix=settings.API_V1_PREFIX)
app.include_router(ask.router, prefix=settings.API_V1_PREFIX)
app.include_router(webhooks.router, prefix=settings.API_V1_PREFIX)
app.include_router(simulator.router, prefix=settings.API_V1_PREFIX)
app.include_router(seed_router.router, prefix=settings.API_V1_PREFIX)

@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "LORE Backend",
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "database": "sqlite/postgresql"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
