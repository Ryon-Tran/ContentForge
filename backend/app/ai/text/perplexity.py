"""
TEXT adapter — Perplexity Sonar (/v1/chat/completions).

Cấu hình cần thiết:
  provider : "perplexity" | "sonar"
  base_url : "https://api.perplexity.ai"
  api_key  : Perplexity API key
  model    : ví dụ "sonar", "sonar-pro"
"""
from fastapi import HTTPException
from app.ai.base import request_json

DEFAULT_BASE_URL = "https://api.perplexity.ai"


async def generate_text(cfg: dict, prompt: str) -> str:
    base_url = (cfg["base_url"] or DEFAULT_BASE_URL).rstrip("/")

    # Perplexity dùng /chat/completions (OpenAI-compatible format)
    if base_url.endswith("/v1"):
        endpoint = f"{base_url}/chat/completions"
    else:
        endpoint = f"{base_url}/v1/chat/completions"

    result = await request_json(
        "POST",
        endpoint,
        cfg["api_key"],
        json={
            "model": cfg["model"].strip(),
            "messages": [{"role": "user", "content": prompt}],
        },
    )

    try:
        content = result["choices"][0]["message"]["content"]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Perplexity không trả format text hợp lệ: {exc}",
        )

    return str(content).strip()
