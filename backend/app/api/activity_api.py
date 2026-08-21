import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.models.schemas import ActivityCreateRequest, ActivityUpdateRequest

router = APIRouter(prefix="/api/activity", tags=["Activity"])


def normalize_activity(activity: dict, existing: Optional[dict] = None) -> dict:
    now = int(time.time() * 1000)
    result = dict(existing or {})
    result.update(activity or {})

    if not result.get("id"):
        result["id"] = str(uuid.uuid4())

    if not result.get("createdAt"):
        result["createdAt"] = existing.get("createdAt") if existing else now

    result["updatedAt"] = now
    result.setdefault("module", "SYSTEM")
    result.setdefault("type", "OTHER")
    result.setdefault("status", "INFO")
    if result.get("message") is None:
        result["message"] = ""

    return result


@router.post("")
async def create_activity(data: ActivityCreateRequest):
    activity = normalize_activity(data.activity)
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO activity_logs (id, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
            """,
            (
                activity["id"],
                json.dumps(activity, ensure_ascii=False),
                int(activity["createdAt"]),
                int(activity["updatedAt"]),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return {"activity": activity}


@router.get("")
async def list_activity():
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT data_json FROM activity_logs ORDER BY created_at DESC
            """
        ).fetchall()
    finally:
        conn.close()

    activities = []
    for row in rows:
        try:
            activities.append(json.loads(row["data_json"]))
        except Exception:
            pass

    return {"activities": activities}


@router.put("/{activity_id}")
async def update_activity(activity_id: str, data: ActivityUpdateRequest):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT data_json FROM activity_logs WHERE id = ?", (activity_id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử hoạt động")

        try:
            current = json.loads(row["data_json"])
        except Exception:
            current = {"id": activity_id}

        patch = dict(data.patch or {})
        patch.pop("id", None)

        activity = normalize_activity(patch, existing=current)
        activity["id"] = activity_id

        conn.execute(
            """
            UPDATE activity_logs
            SET data_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                json.dumps(activity, ensure_ascii=False),
                int(activity["updatedAt"]),
                activity_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return {"activity": activity}


@router.delete("/{activity_id}")
async def delete_activity(activity_id: str):
    conn = get_db()
    try:
        cursor = conn.execute(
            "DELETE FROM activity_logs WHERE id = ?", (activity_id,)
        )
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử hoạt động")
    finally:
        conn.close()

    return {"success": True}


@router.delete("")
async def clear_activity():
    conn = get_db()
    try:
        conn.execute("DELETE FROM activity_logs")
        conn.commit()
    finally:
        conn.close()

    return {"success": True}
