"""
Jugaad — Demo Terminal Logger
──────────────────────────────
Coloured ANSI print helpers for the demo split-screen terminal view.
Import and call these from any agent/router file.
"""

import time
from datetime import datetime

# ── ANSI colour codes ─────────────────────────────────────────────────────────
RESET   = "\033[0m"
BOLD    = "\033[1m"
DIM     = "\033[2m"

CYAN    = "\033[96m"
YELLOW  = "\033[93m"
GREEN   = "\033[92m"
MAGENTA = "\033[95m"
RED     = "\033[91m"
WHITE   = "\033[97m"
BLUE    = "\033[94m"
ORANGE  = "\033[38;5;214m"


def _ts():
    return datetime.now().strftime("%H:%M:%S")


def banner():
    print(f"\n{BOLD}{CYAN}")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║          JUGAAD — AI Voice Negotiation Engine  v1.0         ║")
    print("║          Meesho Hackathon 2026  ·  Team Jugaad              ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(RESET)


def session_start(session_id: str, buyer: str, product: str, mrp: float):
    print(f"\n{BOLD}{WHITE}[{_ts()}] SESSION STARTED {'─' * 40}{RESET}")
    print(f"  {DIM}Session ID  :{RESET} {YELLOW}{session_id}{RESET}")
    print(f"  {DIM}Buyer       :{RESET} {WHITE}{buyer}{RESET}")
    print(f"  {DIM}Product     :{RESET} {WHITE}{product}{RESET}")
    print(f"  {DIM}MRP         :{RESET} {YELLOW}₹{mrp:.0f}{RESET}")


def agent_header(number: int, total: int, name: str):
    label = f" AGENT {number}/{total} → {name} "
    line = "━" * 62
    print(f"\n{BOLD}{CYAN}{line}{RESET}")
    print(f"{BOLD}{CYAN}  ▶  {name.upper()}{RESET}")
    print(f"{CYAN}{line}{RESET}")


def info(label: str, value: str):
    print(f"  {DIM}{label:<14}:{RESET} {WHITE}{value}{RESET}")


def price_info(label: str, value: float, note: str = ""):
    note_str = f"  {DIM}{note}{RESET}" if note else ""
    print(f"  {DIM}{label:<14}:{RESET} {YELLOW}₹{value:.0f}{RESET}{note_str}")


def tactics_info(tactics: list):
    print(f"  {DIM}{'Tactics':<14}:{RESET} {ORANGE}{', '.join(tactics)}{RESET}")


def round_header(n: int):
    print(f"\n{DIM}{'─' * 20} ROUND {n} {'─' * 20}{RESET}")


def stt_log(audio_kb: float, transcript: str, latency_ms: int = None):
    lat = f"  {DIM}{latency_ms}ms{RESET}" if latency_ms else ""
    print(f"  {BLUE}→ STT{RESET}  {DIM}Sarvam Saarika v2  audio:{RESET} {audio_kb:.0f}KB{lat}")
    print(f"  {DIM}  heard :{RESET} {WHITE}"{transcript}"{RESET}")


def groq_log(latency_ms: int = None):
    lat = f"  {DIM}latency: {latency_ms}ms{RESET}" if latency_ms else ""
    print(f"  {MAGENTA}→ LLM{RESET}  {DIM}Groq  Llama-3.3-70B  LPU inference{RESET}{lat}")


def priya_log(text: str):
    # Trim long responses for terminal readability
    display = text[:120] + "…" if len(text) > 120 else text
    print(f"  {MAGENTA}← Priya:{RESET} {WHITE}"{display}"{RESET}")


def tts_log(char_count: int, audio_kb: float = None):
    audio_str = f"  →  audio: {audio_kb:.0f}KB" if audio_kb else ""
    print(f"  {BLUE}→ TTS{RESET}  {DIM}Sarvam Bulbul v2  text: {char_count} chars{RESET}{audio_str}")


def deal_detected(price: float, floor: float):
    valid = price >= floor
    icon  = f"{GREEN}✓ VALID{RESET}" if valid else f"{RED}✗ BELOW FLOOR — clamped{RESET}"
    print(f"\n  {BOLD}{YELLOW}⚡ DEAL SIGNAL DETECTED{RESET}")
    print(f"  {DIM}Agreed price:{RESET} {YELLOW}₹{price:.0f}{RESET}  {DIM}≥ floor{RESET} {YELLOW}₹{floor:.0f}{RESET}  {icon}")


def deal_close_log(agreed: float, floor: float, duration: int):
    margin_saved = agreed - floor
    pct          = (agreed / floor * 100) - 100 if floor > 0 else 0
    print(f"  {DIM}{'Agreed price':<14}:{RESET} {YELLOW}₹{agreed:.0f}{RESET}")
    print(f"  {DIM}{'Floor price':<14}:{RESET} {YELLOW}₹{floor:.0f}{RESET}")
    print(f"  {DIM}{'Margin saved':<14}:{RESET} {GREEN}₹{margin_saved:.0f} (vendor protected){RESET}")
    print(f"  {DIM}{'Duration':<14}:{RESET} {WHITE}{duration}s{RESET}")
    print(f"  {DIM}{'DB write':<14}:{RESET} {GREEN}negotiation → SUCCESS{RESET}")
    print(f"  {DIM}{'UPI nudge':<14}:{RESET} {GREEN}triggered → ₹20 cashback framing{RESET}")


def session_end(agreed: float, floor: float):
    print(f"\n{BOLD}{GREEN}✅  SESSION COMPLETE {'─' * 40}{RESET}")
    pct = int((agreed / floor) * 100) if floor else 0
    print(f"  Deal  {YELLOW}₹{agreed:.0f}{RESET}  |  Floor {YELLOW}₹{floor:.0f}{RESET}  |  Vendor margin {GREEN}{pct}% protected{RESET}")
    print(f"  {DIM}Redirecting buyer to checkout…{RESET}\n")


def session_abandoned(duration: int):
    print(f"\n{RED}✗  SESSION ABANDONED  after {duration}s — no deal reached{RESET}\n")


def error_log(context: str, message: str):
    print(f"  {RED}✗ ERROR [{context}]{RESET} {message}")
