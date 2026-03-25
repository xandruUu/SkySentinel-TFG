from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.flights import router as flights_router
from app.db.base import Base
from app.db.database import engine


def create_application() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    application = FastAPI(
        title="SkySentinel API",
        version="1.0.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(auth_router)
    application.include_router(flights_router)

    @application.get("/", tags=["health"])
    def read_root() -> dict[str, str]:
        return {"message": "SkySentinel backend funcionando"}

    return application


app = create_application()