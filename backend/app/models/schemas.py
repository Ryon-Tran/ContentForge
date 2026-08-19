from typing import Optional, List
from pydantic import BaseModel, Field

class AIConfigCreate(
    BaseModel
):

    name: str

    provider: str

    type: str

    model: str

    baseUrl: str

    apiKey: str

    isActive: bool = True

    isDefault: bool = False


class AIConfigUpdate(
    BaseModel
):

    name: Optional[str] = None

    provider: Optional[str] = None

    type: Optional[str] = None

    model: Optional[str] = None

    baseUrl: Optional[str] = None

    apiKey: Optional[str] = None

    isActive: Optional[bool] = None

    isDefault: Optional[bool] = None


class SetDefaultRequest(
    BaseModel
):

    id: str

    type: str


class ActivityCreateRequest(
    BaseModel
):

    activity: dict


class ActivityUpdateRequest(
    BaseModel
):

    patch: dict


class SaveRowRequest(
    BaseModel
):

    row: dict

    table: str


class DeleteRowRequest(
    BaseModel
):

    id: str

    table: str


class SaveFileRequest(
    BaseModel
):

    base64: str

    mimeType: str

    filename: str

    path: str
class GenerateTextRequest(
    BaseModel
):

    prompt: str

    model: Optional[str] = None


class ReferenceImagePayload(
    BaseModel
):

    base64: str

    mimeType: str = "image/jpeg"


class GenerateImageRequest(
    BaseModel
):

    prompt: str

    referenceIds: list[str] = Field(
        default_factory=list
    )

    referenceImages: list[
        ReferenceImagePayload
    ] = Field(
        default_factory=list
    )

    model: Optional[str] = None

    aspectRatio: str = "9:16"


class GenerateVideoRequest(
    BaseModel
):

    prompt: str

    firstFrameId: str = ""

    firstFrameBase64: Optional[str] = None

    firstFrameMimeType: Optional[str] = None

    model: Optional[str] = None

    aspectRatio: str = "9:16"

    durationSeconds: int = 8

    resolution: str = "720p"


