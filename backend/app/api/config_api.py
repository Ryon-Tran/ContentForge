import os
import sqlite3
import uuid
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from app.models.schemas import AIConfigCreate, AIConfigUpdate, SetDefaultRequest

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

                return dict(
                    row
                )


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


        return dict(
            row
        )

    finally:

        conn.close()


# =========================================================
# GET CONFIGS
# =========================================================

@router.get(
    "/api/config/ai-providers"
)
async def get_ai_providers():

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
            "id":
                row["id"],

            "name":
                row["name"],

            "provider":
                row["provider"],

            "type":
                row["type"],

            "model":
                row["model"],

            "baseUrl":
                row["base_url"],

            "apiKeyMasked":
                mask_api_key(
                    row["api_key"]
                ),

            "isActive":
                bool(
                    row["is_active"]
                ),

            "isDefault":
                bool(
                    row["is_default"]
                ),

            "createdAt":
                row["created_at"]
        })


    return {
        "providers":
            providers
    }


# =========================================================
# REVEAL API KEY
# =========================================================

@router.get(
    "/api/config/ai-providers/{config_id}/api-key"
)
async def reveal_ai_provider_api_key(
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


        api_key = (
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
    "/api/config/ai-providers"
)
async def create_ai_provider(
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
            INSERT INTO ai_configs (
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
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                config_id,

                data.name.strip(),

                data.provider.strip(),

                provider_type,

                data.model.strip(),

                data.baseUrl
                .strip()
                .rstrip("/"),

                data.apiKey.strip(),

                1
                if data.isActive
                else 0,

                1
                if data.isDefault
                else 0,

                now
            )
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "status":
            "success",

        "id":
            config_id
    }


# =========================================================
# UPDATE AI CONFIG
# =========================================================

@router.put(
    "/api/config/ai-providers/{config_id}"
)
async def update_ai_provider(
    config_id: str,
    data: AIConfigUpdate
):

    conn = get_db()


    try:

        current = conn.execute(
            """
            SELECT *
            FROM ai_configs
            WHERE id = ?
            """,
            (
                config_id,
            )
        ).fetchone()


        if not current:

            raise HTTPException(
                status_code=404,

                detail=(
                    "Không tìm thấy AI config"
                )
            )


        provider_type = (
            normalize_ai_type(

                data.type

                if data.type
                is not None

                else current[
                    "type"
                ]

            )
        )


        if data.isDefault is True:

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

            SET
                name = ?,
                provider = ?,
                type = ?,
                model = ?,
                base_url = ?,
                api_key = ?,
                is_active = ?,
                is_default = ?

            WHERE id = ?
            """,
            (
                data.name.strip()
                if data.name is not None
                else current[
                    "name"
                ],

                data.provider.strip()
                if data.provider is not None
                else current[
                    "provider"
                ],

                provider_type,

                data.model.strip()
                if data.model is not None
                else current[
                    "model"
                ],

                data.baseUrl
                .strip()
                .rstrip("/")
                if data.baseUrl is not None
                else current[
                    "base_url"
                ],

                data.apiKey.strip()
                if data.apiKey
                else current[
                    "api_key"
                ],

                (
                    1
                    if data.isActive
                    else 0
                )
                if data.isActive
                is not None
                else current[
                    "is_active"
                ],

                (
                    1
                    if data.isDefault
                    else 0
                )
                if data.isDefault
                is not None
                else current[
                    "is_default"
                ],

                config_id
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
# DELETE AI CONFIG
# =========================================================

@router.delete(
    "/api/config/ai-providers/{config_id}"
)
async def delete_ai_provider(
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
    "/api/config/set-default"
)
async def set_default_ai(
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


