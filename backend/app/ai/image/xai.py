"""
IMAGE adapter — xAI / Grok (/v1/images/generations).

Cấu hình cần thiết:
  provider : "xai" | "grok"
  base_url : "https://api.x.ai/v1"
  api_key  : xAI API key
  model    : ví dụ "aurora"
"""
import uuid

from fastapi import HTTPException
from app.ai.base import request_json, download_to_base64
from app.models.schemas import GenerateImageRequest


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    base_url = cfg["base_url"].rstrip("/")

    result = await request_json(
        "POST",
        f"{base_url}/images/generations",
        cfg["api_key"],
        json={
            "model": cfg["model"].strip(),
            "prompt": data.prompt,
            "n": 1,
        },
    )

    try:
        item = result["data"][0]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"xAI Image response lỗi: {exc}",
        )

    b64 = item.get("b64_json") or item.get("base64")
    if b64:
        return {"base64": b64, "mimeType": "image/png", "mediaId": str(uuid.uuid4())}

    image_url = item.get("url")
    if not image_url:
        raise HTTPException(
            status_code=502,
            detail="xAI Image không trả base64 hoặc URL.",
        )

    b64, mime_type = await download_to_base64(image_url, default_mime="image/png")
    return {"base64": b64, "mimeType": mime_type, "mediaId": str(uuid.uuid4())}
