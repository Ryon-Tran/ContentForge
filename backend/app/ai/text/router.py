"""
TEXT router — điều phối đến adapter đúng theo provider.

Provider mapping:
  google / gemini         → google.py    (Gemini generateContent)
  openai / chatgpt        → openai.py    (/chat/completions)
  anthropic / claude      → anthropic.py (/v1/messages)
  perplexity / sonar      → perplexity.py
  ollama                  → ollama.py    (native /api/chat)
  lmstudio / llamacpp / vllm / groq /
  together / deepseek / mistral / local  → openai_compat.py
  (fallback)              → openai_compat.py
"""
from app.ai.text import google, openai, anthropic, perplexity, ollama, openai_compat

# Providers dùng OpenAI-compatible format
_OPENAI_COMPAT_PROVIDERS = {
    "lmstudio", "llamacpp", "llama.cpp",
    "vllm", "groq", "together", "togetherai",
    "deepseek", "mistral", "local",
}


async def generate_text(cfg: dict, prompt: str) -> str:
    provider = (cfg.get("provider") or "").strip().lower()

    if provider in {"google", "gemini"}:
        return await google.generate_text(cfg, prompt)

    if provider in {"openai", "chatgpt"}:
        return await openai.generate_text(cfg, prompt)

    if provider in {"anthropic", "claude"}:
        return await anthropic.generate_text(cfg, prompt)

    if provider in {"perplexity", "sonar"}:
        return await perplexity.generate_text(cfg, prompt)

    if provider == "ollama":
        return await ollama.generate_text(cfg, prompt)

    if provider in _OPENAI_COMPAT_PROVIDERS:
        return await openai_compat.generate_text(cfg, prompt)

    # Fallback: thử OpenAI-compatible
    return await openai_compat.generate_text(cfg, prompt)
