"""
TEXT adapter — OpenAI Chat Completions API chuẩn.

Cấu hình cần thiết:
  provider : "openai" | "chatgpt"
  base_url : "https://api.openai.com/v1"
  api_key  : OpenAI API key
  model    : ví dụ "gpt-4o", "gpt-4o-mini"

Lưu ý: Dùng /chat/completions (Chat API), KHÔNG phải /responses (Responses API).
"""
from fastapi import HTTPException
from app.ai.base import request_json


async def generate_text(cfg: dict, prompt: str) -> str:
    base_url = cfg["base_url"].rstrip("/")

    # Đảm bảo URL có /v1
    if not base_url.endswith("/v1"):
        # nếu base_url không kết thúc bằng /v1, thêm vào
        if not any(base_url.endswith(s) for s in ["/v1", "/v1/"]):
            base_url = base_url.rstrip("/") + "/v1"

    result = await request_json(
        "POST",
        f"{base_url}/chat/completions",
        cfg["api_key"],
        json={
            "model": cfg["model"].strip(),
            "messages": [
                {"role": "user", "content": prompt}
            ],
        },
    )

    try:
        content = result["choices"][0]["message"]["content"]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI không trả format hợp lệ: {exc}",
        )

    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [item["text"] for item in content if isinstance(item, dict) and item.get("text")]
        return "\n".join(parts).strip()

    text = str(content).strip()
    if not text:
        raise HTTPException(status_code=502, detail="OpenAI không trả về text.")
    return text
