"""
IMAGE adapter — ComfyUI API runner.

Endpoint mặc định: http://localhost:8188
"""
import asyncio
import json
import uuid
from fastapi import HTTPException
from app.ai.base import request_json, download_to_base64
from app.models.schemas import GenerateImageRequest

DEFAULT_BASE_URL = "http://localhost:8188"


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    base_url = (cfg.get("base_url") or DEFAULT_BASE_URL).rstrip("/")
    client_id = str(uuid.uuid4())
    extra = cfg.get("extra_config") or {}

    # Standard SDXL / SD 1.5 default prompt workflow for ComfyUI
    checkpoint = cfg.get("model") or extra.get("checkpoint") or "v1-5-pruned-emaonly.safetensors"
    
    prompt_workflow = {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": 7,
                "denoise": 1,
                "latent_image": ["5", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": "euler",
                "scheduler": "normal",
                "seed": int(uuid.uuid4().int % 1000000000),
                "steps": 20
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": checkpoint}
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"batch_size": 1, "height": 1024, "width": 576 if data.aspectRatio == "9:16" else 1024}
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": data.prompt}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": extra.get("negative_prompt", "blurry, low quality, distorted")}
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "ToolsMMO", "images": ["8", 0]}
        }
    }

    # Queue prompt
    result = await request_json(
        "POST",
        f"{base_url}/prompt",
        "",
        auth_bearer=False,
        json={"prompt": prompt_workflow, "client_id": client_id},
    )

    prompt_id = result.get("prompt_id")
    if not prompt_id:
        raise HTTPException(status_code=502, detail=f"ComfyUI không trả về prompt_id: {result}")

    # Polling history
    for _ in range(60):
        await asyncio.sleep(2)
        history = await request_json(
            "GET",
            f"{base_url}/history/{prompt_id}",
            "",
            auth_bearer=False,
        )
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output and node_output["images"]:
                    img_info = node_output["images"][0]
                    filename = img_info["filename"]
                    subfolder = img_info.get("subfolder", "")
                    img_type = img_info.get("type", "output")
                    view_url = f"{base_url}/view?filename={filename}&subfolder={subfolder}&type={img_type}"
                    b64, mime = await download_to_base64(view_url, default_mime="image/png")
                    return {
                        "base64": b64,
                        "mimeType": mime,
                        "mediaId": str(uuid.uuid4()),
                    }

    raise HTTPException(status_code=504, detail="ComfyUI timeout sau 2 phút.")
