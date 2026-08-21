from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.ai.audio import router as audio_router

router = APIRouter(prefix="/api/tts", tags=["TTS"])


class TTSRequest(BaseModel):
    text: str
    voice: str = "vi-VN-HoaiMyNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"


@router.post("/generate")
async def generate_tts(data: TTSRequest):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Văn bản không được để trống.")
    return await audio_router.generate_audio(
        data.text,
        voice=data.voice,
        rate=data.rate,
        pitch=data.pitch
    )
