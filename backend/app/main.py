import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db, DB_PATH
from app.services.worker import worker_loop
from app.api.config_api import router as config_router, get_ai_config
from app.api.jobs_api import router as jobs_router
from app.api.batch_api import router as batch_router
from app.api.activity_api import router as activity_router
from app.api.storage_api import router as storage_router
from app.api.files_api import router as files_router
from app.api.tts_api import router as tts_router

from app.models.schemas import GenerateTextRequest, GenerateImageRequest, GenerateVideoRequest
from app.ai.text import router as text_router
from app.ai.image import router as image_router
from app.ai.video import router as video_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print(f"[SQLite DB] {DB_PATH}")
    worker_task = asyncio.create_task(worker_loop())
    yield
    worker_task.cancel()


app = FastAPI(
    title="Tools-MMO Local API",
    version="2.5.0",
    description="Enterprise Multi-Modal AI Production & Automation Suite",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers
app.include_router(config_router)
app.include_router(jobs_router)
app.include_router(batch_router)
app.include_router(activity_router)
app.include_router(storage_router)
app.include_router(files_router)
app.include_router(tts_router)


# =========================================================
# AI CORE GENERATION ENDPOINTS
# =========================================================

def _cfg_with_extra(cfg: dict) -> dict:
    import json
    raw = cfg.get("extra_config") or "{}"
    try:
        extra = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        extra = {}
    return {**cfg, "extra_config": extra}


@app.get("/")
async def root():
    return {"status": "ok", "app": "Tools-MMO Local API", "version": "2.5.0"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "database": os.path.basename(DB_PATH),
        "version": "2.5.0",
    }


@app.post("/api/ai/generate-text")
async def generate_text(data: GenerateTextRequest):
    cfg = await asyncio.to_thread(get_ai_config, "TEXT", data.model)
    cfg = _cfg_with_extra(cfg)
    text = await text_router.generate_text(cfg, data.prompt)
    return {"text": text}


@app.post("/api/ai/generate-image")
async def generate_image(data: GenerateImageRequest):
    cfg = await asyncio.to_thread(get_ai_config, "IMAGE", data.model)
    cfg = _cfg_with_extra(cfg)
    return await image_router.generate_image(cfg, data)


@app.post("/api/ai/generate-video")
async def generate_video(data: GenerateVideoRequest):
    cfg = await asyncio.to_thread(get_ai_config, "VIDEO", data.model)
    cfg = _cfg_with_extra(cfg)
    return await video_router.generate_video(cfg, data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
