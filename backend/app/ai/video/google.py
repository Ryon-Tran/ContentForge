"""
VIDEO adapter — Google Veo (:predictLongRunning).

Cấu hình cần thiết:
  provider : "google" | "gemini"
  base_url : "https://generativelanguage.googleapis.com"  (hoặc để trống)
  api_key  : Google AI Studio API key
  model    : ví dụ "veo-3.0-generate-preview"
"""
import asyncio
import json
import time
import uuid
from typing import Any

from fastapi import HTTPException
from app.ai.base import request_json, download_to_base64, google_api_base_url
from app.models.schemas import GenerateVideoRequest

POLL_TIMEOUT = 900   # 15 phút
POLL_INTERVAL = 10   # giây


async def generate_video(cfg: dict, data: GenerateVideoRequest) -> dict:
    api_base = google_api_base_url(cfg["base_url"])
    model = cfg["model"].strip()
    start_url = f"{api_base}/models/{model}:predictLongRunning"

    instance: dict[str, Any] = {"prompt": data.prompt}

    if data.firstFrameBase64:
        instance["image"] = {
            "bytesBase64Encoded": data.firstFrameBase64,
            "mimeType": data.firstFrameMimeType or "image/png",
        }

    duration = max(5, min(int(data.durationSeconds or 8), 8))
    resolution = data.resolution if data.resolution in {"720p", "1080p"} else "720p"
    aspect_ratio = "9:16" if data.aspectRatio == "9:16" else "16:9"

    parameters = {
        "aspectRatio": aspect_ratio,
        "durationSeconds": duration,
        "resolution": resolution,
        "numberOfVideos": 1,
    }

    start_result = await request_json(
        "POST",
        start_url,
        cfg["api_key"],
        headers={
            "x-goog-api-key": cfg["api_key"],
            "Content-Type": "application/json",
        },
        auth_bearer=False,
        json={"instances": [instance], "parameters": parameters},
    )

    operation_name = start_result.get("name")
    if not operation_name:
        raise HTTPException(
            status_code=502,
            detail=f"Google Veo không trả operation name. {start_result}",
        )

    poll_url = f"{api_base}/{operation_name.lstrip('/')}"
    deadline = time.time() + POLL_TIMEOUT

    while time.time() < deadline:
        await asyncio.sleep(POLL_INTERVAL)

        status = await request_json(
            "GET",
            poll_url,
            cfg["api_key"],
            headers={"x-goog-api-key": cfg["api_key"]},
            auth_bearer=False,
            timeout=120.0,
        )

        if not status.get("done"):
            continue

        if status.get("error"):
            raise HTTPException(
                status_code=502,
                detail=f"Google Veo generation lỗi: {json.dumps(status['error'], ensure_ascii=False)}",
            )

        generated = (
            status.get("response", {})
            .get("generateVideoResponse", {})
            .get("generatedSamples", [])
        )

        if not generated:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Google Veo hoàn tất nhưng không tìm thấy generatedSamples. "
                    f"{json.dumps(status, ensure_ascii=False)[:3000]}"
                ),
            )

        video_info = generated[0].get("video", {})
        inline_data = video_info.get("inlineData") or video_info.get("inline_data")

        if isinstance(inline_data, dict) and inline_data.get("data"):
            return {
                "base64": inline_data["data"],
                "mimeType": inline_data.get("mimeType") or inline_data.get("mime_type") or "video/mp4",
                "mediaId": str(uuid.uuid4()),
                "sourceImageId": data.firstFrameId,
            }

        video_uri = video_info.get("uri")
        if not video_uri:
            raise HTTPException(status_code=502, detail="Google Veo không trả video URI.")

        b64, mime_type = await download_to_base64(
            video_uri,
            headers={"x-goog-api-key": cfg["api_key"]},
            default_mime="video/mp4",
        )
        return {
            "base64": b64,
            "mimeType": mime_type or "video/mp4",
            "mediaId": str(uuid.uuid4()),
            "sourceImageId": data.firstFrameId,
        }

    raise HTTPException(status_code=504, detail="Google Veo timeout sau 15 phút.")
