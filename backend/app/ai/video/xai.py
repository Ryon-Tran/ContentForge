"""
VIDEO adapter — xAI / Grok (/v1/videos/generations).

Cấu hình cần thiết:
  provider : "xai" | "grok"
  base_url : "https://api.x.ai/v1"
  api_key  : xAI API key
  model    : ví dụ "grok-2-aurora"
"""
import asyncio
import json
import time
import uuid
from typing import Any

from fastapi import HTTPException
from app.ai.base import request_json, download_to_base64
from app.models.schemas import GenerateVideoRequest

POLL_TIMEOUT = 900   # 15 phút
POLL_INTERVAL = 5    # giây


async def generate_video(cfg: dict, data: GenerateVideoRequest) -> dict:
    base_url = cfg["base_url"].rstrip("/")
    duration = max(1, min(int(data.durationSeconds or 8), 15))
    aspect_ratio = "9:16" if data.aspectRatio == "9:16" else "16:9"
    resolution = data.resolution if data.resolution in {"480p", "720p"} else "720p"

    payload: dict[str, Any] = {
        "model": cfg["model"].strip(),
        "prompt": data.prompt,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
    }

    if data.firstFrameBase64:
        mime = data.firstFrameMimeType or "image/png"
        payload["image"] = {
            "url": f"data:{mime};base64,{data.firstFrameBase64}"
        }

    start_result = await request_json(
        "POST",
        f"{base_url}/videos/generations",
        cfg["api_key"],
        json=payload,
    )

    request_id = start_result.get("request_id")
    if not request_id:
        raise HTTPException(
            status_code=502,
            detail=f"xAI Video không trả request_id. {start_result}",
        )

    deadline = time.time() + POLL_TIMEOUT

    while time.time() < deadline:
        await asyncio.sleep(POLL_INTERVAL)

        status = await request_json(
            "GET",
            f"{base_url}/videos/{request_id}",
            cfg["api_key"],
            timeout=120.0,
        )

        state = status.get("status")

        if state == "pending":
            continue

        if state in {"failed", "expired"}:
            raise HTTPException(
                status_code=502,
                detail=f"xAI Video {state}: {json.dumps(status, ensure_ascii=False)[:3000]}",
            )

        if state == "done":
            video_url = (status.get("video") or {}).get("url")
            if not video_url:
                raise HTTPException(
                    status_code=502,
                    detail="xAI Video không trả URL video.",
                )

            b64, mime_type = await download_to_base64(video_url, default_mime="video/mp4")
            return {
                "base64": b64,
                "mimeType": mime_type or "video/mp4",
                "mediaId": str(uuid.uuid4()),
                "sourceImageId": data.firstFrameId,
            }

    raise HTTPException(status_code=504, detail="xAI Video timeout sau 15 phút.")
