"""
VIDEO router — điều phối đến adapter đúng theo provider.

Provider mapping:
  google / gemini  → google.py  (Veo :predictLongRunning)
  xai / grok       → xai.py     (Grok /videos/generations)
"""
from fastapi import HTTPException
from app.ai.video import google, xai
from app.models.schemas import GenerateVideoRequest


async def generate_video(cfg: dict, data: GenerateVideoRequest) -> dict:
    provider = (cfg.get("provider") or "").strip().lower()

    if provider in {"google", "gemini"}:
        return await google.generate_video(cfg, data)

    if provider in {"xai", "grok"}:
        return await xai.generate_video(cfg, data)

    raise HTTPException(
        status_code=400,
        detail=(
            f"VIDEO provider '{cfg.get('provider')}' chưa có adapter. "
            "Hiện backend hỗ trợ Google/Veo và xAI/Grok."
        ),
    )
