import os
import sqlite3
import uuid
import time
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from app.models.schemas import AIConfigCreate, AIConfigUpdate, SetDefaultRequest, TestConnectionRequest
from app.core.security import encrypt_api_key, decrypt_api_key

router = APIRouter(prefix="/api/config", tags=["Config"])

# =========================================================
# CONFIG HELPERS
# =========================================================

def mask_api_key(
    api_key: str
) -> str:

    if not api_key:

        return ""


    if len(
        api_key
    ) <= 8:

        return "********"


    return (
        f"{api_key[:4]}"
        f"..."
        f"{api_key[-4:]}"
    )


def normalize_provider(
    value: str
) -> str:

    return (
        value or ""
    ).strip().lower()


def normalize_ai_type(
    value: str
) -> str:

    value = (
        value or ""
    ).strip().upper()


    if value not in {
        "TEXT",
        "IMAGE",
        "VIDEO"
    }:

        raise HTTPException(
            status_code=400,

            detail=(
                "type phải là "
                "TEXT, IMAGE hoặc VIDEO"
            )
        )


    return value


def get_ai_config(
    ai_type: str,
    selected_id: Optional[str] = None
):

    ai_type = normalize_ai_type(
        ai_type
    )


    conn = get_db()


    try:

        if selected_id:

            row = conn.execute(
                """
                SELECT *
                FROM ai_configs
                WHERE id = ?
                  AND type = ?
                  AND is_active = 1
                """,
                (
                    selected_id,
                    ai_type
                )
            ).fetchone()


            if row:
                result = dict(row)
                result["api_key"] = decrypt_api_key(result["api_key"] or "")
                return result


        row = conn.execute(
            """
            SELECT *
            FROM ai_configs
            WHERE type = ?
              AND is_active = 1
              AND is_default = 1
            LIMIT 1
            """,
            (
                ai_type,
            )
        ).fetchone()


        if not row:

            raise HTTPException(
                status_code=400,

                detail=(
                    f"Chưa cấu hình AI "
                    f"mặc định loại "
                    f"{ai_type}"
                )
            )


        result = dict(row)
        result["api_key"] = decrypt_api_key(result["api_key"] or "")
        return result

    finally:

        conn.close()


# =========================================================
# GET CONFIGS
# =========================================================

@router.get(
    "/ai-providers"
)
def get_ai_providers():

    conn = get_db()


    try:

        rows = conn.execute(
            """
            SELECT
                id,
                name,
                provider,
                type,
                model,
                base_url,
                api_key,
                is_active,
                is_default,
                created_at
            FROM ai_configs
            ORDER BY created_at ASC
            """
        ).fetchall()

    finally:

        conn.close()


    providers = []

    for row in rows:
        providers.append({
            "id":           row["id"],
            "name":         row["name"],
            "provider":     row["provider"],
            "type":         row["type"],
            "model":        row["model"],
            "baseUrl":      row["base_url"],
            "apiKeyMasked": mask_api_key(row["api_key"]),
            "isActive":     bool(row["is_active"]),
            "isDefault":    bool(row["is_default"]),
            "extraConfig":  _parse_extra_config(row["extra_config"]),
            "createdAt":    row["created_at"],
        })

    return {"providers": providers}


def _parse_extra_config(raw) -> dict:
    """Giải sử JSON extra_config từ DB, trả {} nếu lỗi."""
    if not raw:
        return {}
    try:
        result = json.loads(raw)
        return result if isinstance(result, dict) else {}
    except Exception:
        return {}


# =========================================================
# REVEAL API KEY
# =========================================================

@router.get(
    "/ai-providers/{config_id}/api-key"
)
def reveal_ai_provider_api_key(
    config_id: str
):

    conn = get_db()


    try:

        row = conn.execute(
            """
            SELECT
                id,
                api_key
            FROM ai_configs
            WHERE id = ?
            """,
            (
                config_id,
            )
        ).fetchone()


        if not row:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Không tìm thấy AI config"
                )
            )


        api_key = decrypt_api_key(
            row["api_key"]
            or ""
        )


        if not api_key:

            raise HTTPException(
                status_code=404,
                detail=(
                    "AI này chưa có API Key"
                )
            )


        return {
            "id":
                row["id"],

            "apiKey":
                api_key
        }

    finally:

        conn.close()


# =========================================================
# CREATE AI CONFIG
# =========================================================

