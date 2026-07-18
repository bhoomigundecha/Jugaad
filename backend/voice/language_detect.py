"""
Lightweight script-based language detection.

Sarvam TTS needs an explicit target_language_code per reply (no auto-detect
for synthesis), so whatever language the buyer just typed/spoke in has to be
turned into a language_code *before* we call the LLM or TTS. Rather than
trust an unverified STT auto-detect field, this reads the Unicode script of
the buyer's own text — which is completely reliable for telling Devanagari
(Hindi/Marathi) apart from Latin (English), and unambiguous for every other
Indic script since each one has its own dedicated Unicode block.
"""

# (start, end) Unicode code point ranges, one per script.
_SCRIPT_RANGES: dict[str, tuple[int, int]] = {
    "hi-IN": (0x0900, 0x097F),  # Devanagari — Hindi, also Marathi/Sanskrit
    "bn-IN": (0x0980, 0x09FF),  # Bengali — also Assamese
    "pa-IN": (0x0A00, 0x0A7F),  # Gurmukhi — Punjabi
    "gu-IN": (0x0A80, 0x0AFF),  # Gujarati
    "od-IN": (0x0B00, 0x0B7F),  # Odia
    "ta-IN": (0x0B80, 0x0BFF),  # Tamil
    "te-IN": (0x0C00, 0x0C7F),  # Telugu
    "kn-IN": (0x0C80, 0x0CFF),  # Kannada
    "ml-IN": (0x0D00, 0x0D7F),  # Malayalam
}

# Scripts shared by more than one Sarvam language code — when the detected
# script is ambiguous, prefer the fallback if it's already one of these,
# instead of always collapsing to the first/majority language.
_SHARED_SCRIPT_CODES: dict[str, tuple[str, ...]] = {
    "hi-IN": ("hi-IN", "mr-IN"),
    "bn-IN": ("bn-IN", "as-IN"),
}


def detect_language_code(text: str, fallback: str = "hi-IN") -> str:
    """Best-effort Sarvam language_code for `text`, defaulting to `fallback`
    when there's no clear alphabetic signal (empty, numbers/punctuation only)."""
    if not text or not text.strip():
        return fallback

    script_counts = {code: 0 for code in _SCRIPT_RANGES}
    latin_count = 0

    for ch in text:
        cp = ord(ch)
        for code, (lo, hi) in _SCRIPT_RANGES.items():
            if lo <= cp <= hi:
                script_counts[code] += 1
                break
        else:
            if ch.isalpha() and cp < 128:
                latin_count += 1

    indic_total = sum(script_counts.values())
    if indic_total == 0 and latin_count == 0:
        return fallback

    if indic_total > latin_count:
        best_code = max(script_counts, key=script_counts.get)
        shared_with = _SHARED_SCRIPT_CODES.get(best_code)
        if shared_with and fallback in shared_with:
            return fallback
        return best_code

    return "en-IN"
