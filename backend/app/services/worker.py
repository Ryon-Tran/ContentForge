import asyncio
import time
import httpx
import json
import uuid
from app.core.database import get_db

CONCURRENCY_LIMIT = 3
POLL_INTERVAL = 2 # seconds

semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

async def process_job(job_id: str, row_id: str, job_type: str, payload: dict):
    conn = get_db()
    try:
        now = int(time.time() * 1000)
        conn.execute("UPDATE jobs SET status = 'RUNNING', updated_at = ? WHERE id = ?", (now, job_id))
        conn.commit()
        
        print(f"[Worker] Started job {job_id} ({job_type})")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            endpoint = ""
            if job_type == 'IMAGE_GEN':
                endpoint = "http://127.0.0.1:8000/api/ai/generate-image"
            elif job_type == 'VIDEO_GEN':
                endpoint = "http://127.0.0.1:8000/api/ai/generate-video"
            elif job_type == 'CAPTION_GEN':
                endpoint = "http://127.0.0.1:8000/api/ai/generate-text"
            else:
                raise ValueError(f"Unknown job type: {job_type}")
                
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 429:
                raise Exception("Rate limit exceeded (429). Will retry.")
            
            response.raise_for_status()
            
            # The AI generation endpoint returns a response (like Base64 or Video URL)
            # In a full implementation, we would update the row_id in workflow_state with this result.
            # But the AI APIs currently just return the data, they don't save to the DB themselves.
            # For now, we simulate saving to DB or we expect the frontend to fetch the job result.
            # Actually, to truly replace the frontend, the worker must update the row.
            
            result_data = response.json()
            
            row_record = conn.execute("SELECT table_name, data_json FROM workflow_state WHERE id = ?", (row_id,)).fetchone()
            if row_record:
                data = json.loads(row_record["data_json"])
                
                if job_type == 'IMAGE_GEN':
                    new_version = {
                        "id": str(uuid.uuid4()),
                        "base64": result_data.get("base64", ""),
                        "mimeType": result_data.get("mimeType", ""),
                        "mediaId": result_data.get("mediaId", str(uuid.uuid4())),
                        "createdAt": int(time.time() * 1000)
                    }
                    if "imageVersions" not in data:
                        data["imageVersions"] = []
                    data["imageVersions"].append(new_version)
                    data["currentImageIndex"] = len(data["imageVersions"]) - 1
                    
                elif job_type == 'VIDEO_GEN':
                    new_version = {
                        "id": str(uuid.uuid4()),
                        "base64": result_data.get("base64", ""),
                        "mimeType": result_data.get("mimeType", ""),
                        "mediaId": result_data.get("mediaId", str(uuid.uuid4())),
                        "sourceImageId": payload.get("firstFrameId", ""),
                        "createdAt": int(time.time() * 1000)
                    }
                    if "videoVersions" not in data:
                        data["videoVersions"] = []
                    data["videoVersions"].append(new_version)
                    data["currentVideoIndex"] = len(data["videoVersions"]) - 1
                    
                elif job_type == 'CAPTION_GEN':
                    data["captionResult"] = result_data.get("text", "")
                    
                conn.execute("UPDATE workflow_state SET data_json = ?, updated_at = ? WHERE id = ?", (json.dumps(data), int(time.time() * 1000), row_id))
            
            # Mark as DONE
            now = int(time.time() * 1000)
            conn.execute("UPDATE jobs SET status = 'DONE', updated_at = ? WHERE id = ?", (now, job_id))
            conn.commit()
            print(f"[Worker] Finished job {job_id}")
        
    except Exception as e:
        now = int(time.time() * 1000)
        conn.execute("UPDATE jobs SET status = 'FAILED', error = ?, updated_at = ? WHERE id = ?", (str(e), now, job_id))
        conn.commit()
        print(f"[Worker] Failed job {job_id}: {e}")
    finally:
        conn.close()

async def worker_loop():
    print("[Worker] Starting Job Queue Worker Loop...")
    
    conn = get_db()
    try:
        now = int(time.time() * 1000)
        conn.execute("UPDATE jobs SET status = 'PENDING', updated_at = ? WHERE status = 'RUNNING'", (now,))
        conn.commit()
        print("[Worker] Recovered RUNNING jobs to PENDING.")
    except Exception as e:
        print(f"[Worker] Failed to recover jobs: {e}")
    finally:
        conn.close()

    while True:
        try:
            conn = get_db()
            cursor = conn.execute("SELECT id, row_id, job_type, payload FROM jobs WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 5")
            pending_jobs = cursor.fetchall()
            conn.close()
            
            for job in pending_jobs:
                if semaphore.locked():
                    break
                    
                await semaphore.acquire()
                
                job_id = job["id"]
                row_id = job["row_id"]
                job_type = job["job_type"]
                payload_str = job["payload"]
                payload = json.loads(payload_str) if payload_str else {}
                
                async def run_task(j_id, r_id, j_type, j_payload):
                    try:
                        await process_job(j_id, r_id, j_type, j_payload)
                    finally:
                        semaphore.release()
                        
                asyncio.create_task(run_task(job_id, row_id, job_type, payload))
                
        except Exception as e:
            print(f"[Worker Loop Error] {e}")
            
        await asyncio.sleep(POLL_INTERVAL)
