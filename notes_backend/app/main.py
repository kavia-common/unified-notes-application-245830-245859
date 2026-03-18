from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

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

    # CORS: Required for browser-based frontend->backend calls.
    # If CORS_ORIGINS isn't configured, default to "*" so the app works out-of-the-box
    # in typical dev/preview setups.
    allow_origins = settings.cors_origins or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=False if allow_origins == ["*"] else True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Return a consistent error shape for the frontend.

        Frontend expects JSON errors like: { "message": "..." }.
        FastAPI's default is: { "detail": "..." }.
        """
        detail = exc.detail
        message = detail if isinstance(detail, str) else "Request failed"
        return JSONResponse(status_code=exc.status_code, content={"message": message, "details": detail})

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
