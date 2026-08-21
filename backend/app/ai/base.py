"""
Shared HTTP helpers dùng chung cho tất cả AI adapters.
"""
import base64
import json
from typing import Optional

import httpx
from fastapi import HTTPException


async def request_json(
    method: str,
    url: str,
    api_key: str = "",
    headers: Optional[dict] = None,
    auth_bearer: bool = True,
    timeout: float = 300.0,
    **kwargs,
):
    """Gửi HTTP request tới AI provider, trả về JSON hoặc raise HTTPException."""
    final_headers = dict(headers or {})

    if auth_bearer and api_key:
        final_headers["Authorization"] = f"Bearer {api_key}"

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.request(
            method,
            url,
            headers=final_headers,
            **kwargs,
        )

    if response.status_code >= 400:
        error_text = response.text
        try:
            error_data = response.json()
            if isinstance(error_data, dict):
                provider_error = error_data.get("error")
                if isinstance(provider_error, dict):
                    error_text = (
                        provider_error.get("message")
                        or json.dumps(provider_error, ensure_ascii=False)
                    )
                elif error_data.get("detail"):
                    error_text = str(error_data["detail"])
                else:
                    error_text = json.dumps(error_data, ensure_ascii=False)
        except Exception:
            pass

        raise HTTPException(
            status_code=502,
            detail=(
                f"Provider API lỗi {response.status_code}: "
                f"{error_text[:4000]}"
            ),
        )

    try:
        return response.json()
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Provider trả về dữ liệu không phải JSON hợp lệ.",
        )


async def download_to_base64(
    url: str,
    headers: Optional[dict] = None,
    default_mime: str = "application/octet-stream",
) -> tuple[str, str]:
    """Tải file từ URL về, trả về (base64_str, mime_type)."""
    async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
        response = await client.get(url, headers=headers or {})

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Không tải được file từ provider. HTTP {response.status_code}",
        )

    mime_type = (
        response.headers.get("content-type", default_mime)
        .split(";", 1)[0]
        .strip()
    )

    return (
        base64.b64encode(response.content).decode("utf-8"),
        mime_type,
    )


def google_api_base_url(base_url: str) -> str:
    """Chuẩn hóa base URL Google Generative Language API."""
    clean = (base_url or "").strip().rstrip("/")
    if clean.endswith("/v1beta") or clean.endswith("/v1"):
        return clean
    root = clean or "https://generativelanguage.googleapis.com"
    return f"{root}/v1beta"


def normalize_aspect_ratio(value: str) -> str:
    allowed = {
        "1:1", "1:4", "1:8", "2:3", "3:2", "3:4",
        "4:1", "4:3", "4:5", "5:4", "8:1",
        "9:16", "16:9", "21:9",
    }
    value = (value or "9:16").strip()
    return value if value in allowed else "9:16"
