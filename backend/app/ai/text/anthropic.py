"""
TEXT adapter — Anthropic Claude (/v1/messages).

Cấu hình cần thiết:
  provider   : "anthropic" | "claude"
  base_url   : "https://api.anthropic.com"  (hoặc để trống)
  api_key    : Anthropic API key
  model      : ví dụ "claude-opus-4-5", "claude-sonnet-4-5"

extra_config (tùy chọn):
  anthropic_version : "2023-06-01"  (mặc định)
  max_tokens        : 4096           (mặc định 2048)
"""
from fastapi import HTTPException
from app.ai.base import request_json

DEFAULT_BASE_URL = "https://api.anthropic.com"
DEFAULT_VERSION = "2023-06-01"
DEFAULT_MAX_TOKENS = 2048


async def generate_text(cfg: dict, prompt: str) -> str:
    extra = cfg.get("extra_config") or {}
    base_url = (cfg["base_url"] or DEFAULT_BASE_URL).rstrip("/")

    # Chuẩn hóa endpoint
    if base_url.endswith("/v1"):
        endpoint = f"{base_url}/messages"
    else:
        endpoint = f"{base_url}/v1/messages"

    anthropic_version = extra.get("anthropic_version", DEFAULT_VERSION)
    max_tokens = int(extra.get("max_tokens", DEFAULT_MAX_TOKENS))

    result = await request_json(
        "POST",
        endpoint,
        cfg["api_key"],
        headers={
            "Content-Type": "application/json",
            "x-api-key": cfg["api_key"],
            "anthropic-version": anthropic_version,
        },
        auth_bearer=False,
        json={
            "model": cfg["model"].strip(),
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        },
    )

    parts = [
        item["text"]
        for item in result.get("content", [])
        if isinstance(item, dict) and item.get("type") == "text" and item.get("text")
    ]

    text = "\n".join(parts).strip()
    if not text:
        raise HTTPException(status_code=502, detail="Claude không trả về text.")
    return text
