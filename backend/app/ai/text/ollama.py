"""
TEXT adapter — Ollama (local model runner).

Hỗ trợ 2 format:
  1. Ollama native API  : POST /api/chat
  2. OpenAI-compatible  : POST /v1/chat/completions

Cấu hình cần thiết:
  provider : "ollama"
  base_url : "http://localhost:11434"  (mặc định)
  api_key  : ""  (để trống — không cần)
  model    : ví dụ "llama3.2", "mistral", "qwen2.5"

extra_config (tùy chọn):
  use_openai_compat : false  (mặc định dùng Ollama native /api/chat)
  temperature       : 0.7
  num_ctx           : 4096   (context window)
  system_prompt     : ""
"""
from fastapi import HTTPException
from app.ai.base import request_json

DEFAULT_BASE_URL = "http://localhost:11434"


async def generate_text(cfg: dict, prompt: str) -> str:
    extra = cfg.get("extra_config") or {}
    base_url = (cfg["base_url"] or DEFAULT_BASE_URL).rstrip("/")
    model = cfg["model"].strip()
    use_compat = bool(extra.get("use_openai_compat", False))
    system_prompt = extra.get("system_prompt", "")

    # -------------------------------------------------------
    # Format 2: OpenAI-compatible /v1/chat/completions
    # -------------------------------------------------------
    if use_compat:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        result = await request_json(
            "POST",
            f"{base_url}/v1/chat/completions",
            cfg.get("api_key", ""),
            json={
                "model": model,
                "messages": messages,
                "stream": False,
            },
        )
        try:
            return result["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Ollama (OpenAI-compat) không trả format hợp lệ: {exc}",
            )

    # -------------------------------------------------------
    # Format 1: Ollama native /api/chat
    # -------------------------------------------------------
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    options = {}
    if extra.get("temperature") is not None:
        options["temperature"] = float(extra["temperature"])
    if extra.get("num_ctx") is not None:
        options["num_ctx"] = int(extra["num_ctx"])

    payload: dict = {
        "model": model,
        "messages": messages,
        "stream": False,
    }
    if options:
        payload["options"] = options

    result = await request_json(
        "POST",
        f"{base_url}/api/chat",
        "",           # Ollama không cần api_key
        auth_bearer=False,
        json=payload,
    )

    try:
        text = result["message"]["content"]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama không trả format hợp lệ: {exc}. Response: {result}",
        )

    text = (text or "").strip()
    if not text:
        raise HTTPException(status_code=502, detail="Ollama không trả về text.")
    return text


async def list_models(base_url: str) -> list[str]:
    """Lấy danh sách model đang có trong Ollama."""
    url = f"{(base_url or DEFAULT_BASE_URL).rstrip('/')}/api/tags"
    result = await request_json("GET", url, "", auth_bearer=False)
    return [m["name"] for m in result.get("models", [])]