@router.post(
    "/ai-providers"
)
def create_ai_provider(
    data: AIConfigCreate
):

    provider_type = (
        normalize_ai_type(
            data.type
        )
    )


    config_id = str(
        uuid.uuid4()
    )


    now = int(
        time.time() * 1000
    )


    conn = get_db()

    try:
        if data.isDefault:
            conn.execute(
                "UPDATE ai_configs SET is_default = 0 WHERE type = ?",
                (provider_type,)
            )

        conn.execute(
            """
            INSERT INTO ai_configs (
                id, name, provider, type, model,
                base_url, api_key, is_active, is_default,
                extra_config, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                config_id,
                data.name.strip(),
                data.provider.strip(),
                provider_type,
                data.model.strip(),
                (data.baseUrl or "").strip().rstrip("/"),
                encrypt_api_key((data.apiKey or "").strip()),
                1 if data.isActive else 0,
                1 if data.isDefault else 0,
                json.dumps(data.extraConfig or {}, ensure_ascii=False),
                now
            )
        )

        conn.commit()

    finally:
        conn.close()

    return {"status": "success", "id": config_id}


# =========================================================
# UPDATE AI CONFIG
# =========================================================

@router.put(
    "/ai-providers/{config_id}"
)
def update_ai_provider(
    config_id: str,
    data: AIConfigUpdate
):

    conn = get_db()

    try:
        current = conn.execute(
            "SELECT * FROM ai_configs WHERE id = ?",
            (config_id,)
        ).fetchone()

        if not current:
            raise HTTPException(status_code=404, detail="Không tìm thấy AI config")

        provider_type = normalize_ai_type(
            data.type if data.type is not None else current["type"]
        )

        if data.isDefault is True:
            conn.execute(
                "UPDATE ai_configs SET is_default = 0 WHERE type = ?",
                (provider_type,)
            )

        # extra_config: merge hoặc thay thế
        if data.extraConfig is not None:
            new_extra = json.dumps(data.extraConfig, ensure_ascii=False)
        else:
            new_extra = current["extra_config"] or "{}"

        conn.execute(
            """
            UPDATE ai_configs
            SET name = ?, provider = ?, type = ?, model = ?,
                base_url = ?, api_key = ?, is_active = ?,
                is_default = ?, extra_config = ?
            WHERE id = ?
            """,
            (
                data.name.strip() if data.name is not None else current["name"],
                data.provider.strip() if data.provider is not None else current["provider"],
                provider_type,
                data.model.strip() if data.model is not None else current["model"],
                (data.baseUrl.strip().rstrip("/") if data.baseUrl is not None else current["base_url"]),
                (
                    encrypt_api_key(data.apiKey.strip())
                    if data.apiKey is not None
                    else current["api_key"]
                ),
                (
                    (1 if data.isActive else 0)
                    if data.isActive is not None
                    else current["is_active"]
                ),
                (
                    (1 if data.isDefault else 0)
                    if data.isDefault is not None
                    else current["is_default"]
                ),
                new_extra,
                config_id
            )
        )

        conn.commit()

    finally:
        conn.close()

    return {"status": "success"}


# =========================================================
# DELETE AI CONFIG
# =========================================================

@router.delete(
    "/ai-providers/{config_id}"
)
def delete_ai_provider(
    config_id: str
):

    conn = get_db()


    try:

        cursor = conn.execute(
            """
            DELETE FROM ai_configs
            WHERE id = ?
            """,
            (
                config_id,
            )
        )


        conn.commit()

    finally:

        conn.close()


    if cursor.rowcount == 0:

        raise HTTPException(
            status_code=404,

            detail=(
                "Không tìm thấy AI config"
            )
        )


    return {
        "status":
            "success"
    }


# =========================================================
# SET DEFAULT
# =========================================================

@router.post(
    "/set-default"
)
def set_default_ai(
    data: SetDefaultRequest
):

    provider_type = (
        normalize_ai_type(
            data.type
        )
    )


    conn = get_db()


    try:

        provider = conn.execute(
            """
            SELECT id
            FROM ai_configs
            WHERE id = ?
              AND type = ?
            """,
            (
                data.id,
                provider_type
            )
        ).fetchone()


        if not provider:

            raise HTTPException(
                status_code=404,

                detail=(
                    "Không tìm thấy AI config"
                )
            )


        conn.execute(
            """
            UPDATE ai_configs
            SET is_default = 0
            WHERE type = ?
            """,
            (
                provider_type,
            )
        )


        conn.execute(
            """
            UPDATE ai_configs
            SET is_default = 1
            WHERE id = ?
            """,
            (
                data.id,
            )
        )


        conn.commit()

    finally:

        conn.close()



    return {
        "status":
            "success"
    }


# =========================================================
# TEST CONNECTION
# =========================================================

@router.post("/test-connection")
async def test_ai_connection(data: TestConnectionRequest):
    """
    Kiểm tra kết nối đến AI provider trước khi lưu config.
    Trả về { ok: bool, message: str, models?: list[str] }.
    """
    import asyncio
    from app.ai.base import request_json, google_api_base_url

    provider = (data.provider or "").strip().lower()
    base_url = (data.baseUrl or "").strip().rstrip("/")
    api_key = (data.apiKey or "").strip()
    model = (data.model or "").strip()
    extra = data.extraConfig or {}

    try:
        # -----------------------------------------------
        # Ollama: GET /api/tags — liệt kê models local
        # -----------------------------------------------
        if provider == "ollama":
            ollama_url = base_url or "http://localhost:11434"
            result = await asyncio.wait_for(
                request_json("GET", f"{ollama_url}/api/tags", "", auth_bearer=False),
                timeout=10.0,
            )
            models = [m["name"] for m in result.get("models", [])]
            return {
                "ok": True,
                "message": f"Ollama kết nối thành công. Có {len(models)} model.",
                "models": models,
            }

        # -----------------------------------------------
        # Google / Gemini: GET /models
        # -----------------------------------------------
        if provider in {"google", "gemini"}:
            api_base = google_api_base_url(base_url)
            url = f"{api_base}/models/{model}" if model else f"{api_base}/models"
            await asyncio.wait_for(
                request_json(
                    "GET", url, api_key,
                    headers={"x-goog-api-key": api_key},
                    auth_bearer=False,
                ),
                timeout=15.0,
            )
            return {"ok": True, "message": "Google/Gemini API key hợp lệ."}

        # -----------------------------------------------
        # Anthropic: POST /v1/messages với max_tokens nhỏ
        # -----------------------------------------------
        if provider in {"anthropic", "claude"}:
            _base = base_url or "https://api.anthropic.com"
            endpoint = (
                f"{_base}/messages"
                if _base.endswith("/v1")
                else f"{_base}/v1/messages"
            )
            anthropic_version = extra.get("anthropic_version", "2023-06-01")
            await asyncio.wait_for(
                request_json(
                    "POST", endpoint, api_key,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": api_key,
                        "anthropic-version": anthropic_version,
                    },
                    auth_bearer=False,
                    json={
                        "model": model or "claude-haiku-4-5",
                        "max_tokens": 1,
                        "messages": [{"role": "user", "content": "hi"}],
                    },
                ),
                timeout=20.0,
            )
            return {"ok": True, "message": "Anthropic/Claude API key hợp lệ."}

        # -----------------------------------------------
        # OpenAI + OpenAI-compatible: GET /models
        # -----------------------------------------------
        _default_urls = {
            "openai":     "https://api.openai.com/v1",
            "chatgpt":    "https://api.openai.com/v1",
            "lmstudio":   "http://localhost:1234/v1",
            "llamacpp":   "http://localhost:8080/v1",
            "llama.cpp":  "http://localhost:8080/v1",
            "vllm":       "http://localhost:8000/v1",
            "groq":       "https://api.groq.com/openai/v1",
            "together":   "https://api.together.xyz/v1",
            "togetherai": "https://api.together.xyz/v1",
            "deepseek":   "https://api.deepseek.com/v1",
            "mistral":    "https://api.mistral.ai/v1",
        }
        if not base_url:
            base_url = _default_urls.get(provider, "")

        if base_url and not base_url.endswith("/v1"):
            base_url = base_url + "/v1"

        result = await asyncio.wait_for(
            request_json("GET", f"{base_url}/models", api_key),
            timeout=15.0,
        )
        model_list = [m.get("id", "") for m in result.get("data", [])]
        return {
            "ok": True,
            "message": f"Kết nối thành công. Có {len(model_list)} model.",
            "models": model_list[:20],
        }

    except Exception as exc:
        detail = str(exc)
        if "Connection refused" in detail or "connection refused" in detail:
            msg = f"Không thể kết nối đến '{base_url or provider}'. Kiểm tra server đang chạy."
        elif "401" in detail:
            msg = "API key không hợp lệ hoặc đã hết hạn."
        elif "403" in detail:
            msg = "API key không có quyền truy cập model này."
        elif "404" in detail:
            msg = "Không tìm thấy endpoint. Kiểm tra lại Base URL và Model."
        elif "timeout" in detail.lower():
            msg = "Kết nối timeout. Kiểm tra network hoặc server."
        else:
            msg = f"Lỗi: {detail[:500]}"

        return {"ok": False, "message": msg}
