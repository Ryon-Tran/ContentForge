"""
TEXT adapter — OpenAI-Compatible local/cloud providers.

Dùng cho:
  - LM Studio   : http://localhost:1234/v1
  - llama.cpp   : http://localhost:8080/v1
  - vLLM        : http://localhost:8000/v1
  - Groq        : https://api.groq.com/openai/v1
  - Together AI : https://api.together.xyz/v1
  - DeepSeek    : https://api.deepseek.com/v1
  - Mistral     : https://api.mistral.ai/v1
  - Bất kỳ provider nào dùng /chat/completions

Cấu hình cần thiết:
  provider : "lmstudio" | "llamacpp" | "vllm" | "groq" | "together" |
             "deepseek" | "mistral" | "local" | bất kỳ tên nào
  base_url : URL có /v1 hoặc server root
  api_key  : API key (để trống nếu local)
  model    : tên model

extra_config (tùy chọn):
  temperature   : 0.7
  max_tokens    : 2048
  system_prompt : ""
"""
from fastapi import HTTPException
from app.ai.base import request_json

# Base URL mặc định theo provider phổ biến
DEFAULT_BASE_URLS: dict[str, str] = {
    "lmstudio":  "http://localhost:1234/v1",
    "llamacpp":  "http://localhost:8080/v1",
    "vllm":      "http://localhost:8000/v1",
    "groq":      "https://api.groq.com/openai/v1",
    "together":  "https://api.together.xyz/v1",
    "deepseek":  "https://api.deepseek.com/v1",
    "mistral":   "https://api.mistral.ai/v1",
}


def _resolve_base_url(provider: str, cfg_url: str) -> str:
    """Trả về base URL đã có /v1 ở cuối."""
    url = (cfg_url or DEFAULT_BASE_URLS.get(provider, "")).rstrip("/")
    if not url:
        raise ValueError(f"Provider '{provider}' cần có Base URL.")
    # Đảm bảo kết thúc bằng /v1
    if not url.endswith("/v1"):
        url = f"{url}/v1"
    return url


async def generate_text(cfg: dict, prompt: str) -> str:
    provider = (cfg.get("provider") or "").strip().lower()
    extra = cfg.get("extra_config") or {}

    base_url = _resolve_base_url(provider, cfg.get("base_url", ""))
    model = cfg["model"].strip()
    system_prompt = extra.get("system_prompt", "")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload: dict = {
        "model": model,
        "messages": messages,
    }
    if extra.get("temperature") is not None:
        payload["temperature"] = float(extra["temperature"])
    if extra.get("max_tokens") is not None:
        payload["max_tokens"] = int(extra["max_tokens"])

    result = await request_json(
        "POST",
        f"{base_url}/chat/completions",
        cfg.get("api_key", ""),
        json=payload,
    )

    try:
        content = result["choices"][0]["message"]["content"]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Provider '{provider}' không trả format OpenAI-compatible hợp lệ: {exc}",
        )

    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = [
            item["text"]
            for item in content
            if isinstance(item, dict) and item.get("text")
        ]
        return "\n".join(parts).strip()

    return str(content).strip()
