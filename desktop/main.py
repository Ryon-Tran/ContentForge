import os
import json
import base64
import sqlite3
import uuid
import time
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# PATH / DB
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(
    BASE_DIR,
    "factory_ai.db"
)

SCHEMA_PATH = os.path.join(
    BASE_DIR,
    "schema.sql"
)


def get_db():

    conn = sqlite3.connect(
        DB_PATH
    )

    conn.row_factory = (
        sqlite3.Row
    )

    return conn


def init_db():

    conn = get_db()

    try:

        if os.path.exists(
            SCHEMA_PATH
        ):

            with open(
                SCHEMA_PATH,
                "r",
                encoding="utf-8"
            ) as f:

                conn.executescript(
                    f.read()
                )


        conn.execute("""
            CREATE TABLE IF NOT EXISTS workflow_state (
                table_name TEXT NOT NULL,
                id TEXT NOT NULL,
                data_json TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (table_name, id)
            )
        """)


        conn.execute("""
            CREATE TABLE IF NOT EXISTS ai_configs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                type TEXT NOT NULL,
                model TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                is_default INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )
        """)


        conn.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                data_json TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        """)


        conn.commit()

    finally:

        conn.close()


@asynccontextmanager
async def lifespan(
    app: FastAPI
):

    init_db()

    print(
        f"SQLite DB: {DB_PATH}"
    )

    yield


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Tools-MMO Local API",
    version="2.1.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ]
)


# =========================================================
# HEALTH
# =========================================================

@app.get("/")
async def root():

    return {
        "status":
            "ok",

        "app":
            "Tools-MMO Local API",

        "version":
            "2.1.0"
    }


@app.get("/api/health")
async def health():

    return {
        "status":
            "ok",

        "database":
            os.path.basename(
                DB_PATH
            ),

        "version":
            "2.1.0"
    }


# =========================================================
# CONFIG MODELS
# =========================================================

class AIConfigCreate(
    BaseModel
):

    name: str

    provider: str

    type: str

    model: str

    baseUrl: str

    apiKey: str

    isActive: bool = True

    isDefault: bool = False


class AIConfigUpdate(
    BaseModel
):

    name: Optional[str] = None

    provider: Optional[str] = None

    type: Optional[str] = None

    model: Optional[str] = None

    baseUrl: Optional[str] = None

    apiKey: Optional[str] = None

    isActive: Optional[bool] = None

    isDefault: Optional[bool] = None


class SetDefaultRequest(
    BaseModel
):

    id: str

    type: str


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

@app.get(
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

@app.get(
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

@app.post(
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

@app.put(
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

@app.delete(
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

@app.post(
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


# =========================================================
# ACTIVITY LOG
# =========================================================

class ActivityCreateRequest(
    BaseModel
):

    activity: dict


class ActivityUpdateRequest(
    BaseModel
):

    patch: dict


def normalize_activity(
    activity: dict,
    existing: Optional[dict] = None
):

    now = int(
        time.time() * 1000
    )


    result = dict(
        existing or {}
    )


    result.update(
        activity or {}
    )


    if not result.get(
        "id"
    ):

        result[
            "id"
        ] = str(
            uuid.uuid4()
        )


    if not result.get(
        "createdAt"
    ):

        result[
            "createdAt"
        ] = (

            existing.get(
                "createdAt"
            )

            if existing

            else now

        )


    result[
        "updatedAt"
    ] = now


    result.setdefault(
        "module",
        "SYSTEM"
    )


    result.setdefault(
        "type",
        "OTHER"
    )


    result.setdefault(
        "status",
        "INFO"
    )


    if result.get(
        "message"
    ) is None:

        result[
            "message"
        ] = ""


    return result


@app.post(
    "/api/activity"
)
async def create_activity(
    data: ActivityCreateRequest
):

    activity = normalize_activity(
        data.activity
    )


    conn = get_db()


    try:

        conn.execute(
            """
            INSERT INTO activity_logs (
                id,
                data_json,
                created_at,
                updated_at
            )

            VALUES (?, ?, ?, ?)

            ON CONFLICT(id)

            DO UPDATE SET
                data_json =
                    excluded.data_json,

                updated_at =
                    excluded.updated_at
            """,
            (
                activity[
                    "id"
                ],

                json.dumps(
                    activity,
                    ensure_ascii=False
                ),

                int(
                    activity[
                        "createdAt"
                    ]
                ),

                int(
                    activity[
                        "updatedAt"
                    ]
                )
            )
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "activity":
            activity
    }


@app.get(
    "/api/activity"
)
async def list_activity():

    conn = get_db()


    try:

        rows = conn.execute(
            """
            SELECT data_json
            FROM activity_logs
            ORDER BY created_at DESC
            """
        ).fetchall()

    finally:

        conn.close()


    activities = []


    for row in rows:

        try:

            activities.append(
                json.loads(
                    row[
                        "data_json"
                    ]
                )
            )

        except Exception:

            pass


    return {
        "activities":
            activities
    }


@app.put(
    "/api/activity/{activity_id}"
)
async def update_activity(
    activity_id: str,
    data: ActivityUpdateRequest
):

    conn = get_db()


    try:

        row = conn.execute(
            """
            SELECT data_json
            FROM activity_logs
            WHERE id = ?
            """,
            (
                activity_id,
            )
        ).fetchone()


        if not row:

            raise HTTPException(
                status_code=404,

                detail=(
                    "Không tìm thấy lịch sử hoạt động"
                )
            )


        try:

            current = json.loads(
                row[
                    "data_json"
                ]
            )

        except Exception:

            current = {
                "id":
                    activity_id
            }


        patch = dict(
            data.patch or {}
        )


        patch.pop(
            "id",
            None
        )


        activity = normalize_activity(
            patch,
            existing=current
        )


        activity[
            "id"
        ] = activity_id


        conn.execute(
            """
            UPDATE activity_logs

            SET
                data_json = ?,
                updated_at = ?

            WHERE id = ?
            """,
            (
                json.dumps(
                    activity,
                    ensure_ascii=False
                ),

                int(
                    activity[
                        "updatedAt"
                    ]
                ),

                activity_id
            )
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "activity":
            activity
    }


@app.delete(
    "/api/activity/{activity_id}"
)
async def delete_activity(
    activity_id: str
):

    conn = get_db()


    try:

        cursor = conn.execute(
            """
            DELETE FROM activity_logs
            WHERE id = ?
            """,
            (
                activity_id,
            )
        )


        conn.commit()

    finally:

        conn.close()


    if cursor.rowcount == 0:

        raise HTTPException(
            status_code=404,

            detail=(
                "Không tìm thấy lịch sử hoạt động"
            )
        )


    return {
        "success":
            True
    }


@app.delete(
    "/api/activity"
)
async def clear_activity():

    conn = get_db()


    try:

        conn.execute(
            """
            DELETE FROM activity_logs
            """
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "success":
            True
    }


# =========================================================
# STORAGE
# =========================================================

class SaveRowRequest(
    BaseModel
):

    row: dict

    table: str


class DeleteRowRequest(
    BaseModel
):

    id: str

    table: str


def validate_storage_table(
    table: str
):

    if table not in {
        "production",
        "news",
        "video"
    }:

        raise HTTPException(
            status_code=400,

            detail=(
                "Table không hợp lệ"
            )
        )


@app.post(
    "/api/storage/save-row"
)
async def save_row(
    data: SaveRowRequest
):

    validate_storage_table(
        data.table
    )


    row_id = data.row.get(
        "id"
    )


    if not row_id:

        raise HTTPException(
            status_code=400,

            detail=(
                "Row thiếu id"
            )
        )


    conn = get_db()


    try:

        conn.execute(
            """
            INSERT INTO workflow_state (
                table_name,
                id,
                data_json,
                updated_at
            )

            VALUES (?, ?, ?, ?)

            ON CONFLICT(
                table_name,
                id
            )

            DO UPDATE SET
                data_json =
                    excluded.data_json,

                updated_at =
                    excluded.updated_at
            """,
            (
                data.table,

                row_id,

                json.dumps(
                    data.row,
                    ensure_ascii=False
                ),

                int(
                    time.time() * 1000
                )
            )
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "success":
            True
    }


@app.get(
    "/api/storage/load-rows"
)
async def load_rows(
    table: str = Query(...)
):

    validate_storage_table(
        table
    )


    conn = get_db()


    try:

        rows = conn.execute(
            """
            SELECT data_json
            FROM workflow_state
            WHERE table_name = ?
            ORDER BY updated_at ASC
            """,
            (
                table,
            )
        ).fetchall()

    finally:

        conn.close()


    result = []


    for row in rows:

        try:

            result.append(
                json.loads(
                    row[
                        "data_json"
                    ]
                )
            )

        except Exception:

            pass


    return {
        "rows":
            result
    }


@app.post(
    "/api/storage/delete-row"
)
async def delete_row(
    data: DeleteRowRequest
):

    validate_storage_table(
        data.table
    )


    conn = get_db()


    try:

        conn.execute(
            """
            DELETE FROM workflow_state
            WHERE table_name = ?
              AND id = ?
            """,
            (
                data.table,
                data.id
            )
        )


        conn.commit()

    finally:

        conn.close()


    return {
        "success":
            True
    }


# =========================================================
# FILE SAVE
# =========================================================

class SaveFileRequest(
    BaseModel
):

    base64: str

    mimeType: str

    filename: str

    path: str


@app.post(
    "/api/files/save-file"
)
async def save_file(
    data: SaveFileRequest
):

    try:

        raw_path = (
            data.path.strip()
        )


        if not raw_path:

            raise ValueError(
                "THƯ MỤC LƯU đang trống"
            )


        directory = os.path.abspath(
            os.path.expandvars(
                os.path.expanduser(
                    raw_path
                )
            )
        )


        os.makedirs(
            directory,
            exist_ok=True
        )


        if not os.access(
            directory,
            os.W_OK
        ):

            raise PermissionError(
                "Không có quyền ghi vào thư mục"
            )


        filename = os.path.basename(
            data.filename.strip()
        )


        if not filename:

            raise ValueError(
                "Tên file không hợp lệ"
            )


        file_path = os.path.join(
            directory,
            filename
        )


        try:

            raw = base64.b64decode(
                data.base64,
                validate=True
            )

        except Exception as exc:

            raise ValueError(
                f"Dữ liệu base64 không hợp lệ: {exc}"
            )


        with open(
            file_path,
            "wb"
        ) as f:

            f.write(
                raw
            )


        return {
            "success":
                True,

            "path":
                file_path,

            "filename":
                filename,

            "overwritten":
                True
        }


    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(
                exc
            )
        )


# =========================================================
# AI REQUEST MODELS
# =========================================================

class GenerateTextRequest(
    BaseModel
):

    prompt: str

    model: Optional[str] = None


class ReferenceImagePayload(
    BaseModel
):

    base64: str

    mimeType: str = "image/jpeg"


class GenerateImageRequest(
    BaseModel
):

    prompt: str

    referenceIds: list[str] = Field(
        default_factory=list
    )

    referenceImages: list[
        ReferenceImagePayload
    ] = Field(
        default_factory=list
    )

    model: Optional[str] = None

    aspectRatio: str = "9:16"


class GenerateVideoRequest(
    BaseModel
):

    prompt: str

    firstFrameId: str = ""

    firstFrameBase64: Optional[str] = None

    firstFrameMimeType: Optional[str] = None

    model: Optional[str] = None

    aspectRatio: str = "9:16"

    durationSeconds: int = 8

    resolution: str = "720p"


def resolve_selected_config(
    ai_type: str,
    requested_model: Optional[str]
):

    return get_ai_config(
        ai_type,
        requested_model
    )


# =========================================================
# HTTP HELPERS
# =========================================================

async def request_json(
    method: str,
    url: str,
    api_key: str,
    headers: Optional[dict] = None,
    auth_bearer: bool = True,
    timeout: float = 300.0,
    **kwargs
):

    final_headers = dict(
        headers or {}
    )


    if (
        auth_bearer
        and api_key
    ):

        final_headers[
            "Authorization"
        ] = (
            f"Bearer {api_key}"
        )


    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True
    ) as client:

        response = await client.request(
            method,
            url,
            headers=final_headers,
            **kwargs
        )


    if (
        response.status_code >=
        400
    ):

        raise HTTPException(
            status_code=502,

            detail=(
                f"Provider API lỗi "
                f"{response.status_code}: "
                f"{response.text[:4000]}"
            )
        )


    try:

        return response.json()

    except Exception:

        raise HTTPException(
            status_code=502,

            detail=(
                "Provider trả về dữ liệu "
                "không phải JSON hợp lệ."
            )
        )


async def download_to_base64(
    url: str,
    headers: Optional[dict] = None,
    default_mime:
        str = "application/octet-stream"
):

    async with httpx.AsyncClient(
        timeout=300.0,
        follow_redirects=True
    ) as client:

        response = await client.get(
            url,
            headers=headers or {}
        )


    if (
        response.status_code >=
        400
    ):

        raise HTTPException(
            status_code=502,

            detail=(
                "Không tải được file "
                f"từ provider. HTTP "
                f"{response.status_code}"
            )
        )


    mime_type = (
        response.headers
        .get(
            "content-type",
            default_mime
        )
        .split(
            ";",
            1
        )[0]
        .strip()
    )


    return (
        base64.b64encode(
            response.content
        ).decode(
            "utf-8"
        ),

        mime_type
    )


# =========================================================
# GOOGLE URL
# =========================================================

def google_root_url(
    base_url: str
) -> str:

    clean = (
        base_url or ""
    ).strip().rstrip("/")


    for suffix in (
        "/v1beta",
        "/v1"
    ):

        if clean.endswith(
            suffix
        ):

            clean = clean[
                :-len(
                    suffix
                )
            ]

            break


    return (
        clean
        or
        "https://generativelanguage.googleapis.com"
    )


# =========================================================
# TEXT - GOOGLE
# =========================================================

async def generate_google_text(
    cfg: dict,
    prompt: str
) -> str:

    root = google_root_url(
        cfg[
            "base_url"
        ]
    )


    model = (
        cfg[
            "model"
        ]
        .strip()
    )


    url = (
        f"{root}"
        f"/v1beta/models/"
        f"{model}"
        f":generateContent"
    )


    result = await request_json(
        "POST",

        url,

        cfg[
            "api_key"
        ],

        headers={
            "x-goog-api-key":
                cfg[
                    "api_key"
                ],

            "Content-Type":
                "application/json"
        },

        auth_bearer=False,

        json={
            "contents": [
                {
                    "role":
                        "user",

                    "parts": [
                        {
                            "text":
                                prompt
                        }
                    ]
                }
            ]
        }
    )


    text_parts = []


    for candidate in result.get(
        "candidates",
        []
    ):

        for part in (
            candidate
            .get(
                "content",
                {}
            )
            .get(
                "parts",
                []
            )
        ):

            text = part.get(
                "text"
            )


            if text:

                text_parts.append(
                    text
                )


    text = "\n".join(
        text_parts
    ).strip()


    if not text:

        raise HTTPException(
            status_code=502,

            detail=(
                "Gemini không trả về text."
            )
        )


    return text


# =========================================================
# TEXT - OPENAI
# =========================================================

async def generate_openai_text(
    cfg: dict,
    prompt: str
) -> str:

    base_url = (
        cfg[
            "base_url"
        ]
        .rstrip("/")
    )


    result = await request_json(
        "POST",

        f"{base_url}/responses",

        cfg[
            "api_key"
        ],

        json={
            "model":
                cfg[
                    "model"
                ],

            "input":
                prompt
        }
    )


    text_parts = []


    for output in result.get(
        "output",
        []
    ):

        for content in output.get(
            "content",
            []
        ):

            if (
                content.get(
                    "type"
                )
                ==
                "output_text"
                and
                content.get(
                    "text"
                )
            ):

                text_parts.append(
                    content[
                        "text"
                    ]
                )


    text = "\n".join(
        text_parts
    ).strip()


    if not text:

        raise HTTPException(
            status_code=502,

            detail=(
                "OpenAI không trả về text."
            )
        )


    return text


# =========================================================
# TEXT - OPENAI COMPATIBLE
# =========================================================

async def generate_openai_compatible_text(
    cfg: dict,
    prompt: str
) -> str:

    base_url = (
        cfg[
            "base_url"
        ]
        .rstrip("/")
    )


    result = await request_json(
        "POST",

        f"{base_url}/chat/completions",

        cfg[
            "api_key"
        ],

        json={
            "model":
                cfg[
                    "model"
                ],

            "messages": [
                {
                    "role":
                        "user",

                    "content":
                        prompt
                }
            ]
        }
    )


    try:

        content = (
            result[
                "choices"
            ][0][
                "message"
            ][
                "content"
            ]
        )


    except Exception as exc:

        raise HTTPException(
            status_code=502,

            detail=(
                "Provider TEXT trả format "
                "không tương thích: "
                f"{exc}"
            )
        )


    if isinstance(
        content,
        str
    ):

        return content


    if isinstance(
        content,
        list
    ):

        parts = []


        for item in content:

            if (
                isinstance(
                    item,
                    dict
                )
                and
                item.get(
                    "text"
                )
            ):

                parts.append(
                    item[
                        "text"
                    ]
                )


        return "\n".join(
            parts
        ).strip()


    return str(
        content
    )


# =========================================================
# TEXT ROUTER
# =========================================================

@app.post(
    "/api/ai/generate-text"
)
async def generate_text(
    data: GenerateTextRequest
):

    cfg = resolve_selected_config(
        "TEXT",
        data.model
    )


    provider = normalize_provider(
        cfg[
            "provider"
        ]
    )


    if provider in {
        "google",
        "gemini"
    }:

        text = await generate_google_text(
            cfg,
            data.prompt
        )


    elif provider in {
        "openai",
        "chatgpt"
    }:

        text = await generate_openai_text(
            cfg,
            data.prompt
        )


    else:

        text = await (
            generate_openai_compatible_text(
                cfg,
                data.prompt
            )
        )


    return {
        "text":
            text
    }


# =========================================================
# IMAGE HELPERS
# =========================================================

def normalize_aspect_ratio(
    value: str
) -> str:

    allowed = {
        "1:1",
        "1:4",
        "1:8",
        "2:3",
        "3:2",
        "3:4",
        "4:1",
        "4:3",
        "4:5",
        "5:4",
        "8:1",
        "9:16",
        "16:9",
        "21:9"
    }


    value = (
        value or "9:16"
    ).strip()


    return (
        value

        if value in allowed

        else "9:16"
    )


# =========================================================
# IMAGE - OPENAI
# =========================================================

async def generate_openai_image(
    cfg: dict,
    data: GenerateImageRequest
):

    base_url = (
        cfg[
            "base_url"
        ]
        .rstrip("/")
    )


    ratio = normalize_aspect_ratio(
        data.aspectRatio
    )


    if ratio == "1:1":

        size = "1024x1024"


    elif ratio in {
        "16:9",
        "3:2",
        "4:3",
        "5:4"
    }:

        size = "1536x1024"


    else:

        size = "1024x1536"


    result = await request_json(
        "POST",

        f"{base_url}/images/generations",

        cfg[
            "api_key"
        ],

        json={
            "model":
                cfg[
                    "model"
                ]
                .strip(),

            "prompt":
                data.prompt,

            "size":
                size,

            "quality":
                "auto",

            "output_format":
                "png"
        }
    )


    try:

        item = (
            result[
                "data"
            ][0]
        )


    except Exception as exc:

        raise HTTPException(
            status_code=502,

            detail=(
                "OpenAI Image response lỗi: "
                f"{exc}"
            )
        )


    b64 = (
        item.get(
            "b64_json"
        )
        or
        item.get(
            "base64"
        )
    )


    if b64:

        return {
            "base64":
                b64,

            "mimeType":
                "image/png",

            "mediaId":
                str(
                    uuid.uuid4()
                )
        }


    image_url = (
        item.get(
            "url"
        )
    )


    if image_url:

        (
            b64,
            mime_type
        ) = await download_to_base64(
            image_url,
            default_mime=
                "image/png"
        )


        return {
            "base64":
                b64,

            "mimeType":
                mime_type,

            "mediaId":
                str(
                    uuid.uuid4()
                )
        }


    raise HTTPException(
        status_code=502,

        detail=(
            "OpenAI Image không trả ảnh."
        )
    )


# =========================================================
# IMAGE - GOOGLE GEMINI
# =========================================================

async def generate_google_image(
    cfg: dict,
    data: GenerateImageRequest
):

    root = google_root_url(
        cfg[
            "base_url"
        ]
    )


    url = (
        f"{root}"
        f"/v1beta/interactions"
    )


    ratio = normalize_aspect_ratio(
        data.aspectRatio
    )


    inputs: list[
        dict[
            str,
            Any
        ]
    ] = []


    # -----------------------------------------------------
    # ẢNH THAM KHẢO
    # -----------------------------------------------------

    for reference in (
        data.referenceImages
    ):

        if (
            reference
            .base64
            .strip()
        ):

            inputs.append({
                "type":
                    "image",

                "data":
                    reference
                    .base64
                    .strip(),

                "mime_type":
                    (
                        reference
                        .mimeType
                        or
                        "image/jpeg"
                    )
            })


    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    inputs.append({
        "type":
            "text",

        "text":
            data.prompt
    })


    google_input: Any = (

        data.prompt

        if len(
            inputs
        ) == 1

        else inputs

    )


    # -----------------------------------------------------
    # QUAN TRỌNG:
    # Google endpoint hiện tại yêu cầu image/jpeg.
    # -----------------------------------------------------

    payload = {

        "model":
            cfg[
                "model"
            ]
            .strip(),

        "input":
            google_input,

        "response_format": {

            "type":
                "image",

            "mime_type":
                "image/jpeg",

            "aspect_ratio":
                ratio,

            "image_size":
                "1K"
        }
    }


    result = await request_json(
        "POST",

        url,

        cfg[
            "api_key"
        ],

        headers={
            "x-goog-api-key":
                cfg[
                    "api_key"
                ],

            "Content-Type":
                "application/json"
        },

        auth_bearer=False,

        json=payload
    )


    # -----------------------------------------------------
    # RESPONSE KIỂU 1:
    # output_image
    # -----------------------------------------------------

    output_image = (
        result.get(
            "output_image"
        )
        or
        result.get(
            "outputImage"
        )
    )


    if (
        isinstance(
            output_image,
            dict
        )
        and
        output_image.get(
            "data"
        )
    ):

        return {
            "base64":
                output_image[
                    "data"
                ],

            "mimeType":
                (
                    output_image.get(
                        "mime_type"
                    )
                    or
                    output_image.get(
                        "mimeType"
                    )
                    or
                    "image/jpeg"
                ),

            "mediaId":
                str(
                    uuid.uuid4()
                )
        }


    # -----------------------------------------------------
    # RESPONSE KIỂU 2:
    # steps[].content[]
    # -----------------------------------------------------

    for step in result.get(
        "steps",
        []
    ):

        for block in step.get(
            "content",
            []
        ):

            if (
                block.get(
                    "type"
                )
                ==
                "image"
                and
                block.get(
                    "data"
                )
            ):

                return {
                    "base64":
                        block[
                            "data"
                        ],

                    "mimeType":
                        (
                            block.get(
                                "mime_type"
                            )
                            or
                            block.get(
                                "mimeType"
                            )
                            or
                            "image/jpeg"
                        ),

                    "mediaId":
                        str(
                            uuid.uuid4()
                        )
                }


    raise HTTPException(
        status_code=502,

        detail=(
            "Google Gemini Image đã trả "
            "response nhưng không tìm thấy "
            "dữ liệu ảnh. Response: "
            f"{json.dumps(result, ensure_ascii=False)[:3000]}"
        )
    )


# =========================================================
# IMAGE - XAI / GROK
# =========================================================

async def generate_xai_image(
    cfg: dict,
    data: GenerateImageRequest
):

    base_url = (
        cfg[
            "base_url"
        ]
        .rstrip("/")
    )


    result = await request_json(
        "POST",

        f"{base_url}/images/generations",

        cfg[
            "api_key"
        ],

        json={
            "model":
                cfg[
                    "model"
                ]
                .strip(),

            "prompt":
                data.prompt,

            "n":
                1
        }
    )


    try:

        item = (
            result[
                "data"
            ][0]
        )


    except Exception as exc:

        raise HTTPException(
            status_code=502,

            detail=(
                "xAI Image response lỗi: "
                f"{exc}"
            )
        )


    b64 = (
        item.get(
            "b64_json"
        )
        or
        item.get(
            "base64"
        )
    )


    if b64:

        return {
            "base64":
                b64,

            "mimeType":
                "image/png",

            "mediaId":
                str(
                    uuid.uuid4()
                )
        }


    image_url = (
        item.get(
            "url"
        )
    )


    if not image_url:

        raise HTTPException(
            status_code=502,

            detail=(
                "xAI Image không trả "
                "base64 hoặc URL."
            )
        )


    (
        b64,
        mime_type
    ) = await download_to_base64(
        image_url,
        default_mime=
            "image/png"
    )


    return {
        "base64":
            b64,

        "mimeType":
            mime_type,

        "mediaId":
            str(
                uuid.uuid4()
            )
    }


# =========================================================
# IMAGE ROUTER
# =========================================================

@app.post(
    "/api/ai/generate-image"
)
async def generate_image(
    data: GenerateImageRequest
):

    cfg = resolve_selected_config(
        "IMAGE",
        data.model
    )


    provider = normalize_provider(
        cfg[
            "provider"
        ]
    )


    if provider in {
        "google",
        "gemini"
    }:

        return await generate_google_image(
            cfg,
            data
        )


    if provider in {
        "openai",
        "chatgpt"
    }:

        return await generate_openai_image(
            cfg,
            data
        )


    if provider in {
        "xai",
        "grok"
    }:

        return await generate_xai_image(
            cfg,
            data
        )


    try:

        return await generate_openai_image(
            cfg,
            data
        )


    except HTTPException as exc:

        raise HTTPException(
            status_code=exc.status_code,

            detail=(
                f"IMAGE provider "
                f"'{cfg['provider']}' "
                "chưa có adapter riêng và "
                "adapter OpenAI-compatible "
                "cũng thất bại. "
                f"{exc.detail}"
            )
        )


# =========================================================
# VIDEO - XAI / GROK
# =========================================================

async def generate_xai_video(
    cfg: dict,
    data: GenerateVideoRequest
):

    base_url = (
        cfg[
            "base_url"
        ]
        .rstrip("/")
    )


    duration = int(
        data.durationSeconds
        or 8
    )


    duration = max(
        1,
        min(
            duration,
            15
        )
    )


    payload: dict[
        str,
        Any
    ] = {

        "model":
            cfg[
                "model"
            ]
            .strip(),

        "prompt":
            data.prompt,

        "duration":
            duration,

        "aspect_ratio":
            (
                "9:16"

                if data.aspectRatio
                ==
                "9:16"

                else "16:9"
            ),

        "resolution":
            (
                data.resolution

                if data.resolution
                in {
                    "480p",
                    "720p"
                }

                else "720p"
            )
    }


    if data.firstFrameBase64:

        mime = (
            data.firstFrameMimeType
            or
            "image/png"
        )


        payload[
            "image"
        ] = {

            "url":
                (
                    f"data:{mime};"
                    f"base64,"
                    f"{data.firstFrameBase64}"
                )
        }


    start_result = await request_json(
        "POST",

        f"{base_url}/videos/generations",

        cfg[
            "api_key"
        ],

        json=payload
    )


    request_id = (
        start_result.get(
            "request_id"
        )
    )


    if not request_id:

        raise HTTPException(
            status_code=502,

            detail=(
                "xAI Video không trả "
                "request_id. "
                f"{start_result}"
            )
        )


    deadline = (
        time.time()
        +
        900
    )


    while (
        time.time()
        <
        deadline
    ):

        await asyncio.sleep(
            5
        )


        status = await request_json(
            "GET",

            f"{base_url}/videos/{request_id}",

            cfg[
                "api_key"
            ],

            timeout=120.0
        )


        state = (
            status.get(
                "status"
            )
        )


        if state == "pending":

            continue


        if state in {
            "failed",
            "expired"
        }:

            raise HTTPException(
                status_code=502,

                detail=(
                    f"xAI Video {state}: "
                    f"{json.dumps(status, ensure_ascii=False)[:3000]}"
                )
            )


        if state == "done":

            video = (
                status.get(
                    "video"
                )
                or
                {}
            )


            video_url = (
                video.get(
                    "url"
                )
            )


            if not video_url:

                raise HTTPException(
                    status_code=502,

                    detail=(
                        "xAI Video không trả URL video."
                    )
                )


            (
                b64,
                mime_type
            ) = await download_to_base64(
                video_url,
                default_mime=
                    "video/mp4"
            )


            return {
                "base64":
                    b64,

                "mimeType":
                    (
                        mime_type
                        or
                        "video/mp4"
                    ),

                "mediaId":
                    str(
                        uuid.uuid4()
                    ),

                "sourceImageId":
                    data.firstFrameId
            }


    raise HTTPException(
        status_code=504,

        detail=(
            "xAI Video timeout sau 15 phút."
        )
    )


# =========================================================
# VIDEO - GOOGLE VEO
# =========================================================

async def generate_google_veo_video(
    cfg: dict,
    data: GenerateVideoRequest
):

    root = google_root_url(
        cfg[
            "base_url"
        ]
    )


    model = (
        cfg[
            "model"
        ]
        .strip()
    )


    start_url = (
        f"{root}"
        f"/v1beta/models/"
        f"{model}"
        f":predictLongRunning"
    )


    instance: dict[
        str,
        Any
    ] = {
        "prompt":
            data.prompt
    }


    if data.firstFrameBase64:

        instance[
            "image"
        ] = {

            "bytesBase64Encoded":
                data.firstFrameBase64,

            "mimeType":
                (
                    data.firstFrameMimeType
                    or
                    "image/png"
                )
        }


    duration = int(
        data.durationSeconds
        or 8
    )


    duration = max(
        5,
        min(
            duration,
            8
        )
    )


    parameters = {

        "aspectRatio":
            (
                "9:16"

                if data.aspectRatio
                ==
                "9:16"

                else "16:9"
            ),

        "durationSeconds":
            duration,

        "resolution":
            (
                data.resolution

                if data.resolution
                in {
                    "720p",
                    "1080p"
                }

                else "720p"
            ),

        "numberOfVideos":
            1
    }


    start_result = await request_json(
        "POST",

        start_url,

        cfg[
            "api_key"
        ],

        headers={
            "x-goog-api-key":
                cfg[
                    "api_key"
                ],

            "Content-Type":
                "application/json"
        },

        auth_bearer=False,

        json={
            "instances": [
                instance
            ],

            "parameters":
                parameters
        }
    )


    operation_name = (
        start_result.get(
            "name"
        )
    )


    if not operation_name:

        raise HTTPException(
            status_code=502,

            detail=(
                "Google Veo không trả "
                "operation name. "
                f"{start_result}"
            )
        )


    poll_url = (
        f"{root}"
        f"/v1beta/"
        f"{operation_name.lstrip('/')}"
    )


    deadline = (
        time.time()
        +
        900
    )


    while (
        time.time()
        <
        deadline
    ):

        await asyncio.sleep(
            10
        )


        status = await request_json(
            "GET",

            poll_url,

            cfg[
                "api_key"
            ],

            headers={
                "x-goog-api-key":
                    cfg[
                        "api_key"
                    ]
            },

            auth_bearer=False,

            timeout=120.0
        )


        if not status.get(
            "done"
        ):

            continue


        if status.get(
            "error"
        ):

            raise HTTPException(
                status_code=502,

                detail=(
                    "Google Veo generation lỗi: "
                    f"{json.dumps(status['error'], ensure_ascii=False)}"
                )
            )


        response = (
            status.get(
                "response"
            )
            or
            {}
        )


        generated = (
            response
            .get(
                "generateVideoResponse",
                {}
            )
            .get(
                "generatedSamples",
                []
            )
        )


        if not generated:

            raise HTTPException(
                status_code=502,

                detail=(
                    "Google Veo hoàn tất nhưng "
                    "không tìm thấy generatedSamples. "
                    f"{json.dumps(status, ensure_ascii=False)[:3000]}"
                )
            )


        video_info = (
            generated[
                0
            ]
            .get(
                "video",
                {}
            )
        )


        inline_data = (
            video_info.get(
                "inlineData"
            )
            or
            video_info.get(
                "inline_data"
            )
        )


        if (
            isinstance(
                inline_data,
                dict
            )
            and
            inline_data.get(
                "data"
            )
        ):

            return {
                "base64":
                    inline_data[
                        "data"
                    ],

                "mimeType":
                    (
                        inline_data.get(
                            "mimeType"
                        )
                        or
                        inline_data.get(
                            "mime_type"
                        )
                        or
                        "video/mp4"
                    ),

                "mediaId":
                    str(
                        uuid.uuid4()
                    ),

                "sourceImageId":
                    data.firstFrameId
            }


        video_uri = (
            video_info.get(
                "uri"
            )
        )


        if not video_uri:

            raise HTTPException(
                status_code=502,

                detail=(
                    "Google Veo không trả video URI."
                )
            )


        (
            b64,
            mime_type
        ) = await download_to_base64(
            video_uri,

            headers={
                "x-goog-api-key":
                    cfg[
                        "api_key"
                    ]
            },

            default_mime=
                "video/mp4"
        )


        return {
            "base64":
                b64,

            "mimeType":
                (
                    mime_type
                    or
                    "video/mp4"
                ),

            "mediaId":
                str(
                    uuid.uuid4()
                ),

            "sourceImageId":
                data.firstFrameId
        }


    raise HTTPException(
        status_code=504,

        detail=(
            "Google Veo timeout sau 15 phút."
        )
    )


# =========================================================
# VIDEO ROUTER
# =========================================================

@app.post(
    "/api/ai/generate-video"
)
async def generate_video(
    data: GenerateVideoRequest
):

    cfg = resolve_selected_config(
        "VIDEO",
        data.model
    )


    provider = normalize_provider(
        cfg[
            "provider"
        ]
    )


    if provider in {
        "google",
        "gemini"
    }:

        return await generate_google_veo_video(
            cfg,
            data
        )


    if provider in {
        "xai",
        "grok"
    }:

        return await generate_xai_video(
            cfg,
            data
        )


    raise HTTPException(
        status_code=400,

        detail=(
            f"VIDEO provider "
            f"'{cfg['provider']}' "
            "chưa có adapter. "
            "Hiện backend hỗ trợ "
            "Google/Veo và xAI/Grok."
        )
    )


# =========================================================
# START DIRECTLY
# =========================================================

if __name__ == "__main__":

    import uvicorn


    uvicorn.run(
        "main:app",

        host=
            "127.0.0.1",

        port=
            8000,

        reload=
            True
    )