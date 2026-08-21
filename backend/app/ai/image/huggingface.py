"""
IMAGE adapter — Hugging Face Serverless Inference API (Free Tier).

Endpoints:
  https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell
  https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell
"""
import base64
import uuid
import httpx
from fastapi import HTTPException
from app.models.schemas import GenerateImageRequest

DEFAULT_HF_MODEL = "black-forest-labs/FLUX.1-schnell"


async def generate_image(cfg: dict, data: GenerateImageRequest) -> dict:
    api_key = (cfg.get("api_key") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Hugging Face cần có API Token (bắt đầu bằng 'hf_...'). Hãy lấy miễn phí tại huggingface.co/settings/tokens."
        )

    model = (cfg.get("model") or DEFAULT_HF_MODEL).strip()
    
    # Danh sách URL endpoint thử nghiệm (ưu tiên router mới của Hugging Face)
    if cfg.get("base_url") and cfg["base_url"].strip():
        base = cfg["base_url"].rstrip("/")
        urls = [f"{base}/{model}" if not base.endswith(model) else base]
    else:
        urls = [
            f"https://router.huggingface.co/hf-inference/models/{model}",
            f"https://api-inference.huggingface.co/models/{model}",
        ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": data.prompt,
    }

    last_err = None
    for url in urls:
        try:
            async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code == 503:
                    try:
                        err = response.json()
                        estimated = err.get("estimated_time", 20)
                        raise HTTPException(
                            status_code=503,
                            detail=f"Model Hugging Face đang khởi động trên server ({int(estimated)}s). Vui lòng thử lại sau giây lát."
                        )
                    except ValueError:
                        pass

                if response.status_code == 401:
                    raise HTTPException(
                        status_code=401,
                        detail="Hugging Face Token không hợp lệ. Hãy kiểm tra lại API Token (hf_...)."
                    )

                if response.status_code >= 400:
                    try:
                        err_data = response.json()
                        msg = err_data.get("error") if isinstance(err_data, dict) else str(err_data)
                        raise HTTPException(status_code=response.status_code, detail=f"Hugging Face: {msg}")
                    except ValueError:
                        raise HTTPException(status_code=response.status_code, detail=response.text or f"HTTP {response.status_code}")

                image_bytes = response.content
                if not image_bytes:
                    raise HTTPException(status_code=502, detail="Hugging Face không trả về dữ liệu ảnh.")

                mime_type = response.headers.get("content-type", "image/jpeg")
                b64 = base64.b64encode(image_bytes).decode("utf-8")

                return {
                    "base64": b64,
                    "mimeType": mime_type,
                    "mediaId": str(uuid.uuid4()),
                }
        except HTTPException:
            raise
        except Exception as e:
            last_err = e
            continue

    raise HTTPException(
        status_code=502,
        detail=f"Không thể kết nối đến máy chủ Hugging Face: {last_err}. Hãy kiểm tra kết nối mạng hoặc thử model Pollinations.ai (Free 100%)."
    )
