import base64
import json
import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.models.schemas import SaveFileRequest

router = APIRouter(prefix="/api/files", tags=["Files"])


class ExportBundleRequest(BaseModel):
    """
    Xuất trọn gói toàn bộ tài nguyên của 1 dòng kịch bản:
    - 001.png (ảnh đại diện)
    - 001.txt (caption kịch bản)
    - 001.mp3 (audio giọng đọc nếu có)
    - 001.mp4 (video nếu có)
    - 001_meta.json (thông tin metadata)
    """
    stt: str = "001"
    savePath: str
    imageVersion: Optional[dict] = None  # { base64, mimeType }
    captionText: Optional[str] = None
    audioBase64: Optional[str] = None
    videoVersion: Optional[dict] = None  # { base64, mimeType }
    metadata: Optional[dict] = Field(default_factory=dict)


def _resolve_dir(raw_path: str) -> str:
    cleaned = raw_path.strip()
    if not cleaned:
        raise ValueError("Thư mục lưu đang trống.")
    directory = os.path.abspath(os.path.expandvars(os.path.expanduser(cleaned)))
    os.makedirs(directory, exist_ok=True)
    if not os.access(directory, os.W_OK):
        raise PermissionError(f"Không có quyền ghi vào thư mục: {directory}")
    return directory


@router.post("/save-file")
async def save_file(data: SaveFileRequest):
    try:
        directory = _resolve_dir(data.path)
        filename = os.path.basename(data.filename.strip())
        if not filename:
            raise ValueError("Tên file không hợp lệ.")

        file_path = os.path.join(directory, filename)

        try:
            raw = base64.b64decode(data.base64, validate=True)
        except Exception as exc:
            raise ValueError(f"Dữ liệu base64 không hợp lệ: {exc}")

        with open(file_path, "wb") as f:
            f.write(raw)

        return {
            "success": True,
            "path": file_path,
            "filename": filename,
            "overwritten": True,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/export-bundle")
async def export_bundle(data: ExportBundleRequest):
    """
    Xuất trọn gói 1 chạm tất cả file của STT vào thư mục đích.
    """
    try:
        directory = _resolve_dir(data.savePath)
        stt = data.stt.strip().zfill(3)
        saved_files = []

        # 1. Lưu Ảnh (.png / .jpg)
        if data.imageVersion and data.imageVersion.get("base64"):
            img_b64 = data.imageVersion["base64"]
            img_ext = "png" if "png" in (data.imageVersion.get("mimeType") or "") else "jpg"
            img_name = f"{stt}.{img_ext}"
            img_path = os.path.join(directory, img_name)
            with open(img_path, "wb") as f:
                f.write(base64.b64decode(img_b64))
            saved_files.append(img_name)

        # 2. Lưu Caption (.txt)
        if data.captionText:
            txt_name = f"{stt}.txt"
            txt_path = os.path.join(directory, txt_name)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(data.captionText)
            saved_files.append(txt_name)

        # 3. Lưu Audio (.mp3)
        if data.audioBase64:
            audio_name = f"{stt}.mp3"
            audio_path = os.path.join(directory, audio_name)
            with open(audio_path, "wb") as f:
                f.write(base64.b64decode(data.audioBase64))
            saved_files.append(audio_name)

        # 4. Lưu Video (.mp4)
        if data.videoVersion and data.videoVersion.get("base64"):
            vid_b64 = data.videoVersion["base64"]
            vid_name = f"{stt}.mp4"
            vid_path = os.path.join(directory, vid_name)
            with open(vid_path, "wb") as f:
                f.write(base64.b64decode(vid_b64))
            saved_files.append(vid_name)

        # 5. Lưu Metadata (.json)
        if data.metadata:
            meta_name = f"{stt}_meta.json"
            meta_path = os.path.join(directory, meta_name)
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(data.metadata, f, ensure_ascii=False, indent=2)
            saved_files.append(meta_name)

        return {
            "success": True,
            "directory": directory,
            "stt": stt,
            "savedFiles": saved_files,
            "count": len(saved_files),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Lỗi xuất file bundle: {exc}")
