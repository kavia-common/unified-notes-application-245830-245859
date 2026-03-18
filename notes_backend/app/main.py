from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, notes, tags

openapi_tags = [
    {"name": "health", "description": "Service health endpoints."},
    {"name": "auth", "description": "Authentication endpoints (bearer token)."},
    {"name": "notes", "description": "Notes CRUD + search/filter endpoints."},
    {"name": "tags", "description": "Tag listing endpoints."},
]


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Retro Notes Backend API",
        description="REST API for Retro Notes (auth, notes, tags, search).",
        version="1.0.0",
        openapi_tags=openapi_tags,
    )

    # CORS: for local dev and deployed frontend
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/health", tags=["health"], summary="Healthcheck")
    def health() -> dict:
        """Simple health check endpoint.

        Returns:
            dict: status payload.
        """
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(notes.router)
    app.include_router(tags.router)
    return app


app = create_app()
