import json
import time

from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db
from app.models.schemas import SaveRowRequest, DeleteRowRequest

router = APIRouter(prefix="/api/storage", tags=["Storage"])


def validate_storage_table(table: str):
    if table not in {"production", "news", "video"}:
        raise HTTPException(status_code=400, detail="Table không hợp lệ. Chỉ chấp nhận: production, news, video")


@router.post("/save-row")
async def save_row(data: SaveRowRequest):
    validate_storage_table(data.table)
    row_id = data.row.get("id")

    if not row_id:
        raise HTTPException(status_code=400, detail="Row thiếu id")

    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO workflow_state (table_name, id, data_json, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(table_name, id) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = excluded.updated_at
            """,
            (
                data.table,
                row_id,
                json.dumps(data.row, ensure_ascii=False),
                int(time.time() * 1000),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return {"success": True}


@router.get("/load-rows")
async def load_rows(table: str = Query(...)):
    validate_storage_table(table)
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT data_json FROM workflow_state
            WHERE table_name = ?
            ORDER BY updated_at ASC
            """,
            (table,),
        ).fetchall()
    finally:
        conn.close()

    result = []
    for row in rows:
        try:
            result.append(json.loads(row["data_json"]))
        except Exception:
            pass

    return {"rows": result}


@router.get("/load-row")
async def load_row(id: str = Query(...)):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT data_json FROM workflow_state WHERE id = ?", (id,)
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Row not found")

        return {"row": json.loads(row["data_json"])}
    finally:
        conn.close()


@router.post("/delete-row")
async def delete_row(data: DeleteRowRequest):
    validate_storage_table(data.table)
    conn = get_db()
    try:
        conn.execute(
            "DELETE FROM workflow_state WHERE table_name = ? AND id = ?",
            (data.table, data.id),
        )
        conn.commit()
    finally:
        conn.close()

    return {"success": True}
