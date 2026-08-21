"""
IMAGE adapter — OpenAI DALL-E (/v1/images/generations).

Cấu hình cần thiết:
  provider : "openai" | "chatgpt"
  base_url : "https://api.openai.com/v1"
  api_key  : OpenAI API key
  model    : ví dụ "dall-e-3", "gpt-image-1"
"""
import uuid

from fastapi import HTTPException
from app.ai.base import request_json, download_to_base64, normalize_aspect_ratio
from app.models.schemas import GenerateImageRequest


def _ratio_to_size(ratio: str) -> str:
    """Chuyển aspect ratio sang kích thước DALL-E."""
    if ratio == "1:1":
        return "1024x1024"
    if ratio in {"16:9", "3:2", "4:3", "5:4"}:
        return "1792x1024"
    return "1024x1792"


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    base_url = cfg["base_url"].rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = base_url.rstrip("/") + "/v1"

    ratio = normalize_aspect_ratio(data.aspectRatio)
    size = _ratio_to_size(ratio)

    result = await request_json(
        "POST",
        f"{base_url}/images/generations",
        cfg["api_key"],
        json={
            "model": cfg["model"].strip(),
            "prompt": data.prompt,
            "size": size,
            "quality": "auto",
            "output_format": "png",
        },
    )

    try:
        item = result["data"][0]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI Image response lỗi: {exc}",
        )

    b64 = item.get("b64_json") or item.get("base64")
    if b64:
        return {"base64": b64, "mimeType": "image/png", "mediaId": str(uuid.uuid4())}

    image_url = item.get("url")
    if image_url:
        b64, mime_type = await download_to_base64(image_url, default_mime="image/png")
        return {"base64": b64, "mimeType": mime_type, "mediaId": str(uuid.uuid4())}

    raise HTTPException(status_code=502, detail="OpenAI Image không trả ảnh.")
