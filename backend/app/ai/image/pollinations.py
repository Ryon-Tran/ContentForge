"""
IMAGE adapter — Pollinations.ai (Hoàn toàn Miễn phí 100%, KHÔNG CẦN API KEY).

Models hỗ trợ:
  - flux (mặc định - chi tiết cao, chân thực)
  - flux-realism (ảnh chân dung chụp thực tế)
  - flux-anime (phong cách anime)
  - flux-3d (hoạt hình 3D)
  - turbo (tốc độ siêu nhanh)
"""
import base64
import random
import urllib.parse
import uuid
import httpx
from fastapi import HTTPException
from app.ai.base import normalize_aspect_ratio
from app.models.schemas import GenerateImageRequest

DEFAULT_MODEL = "flux"


def _ratio_to_dimensions(ratio: str) -> tuple[int, int]:
    if ratio == "1:1":
        return 1024, 1024
    if ratio == "9:16":
        return 720, 1280
    if ratio == "16:9":
        return 1280, 720
    if ratio == "3:4":
        return 768, 1024
    if ratio == "4:3":
        return 1024, 768
    return 720, 1280


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    prompt = (data.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt tạo ảnh không được để trống.")

    model = (cfg.get("model") or DEFAULT_MODEL).strip().lower()
    ratio = normalize_aspect_ratio(data.aspectRatio)
    width, height = _ratio_to_dimensions(ratio)
    seed = random.randint(1, 999999999)

    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?model={model}&width={width}&height={height}&seed={seed}&nologo=true"

    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            response = await client.get(url)

            if response.status_code >= 400:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Pollinations.ai lỗi: HTTP {response.status_code}"
                )

            image_bytes = response.content
            if not image_bytes:
                raise HTTPException(status_code=502, detail="Pollinations.ai không trả về dữ liệu ảnh.")

            mime_type = response.headers.get("content-type", "image/jpeg")
            b64 = base64.b64encode(image_bytes).decode("utf-8")

            return {
                "base64": b64,
                "mimeType": mime_type,
                "mediaId": str(uuid.uuid4()),
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Không thể kết nối tới Pollinations.ai: {e}"
        )
