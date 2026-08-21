"""
IMAGE adapter — Google Gemini Imagen (/interactions).

Cấu hình cần thiết:
  provider : "google" | "gemini"
  base_url : "https://generativelanguage.googleapis.com"  (hoặc để trống)
  api_key  : Google AI Studio API key
  model    : ví dụ "imagen-3.0-generate-002"
"""
import json
import uuid
from typing import Any

from fastapi import HTTPException
from app.ai.base import request_json, google_api_base_url, normalize_aspect_ratio
from app.models.schemas import GenerateImageRequest


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    api_base = google_api_base_url(cfg["base_url"])
    url = f"{api_base}/interactions"
    ratio = normalize_aspect_ratio(data.aspectRatio)

    inputs: list[dict[str, Any]] = []

    # Ảnh tham khảo
    for reference in data.referenceImages:
        if reference.base64.strip():
            inputs.append({
                "type": "image",
                "data": reference.base64.strip(),
                "mime_type": reference.mimeType or "image/jpeg",
            })

    inputs.append({"type": "text", "text": data.prompt})

    google_input: Any = data.prompt if len(inputs) == 1 else inputs

    payload = {
        "model": cfg["model"].strip(),
        "input": google_input,
        "response_format": {
            "type": "image",
            "mime_type": "image/jpeg",
            "aspect_ratio": ratio,
            "image_size": "1K",
        },
    }

    result = await request_json(
        "POST",
        url,
        cfg["api_key"],
        headers={
            "x-goog-api-key": cfg["api_key"],
            "Api-Revision": "2026-05-20",
            "Content-Type": "application/json",
        },
        auth_bearer=False,
        json=payload,
    )

    # Kiểu 1: output_image
    output_image = result.get("output_image") or result.get("outputImage")
    if isinstance(output_image, dict) and output_image.get("data"):
        return {
            "base64": output_image["data"],
            "mimeType": (
                output_image.get("mime_type")
                or output_image.get("mimeType")
                or "image/jpeg"
            ),
            "mediaId": str(uuid.uuid4()),
        }

    # Kiểu 2: steps[].content[]
    for step in result.get("steps", []):
        for block in step.get("content", []):
            if block.get("type") == "image" and block.get("data"):
                return {
                    "base64": block["data"],
                    "mimeType": (
                        block.get("mime_type")
                        or block.get("mimeType")
                        or "image/jpeg"
                    ),
                    "mediaId": str(uuid.uuid4()),
                }

    raise HTTPException(
        status_code=502,
        detail=(
            "Google Gemini Image đã trả response nhưng không tìm thấy dữ liệu ảnh. "
            f"Response: {json.dumps(result, ensure_ascii=False)[:3000]}"
        ),
    )
