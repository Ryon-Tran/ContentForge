"""
IMAGE router — điều phối đến adapter đúng theo provider.

Provider mapping:
  google / gemini         → google.py        (Imagen /interactions)
  openai / chatgpt        → openai.py        (DALL-E /images/generations)
  xai / grok              → xai.py           (Grok /images/generations)
  pollinations / polli    → pollinations.py  (Pollinations.ai Free 100%)
  huggingface / hf        → huggingface.py   (FLUX.1-schnell / SDXL)
  sdwebui / automatic1111 → sdwebui.py       (SD WebUI txt2img)
  comfyui                 → comfyui.py       (ComfyUI prompt queue)
  (fallback)              → openai.py        (thử OpenAI-compatible)
"""
from fastapi import HTTPException
from app.ai.image import google, openai, xai, pollinations, huggingface, sdwebui, comfyui
from app.models.schemas import GenerateImageRequest


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    provider = (cfg.get("provider") or "").strip().lower()

    if provider in {"pollinations", "polli", "pollination"}:
        return await pollinations.generate_image(cfg, data)

    if provider in {"google", "gemini"}:
        return await google.generate_image(cfg, data)

    if provider in {"openai", "chatgpt"}:
        return await openai.generate_image(cfg, data)

    if provider in {"xai", "grok"}:
        return await xai.generate_image(cfg, data)

    if provider in {"huggingface", "hf"}:
        return await huggingface.generate_image(cfg, data)

    if provider in {"sdwebui", "automatic1111", "stablediffusion", "sd", "forge"}:
        return await sdwebui.generate_image(cfg, data)

    if provider == "comfyui":
        return await comfyui.generate_image(cfg, data)

    # Fallback: thử OpenAI-compatible
    try:
        return await openai.generate_image(cfg, data)
    except HTTPException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=(
                f"IMAGE provider '{cfg.get('provider')}' chưa có adapter riêng "
                f"và adapter OpenAI-compatible cũng thất bại. {exc.detail}"
            ),
        )
