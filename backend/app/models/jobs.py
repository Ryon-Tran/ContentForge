from typing import Optional, Any
from pydantic import BaseModel

class JobCreateRequest(BaseModel):
    row_id: str
    job_type: str # IMAGE_GEN, VIDEO_GEN, CAPTION_GEN
    payload: Optional[dict] = None # Optional parameters for the job

class JobResponse(BaseModel):
    id: str
    row_id: str
    job_type: str
    status: str
    retry_count: int
    max_retries: int
    error: Optional[str] = None
    created_at: int
    updated_at: int

class JobStatusUpdate(BaseModel):
    status: str
    error: Optional[str] = None
