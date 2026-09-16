from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db
from app.routers import (
    health,
    auth,
    bookmarks,
    notes,
    annotations,
    flashcards,
    exam,
    interview,
    progress,
    ai,
)

logger = logging.getLogger("anvil")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.warning(
            f"Could not connect to database during startup ({e}). "
            "Server is running; please ensure DATABASE_URL in .env is reachable."
        )
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-density learning assistant backend supporting Reading, Exam, and Interview modes.",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(bookmarks.router)
app.include_router(notes.router)
app.include_router(annotations.router)
app.include_router(flashcards.router)
app.include_router(exam.router)
app.include_router(interview.router)
app.include_router(progress.router)
app.include_router(ai.router)
