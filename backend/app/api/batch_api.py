import time
import uuid
import csv
import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.database import get_db

router = APIRouter(prefix="/api/batch", tags=["Batch"])

@router.post("/import")
async def import_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    content = await file.read()
    try:
        text = content.decode('utf-8-sig') # Handle UTF-8 with BOM commonly exported by Excel
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a UTF-8 CSV.")
        
    reader = csv.DictReader(io.StringIO(text))
    
    conn = get_db()
    try:
        now = int(time.time() * 1000)
        imported_count = 0
        
        for row in reader:
            row_id = str(uuid.uuid4())
            
            row_data = {
                "id": row_id,
                "stt": row.get("stt", str(imported_count + 1).zfill(3)),
                "characterName": row.get("characterName", ""),
                "imagePrompt": row.get("imagePrompt", ""),
                "captionInstruction": row.get("captionInstruction", ""),
                "referenceImages": [],
                "imageVersions": [],
                "currentImageIndex": -1,
                "captionSample": "",
                "captionPreset": "",
                "captionResult": "",
                "videoPrompt": row.get("videoPrompt", ""),
                "videoVersions": [],
                "currentVideoIndex": -1,
                "savePath": "",
                "isDone": False,
                "status": "IDLE",
                "error": "",
                "createdAt": now
            }
            
            conn.execute("""
                INSERT INTO workflow_state (table_name, id, data_json, updated_at)
                VALUES (?, ?, ?, ?)
            """, ("production", row_id, json.dumps(row_data), now))
            
            imported_count += 1
            
        conn.commit()
        return {"status": "ok", "imported": imported_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
