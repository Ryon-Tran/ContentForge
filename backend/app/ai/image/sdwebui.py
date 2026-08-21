"""
IMAGE adapter — Stable Diffusion WebUI (Automatic1111 / SD.Next / Forge).

Endpoint mặc định: POST http://localhost:7860/sdapi/v1/txt2img
"""
import uuid
from fastapi import HTTPException
from app.ai.base import request_json, normalize_aspect_ratio
from app.models.schemas import GenerateImageRequest

DEFAULT_BASE_URL = "http://localhost:7860"


def _ratio_to_dimensions(ratio: str) -> tuple[int, int]:
    if ratio == "1:1":
        return 768, 768
    if ratio == "9:16":
        return 576, 1024
    if ratio == "16:9":
        return 1024, 576
    if ratio == "3:4":
        return 768, 1024
    if ratio == "4:3":
        return 1024, 768
    return 576, 1024


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    base_url = (cfg.get("base_url") or DEFAULT_BASE_URL).rstrip("/")
    ratio = normalize_aspect_ratio(data.aspectRatio)
    width, height = _ratio_to_dimensions(ratio)
    extra = cfg.get("extra_config") or {}

    payload = {
        "prompt": data.prompt,
        "negative_prompt": extra.get("negative_prompt", "blurry, low quality, distorted, watermark"),
        "steps": int(extra.get("steps", 25)),
        "width": width,
        "height": height,
        "cfg_scale": float(extra.get("cfg_scale", 7.0)),
        "sampler_name": extra.get("sampler_name", "DPM++ 2M Karras"),
    }

    result = await request_json(
        "POST",
        f"{base_url}/sdapi/v1/txt2img",
        cfg.get("api_key", ""),
        auth_bearer=False,
        json=payload,
        timeout=180.0,
    )

    images = result.get("images", [])
    if not images:
        raise HTTPException(
            status_code=502,
            detail="SD WebUI không trả về ảnh nào. Hãy kiểm tra lại server SD WebUI."
        )

    return {
        "base64": images[0],
        "mimeType": "image/png",
        "mediaId": str(uuid.uuid4()),
    }
