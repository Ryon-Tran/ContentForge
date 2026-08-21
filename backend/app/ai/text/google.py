"""
TEXT adapter — Google Gemini (generateContent).

Cấu hình cần thiết:
  provider : "google" | "gemini"
  base_url : "https://generativelanguage.googleapis.com"  (hoặc để trống)
  api_key  : Google AI Studio API key
  model    : ví dụ "gemini-2.0-flash"
"""
from fastapi import HTTPException
from app.ai.base import request_json, google_api_base_url


async def generate_text(cfg: dict, prompt: str) -> str:
    api_base = google_api_base_url(cfg["base_url"])
    model = cfg["model"].strip()
    url = f"{api_base}/models/{model}:generateContent"

    try:
        result = await request_json(
            "POST",
            url,
            cfg["api_key"],
            headers={
                "x-goog-api-key": cfg["api_key"],
                "Content-Type": "application/json",
            },
            auth_bearer=False,
            json={
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}],
                    }
                ]
            },
        )
    except HTTPException as exc:
        detail = str(exc.detail)
        if "404" in detail:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Gemini không tìm thấy model '{model}' trên endpoint "
                    f"'{api_base}'. Kiểm tra Model, Base URL hoặc quyền API key. "
                    f"Chi tiết: {detail}"
                ),
            )
        raise

    parts = []
    for candidate in result.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            text = part.get("text")
            if text:
                parts.append(text)

    text = "\n".join(parts).strip()
    if not text:
        raise HTTPException(status_code=502, detail="Gemini không trả về text.")
    return text
