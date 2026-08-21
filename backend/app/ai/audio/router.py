from app.ai.audio import edge_tts


async def generate_audio(prompt: str, voice: str = "vi-VN-HoaiMyNeural", **kwargs) -> dict:
    return await edge_tts.generate_edge_tts(prompt, voice=voice)
