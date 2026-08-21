"""
Pipeline Service — Điều phối chạy tự động toàn chuỗi (One-click Full Row Pipeline).

Quy trình:
1. Tạo Caption (Text AI) từ prompt / instruction
2. Tạo Giọng đọc TTS (Audio AI) từ caption
3. Tạo Ảnh (Image AI) từ image prompt & ảnh tham khảo
4. Tạo Video (Video AI) từ ảnh đã sinh + prompt chuyển động
5. Tự động lưu Bundle vào thư mục savePath nếu có
"""
import asyncio
import json
import time
import uuid
import os
from typing import Optional

from app.core.database import get_db
from app.api.config_api import get_ai_config
from app.models.schemas import GenerateTextRequest, GenerateImageRequest, GenerateVideoRequest
from app.ai.text import router as text_router
from app.ai.image import router as image_router
from app.ai.video import router as video_router
from app.ai.audio import router as audio_router
from app.api.files_api import export_bundle, ExportBundleRequest


def _cfg_with_extra(cfg: dict) -> dict:
    raw = cfg.get("extra_config") or "{}"
    try:
        extra = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        extra = {}
    return {**cfg, "extra_config": extra}


async def run_full_row_pipeline(
    table_name: str,
    row_id: str,
    auto_tts: bool = True,
    auto_video: bool = True,
    auto_export: bool = True,
) -> dict:
    conn = get_db()
    try:
        record = conn.execute(
            "SELECT data_json FROM workflow_state WHERE table_name = ? AND id = ?",
            (table_name, row_id)
        ).fetchone()

        if not record:
            raise ValueError(f"Không tìm thấy row {row_id} trong {table_name}")

        data = json.loads(record["data_json"])
    finally:
        conn.close()

    logs = []
    stt = data.get("stt", "001")
    now = int(time.time() * 1000)

    # 1. Sinh Caption nếu có instruction hoặc prompt
    caption_instruction = data.get("captionInstruction") or data.get("imagePrompt") or ""
    if caption_instruction and not data.get("captionResult"):
        try:
            text_cfg = await asyncio.to_thread(get_ai_config, "TEXT", None)
            text_cfg = _cfg_with_extra(text_cfg)
            prompt = f"{caption_instruction}\nHãy viết nội dung/caption ngắn gọn, cuốn hút."
            caption = await text_router.generate_text(text_cfg, prompt)
            data["captionResult"] = caption
            logs.append(f"[{stt}] Đã sinh Caption thành công.")
        except Exception as e:
            logs.append(f"[{stt}] Lỗi sinh Caption: {e}")

    # 2. Sinh Audio TTS từ Caption nếu auto_tts bật
    if auto_tts and data.get("captionResult"):
        try:
            tts_res = await audio_router.generate_audio(data["captionResult"])
            data["audioVersion"] = tts_res
            logs.append(f"[{stt}] Đã sinh Audio TTS thành công.")
        except Exception as e:
            logs.append(f"[{stt}] Lỗi sinh TTS: {e}")

    # 3. Sinh Ảnh nếu có imagePrompt
    image_prompt = data.get("imagePrompt")
    if image_prompt:
        try:
            img_cfg = await asyncio.to_thread(get_ai_config, "IMAGE", None)
            img_cfg = _cfg_with_extra(img_cfg)
            req = GenerateImageRequest(
                prompt=image_prompt,
                aspectRatio=data.get("aspectRatio", "9:16"),
            )
            img_res = await image_router.generate_image(img_cfg, req)
            new_img = {
                "id": str(uuid.uuid4()),
                "base64": img_res["base64"],
                "mimeType": img_res["mimeType"],
                "mediaId": img_res.get("mediaId", str(uuid.uuid4())),
                "createdAt": now,
            }
            data.setdefault("imageVersions", []).append(new_img)
            data["currentImageIndex"] = len(data["imageVersions"]) - 1
            logs.append(f"[{stt}] Đã sinh Ảnh thành công.")
        except Exception as e:
            logs.append(f"[{stt}] Lỗi sinh Ảnh: {e}")

    # 4. Sinh Video nếu có videoPrompt và ảnh vừa tạo
    if auto_video and (data.get("videoPrompt") or data.get("imagePrompt")):
        current_img_idx = data.get("currentImageIndex", -1)
        selected_img = (
            data["imageVersions"][current_img_idx]
            if 0 <= current_img_idx < len(data.get("imageVersions", []))
            else None
        )

        try:
            vid_cfg = await asyncio.to_thread(get_ai_config, "VIDEO", None)
            vid_cfg = _cfg_with_extra(vid_cfg)
            vid_req = GenerateVideoRequest(
                prompt=data.get("videoPrompt") or data.get("imagePrompt") or "camera pan smooth",
                firstFrameId=selected_img["id"] if selected_img else "",
                firstFrameBase64=selected_img["base64"] if selected_img else None,
                firstFrameMimeType=selected_img["mimeType"] if selected_img else None,
                aspectRatio=data.get("aspectRatio", "9:16"),
                durationSeconds=8,
                resolution="720p",
            )
            vid_res = await video_router.generate_video(vid_cfg, vid_req)
            new_vid = {
                "id": str(uuid.uuid4()),
                "base64": vid_res["base64"],
                "mimeType": vid_res["mimeType"],
                "mediaId": vid_res.get("mediaId", str(uuid.uuid4())),
                "sourceImageId": selected_img["id"] if selected_img else "",
                "createdAt": now,
            }
            data.setdefault("videoVersions", []).append(new_vid)
            data["currentVideoIndex"] = len(data["videoVersions"]) - 1
            logs.append(f"[{stt}] Đã sinh Video thành công.")
        except Exception as e:
            logs.append(f"[{stt}] Lỗi sinh Video: {e}")

    # 5. Tự động xuất Bundle nếu có savePath
    if auto_export and data.get("savePath"):
        try:
            cur_img = (
                data["imageVersions"][data["currentImageIndex"]]
                if 0 <= data.get("currentImageIndex", -1) < len(data.get("imageVersions", []))
                else None
            )
            cur_vid = (
                data["videoVersions"][data["currentVideoIndex"]]
                if 0 <= data.get("currentVideoIndex", -1) < len(data.get("videoVersions", []))
                else None
            )
            bundle_req = ExportBundleRequest(
                stt=stt,
                savePath=data["savePath"],
                imageVersion=cur_img,
                captionText=data.get("captionResult"),
                audioBase64=(data.get("audioVersion") or {}).get("base64"),
                videoVersion=cur_vid,
                metadata={"characterName": data.get("characterName", ""), "stt": stt},
            )
            await export_bundle(bundle_req)
            data["isDone"] = True
            logs.append(f"[{stt}] Đã xuất trọn gói Bundle vào: {data['savePath']}")
        except Exception as e:
            logs.append(f"[{stt}] Lỗi xuất Bundle: {e}")

    # Lưu lại DB
    data["status"] = "COMPLETED"
    conn = get_db()
    try:
        conn.execute(
            "UPDATE workflow_state SET data_json = ?, updated_at = ? WHERE table_name = ? AND id = ?",
            (json.dumps(data, ensure_ascii=False), int(time.time() * 1000), table_name, row_id)
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "rowId": row_id,
        "logs": logs,
        "data": data,
    }
