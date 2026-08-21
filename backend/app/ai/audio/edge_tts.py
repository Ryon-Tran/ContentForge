"""
Audio / TTS Adapter — Microsoft Edge TTS (Miễn phí 100%, không cần API key).

Hỗ trợ các giọng tiếng Việt chất lượng cao:
- vi-VN-HoaiMyNeural (Nữ - Truyền cảm)
- vi-VN-NamMinhNeural (Nam - Trầm ấm)
- en-US-AriaNeural (Nữ tiếng Anh)
- en-US-GuyNeural (Nam tiếng Anh)
"""
import base64
import subprocess
import sys
import tempfile
import os
import uuid
import httpx
from fastapi import HTTPException


async def generate_edge_tts(text: str, voice: str = "vi-VN-HoaiMyNeural", rate: str = "+0%", pitch: str = "+0Hz") -> dict:
    if not text.strip():
        raise HTTPException(status_code=400, detail="Văn bản cần đọc không được để trống.")

    # Dùng edge-tts python module nếu có sẵn, hoặc request qua Edge TTS endpoint
    # Thử import edge_tts library
    try:
        import edge_tts  # type: ignore
        communicate = edge_tts.Communicate(text, voice=voice, rate=rate, pitch=pitch)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tmp_path = tmp_file.name

        await communicate.save(tmp_path)
        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()
        os.remove(tmp_path)

        b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {
            "base64": b64,
            "mimeType": "audio/mp3",
            "mediaId": str(uuid.uuid4()),
            "voice": voice,
        }
    except ImportError:
        # Nếu chưa cài edge-tts package, thử gọi qua CLI hoặc trả base64 giả lập / online fallback
        pass

    # Fallback: Gọi script subprocess nếu edge-playback/edge-tts CLI có trong path
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tmp_path = tmp_file.name

        cmd = [
            sys.executable, "-m", "edge_tts",
            "--text", text,
            "--voice", voice,
            "--write-media", tmp_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and os.path.exists(tmp_path):
            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()
            os.remove(tmp_path)
            b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return {
                "base64": b64,
                "mimeType": "audio/mp3",
                "mediaId": str(uuid.uuid4()),
                "voice": voice,
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=500,
        detail="Chưa cài đặt module 'edge-tts'. Chạy 'pip install edge-tts' trong backend virtualenv để sử dụng TTS."
    )
