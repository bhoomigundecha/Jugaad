"""
Sarvam TTS — Multilingual Text to Speech
────────────────────────────────────
Converts agent's text → audio bytes.
Uses Sarvam AI's Bulbul v3 model (replaces deprecated Bulbul v2).
"""

import os
import re
import time
import base64
import httpx
from dotenv import load_dotenv
from logger import tts_log, error_log

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
TTS_URL = "https://api.sarvam.ai/text-to-speech"

DEFAULT_SPEAKER = "priya"


def preprocess_text(text: str) -> str:
    """
    Clean up text so TTS reads it naturally in Hindi.
    - ₹850  →  "850 rupaye"
    - emojis / asterisks / markdown stripped
    - DEAL_CONFIRMED signal stripped (should never reach TTS, but safety net)
    - Ellipsis and dashes replaced with natural pauses
    """
    # Strip deal signal if it somehow leaks through
    text = re.sub(r"DEAL_CONFIRMED:₹?[\d,]+", "", text)

    # ₹<number>  →  <number> रुपये
    text = re.sub(r"₹\s*([\d,]+)", lambda m: m.group(1).replace(",", "") + " रुपये", text)

    # Markdown / asterisks / underscores
    text = re.sub(r"[*_`#]", "", text)

    # Emojis — remove
    text = re.sub(
        r"[\U00010000-\U0010ffff]|"          # 4-byte unicode (most emojis)
        r"[☀-⛿]|[✀-➿]",  # misc symbols
        "",
        text,
        flags=re.UNICODE,
    )

    # Em-dash / en-dash → comma pause
    text = re.sub(r"[—–]", ",", text)

    # Ellipsis → natural pause comma
    text = re.sub(r"\.{2,}", ",", text)

    # Collapse multiple spaces
    text = re.sub(r" {2,}", " ", text)

    return text.strip()


def split_into_chunks(text: str, max_chars: int = 400) -> list[str]:
    """
    Split long text at sentence boundaries so each TTS call is short.
    Short chunks = better prosody, lower latency for first audio.
    """
    # Split on Hindi/English sentence endings
    sentences = re.split(r'(?<=[।.!?])\s+', text)
    chunks = []
    current = ""

    for s in sentences:
        if len(current) + len(s) + 1 <= max_chars:
            current = (current + " " + s).strip()
        else:
            if current:
                chunks.append(current)
            current = s

    if current:
        chunks.append(current)

    return chunks or [text[:max_chars]]


async def synthesize_speech(
    text: str,
    speaker: str = DEFAULT_SPEAKER,
    language_code: str = "hi-IN",
) -> bytes:
    """
    Convert text to audio bytes, in the given target language.
    Preprocesses text and handles chunking for naturalness.
    """
    if not SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY not set in environment")

    clean_text = preprocess_text(text)
    if not clean_text:
        return b""

    # Use first chunk only for real-time feel; caller streams audio anyway
    chunks = split_into_chunks(clean_text, max_chars=400)
    speak_text = chunks[0]

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "text": speak_text,
        "target_language_code": language_code,
        "speaker": speaker,
        "pace": 0.9,         # slightly slower than default → more natural cadence
        "speech_sample_rate": "22050",
        "model": "bulbul:v3",
    }

    t0 = time.time()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(TTS_URL, headers=headers, json=payload)
    latency_ms = int((time.time() - t0) * 1000)

    if response.status_code != 200:
        error_log("TTS", f"Sarvam {response.status_code}: {response.text}")
        raise RuntimeError(f"Sarvam TTS error {response.status_code}: {response.text}")

    audios = response.json().get("audios", [])
    if not audios:
        raise ValueError("No audio returned from Sarvam TTS")

    audio_bytes = base64.b64decode(audios[0])
    tts_log(len(speak_text), len(audio_bytes) / 1024)

    return audio_bytes
