"""
Sarvam STT — Hindi Speech to Text
Uses Sarvam AI's Saarika v2.5 model.
"""

import os
import time
import httpx
from dotenv import load_dotenv
from logger import stt_log, error_log

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
STT_URL = "https://api.sarvam.ai/speech-to-text"


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    if not SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY not set in environment")

    # Skip obviously empty audio
    if len(audio_bytes) < 1000:
        return ""

    headers = {"api-subscription-key": SARVAM_API_KEY}

    # Sarvam supports webm — use explicit opus codec hint
    if filename.endswith(".wav"):
        content_type = "audio/wav"
        fname = "audio.wav"
    elif filename.endswith(".mp3"):
        content_type = "audio/mpeg"
        fname = "audio.mp3"
    else:
        content_type = "audio/webm"
        fname = "audio.webm"

    files = {
        "file": (fname, audio_bytes, content_type),
        "model": (None, "saarika:v2.5"),
        "language_code": (None, "hi-IN"),
    }

    t0 = time.time()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(STT_URL, headers=headers, files=files)
    latency_ms = int((time.time() - t0) * 1000)

    if response.status_code != 200:
        error_log("STT", f"Sarvam {response.status_code}: {response.text}")
        raise RuntimeError(f"Sarvam STT error {response.status_code}: {response.text}")

    data = response.json()
    transcript = data.get("transcript", "").strip()

    audio_kb = len(audio_bytes) / 1024
    stt_log(audio_kb, transcript if transcript else "(silent)", latency_ms)

    return transcript
