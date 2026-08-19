import time
import uuid
import json
from typing import List
from fastapi import APIRouter, HTTPException
from app.core.database import get_db
from app.models.jobs import JobCreateRequest, JobResponse

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.post("", response_model=JobResponse)
def enqueue_job(request: JobCreateRequest):
    conn = get_db()
    try:
        job_id = str(uuid.uuid4())
        now = int(time.time() * 1000)
        
        payload_json = json.dumps(request.payload) if request.payload else "{}"
        conn.execute("""
            INSERT INTO jobs (id, row_id, job_type, payload, status, retry_count, max_retries, error, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'PENDING', 0, 3, NULL, ?, ?)
        """, (job_id, request.row_id, request.job_type, payload_json, now, now))
        conn.commit()
        
        cursor = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        return dict(row)
    finally:
        conn.close()

@router.get("", response_model=List[JobResponse])
def get_jobs(row_id: str = None, status: str = None):
    conn = get_db()
    try:
        query = "SELECT * FROM jobs"
        params = []
        conditions = []
        if row_id:
            conditions.append("row_id = ?")
            params.append(row_id)
        if status:
            conditions.append("status = ?")
            params.append(status)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY created_at DESC"
        
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    conn = get_db()
    try:
        now = int(time.time() * 1000)
        conn.execute("""
            UPDATE jobs SET status = 'CANCELLED', updated_at = ?
            WHERE id = ? AND status IN ('PENDING', 'RUNNING')
        """, (now, job_id))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()

@router.post("/{job_id}/retry")
def retry_job(job_id: str):
    conn = get_db()
    try:
        now = int(time.time() * 1000)
        conn.execute("""
            UPDATE jobs SET status = 'PENDING', retry_count = 0, error = NULL, updated_at = ?
            WHERE id = ? AND status IN ('FAILED', 'CANCELLED')
        """, (now, job_id))
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()
