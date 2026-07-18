"""
Jugaad — Demo Terminal Logger
──────────────────────────────
Coloured ANSI print helpers for the demo split-screen terminal view.
Import and call these from any agent/router file.
"""

import time
from datetime import datetime

# Persona slug -> judge-facing display name. Internal code/DB values stay
# stable (soft/to_the_point/haggler); only what's printed/shown changes.
PERSONA_DISPLAY_NAMES = {
    "soft": "Meethi Didi",
    "to_the_point": "Vyapari",
    "haggler": "Mol-Bhav Queen",
}


def persona_display(persona: str) -> str:
    return PERSONA_DISPLAY_NAMES.get(persona, persona)

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
    print(f"  {BLUE}→ STT{RESET}  {DIM}Sarvam Saaras v3  audio:{RESET} {audio_kb:.0f}KB{lat}")
    print(f"  {DIM}  heard :{RESET} {WHITE}'{transcript}'{RESET}")


def groq_log(latency_ms: int = None):
    lat = f"  {DIM}latency: {latency_ms}ms{RESET}" if latency_ms else ""
    print(f"  {MAGENTA}→ LLM{RESET}  {DIM}Groq  Llama-3.3-70B  LPU inference{RESET}{lat}")


def priya_log(text: str):
    # Trim long responses for terminal readability
    display = text[:120] + "…" if len(text) > 120 else text
    print(f"  {MAGENTA}<- Priya:{RESET} {WHITE}'{display}'{RESET}")


def tts_log(char_count: int, audio_kb: float = None):
    audio_str = f"  →  audio: {audio_kb:.0f}KB" if audio_kb else ""
    print(f"  {BLUE}→ TTS{RESET}  {DIM}Sarvam Bulbul v3  text: {char_count} chars{RESET}{audio_str}")


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


# ── Discovery Agent — voice-mode search/recommend/list ────────────────────────
# Each tool gets its own colour so a tool switch is visually obvious in the
# terminal at a glance, same idea as the negotiation pipeline's agent_header.

TOOL_COLORS = {
    "search_product":       CYAN,
    "recommend_outfit":     MAGENTA,
    "update_shopping_list": GREEN,
    "get_product_details":  BLUE,
    "close_deal":           GREEN,
    "find_alternatives":    ORANGE,
}

TOOL_ICONS = {
    "search_product":       "🔍",
    "recommend_outfit":     "✨",
    "update_shopping_list": "🛒",
    "close_deal":           "🤝",
    "find_alternatives":    "🔀",
    "get_product_details":  "📦",
}


def discovery_banner():
    print(f"\n{BOLD}{ORANGE}")
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║          JUGAAD — Discovery Agent  ·  Voice Mode             ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(RESET)


def discovery_turn_start(buyer_name: str, language: str, turn_input: str):
    print(f"\n{BOLD}{WHITE}[{_ts()}] DISCOVERY TURN {'─' * 38}{RESET}")
    print(f"  {DIM}Buyer       :{RESET} {WHITE}{buyer_name}{RESET}")
    print(f"  {DIM}Language    :{RESET} {YELLOW}{language}{RESET}")
    print(f"  {DIM}Buyer said  :{RESET} {WHITE}'{turn_input}'{RESET}")


def tool_switch(tool_name: str, args: dict):
    """Loud, colour-coded marker every time the agent hands off to a tool —
    the 'switching agents' visibility the demo terminal needs."""
    color = TOOL_COLORS.get(tool_name, WHITE)
    icon = TOOL_ICONS.get(tool_name, "🔧")
    line = "─" * 62
    print(f"\n{color}{line}{RESET}")
    print(f"{color}{BOLD}  {icon}  TOOL CALL → {tool_name}{RESET}")
    for k, v in args.items():
        print(f"  {DIM}{k:<12}:{RESET} {color}{v}{RESET}")
    print(f"{color}{line}{RESET}")


def tool_result(tool_name: str, summary: str):
    color = TOOL_COLORS.get(tool_name, WHITE)
    print(f"  {color}✓ RESULT{RESET}  {DIM}{summary}{RESET}")


def hybrid_fallback_log(keyword: str):
    print(f"  {YELLOW}⚠ hybrid{RESET}  {DIM}keyword match on \"{keyword}\" returned nothing — falling back to pure semantic search{RESET}")


def discovery_reply_log(reply: str):
    display = reply[:150] + "…" if len(reply) > 150 else reply
    print(f"\n  {BOLD}{ORANGE}<- Priya (Discovery):{RESET} {WHITE}'{display}'{RESET}")


# ── search_product internals — Nebius embed + Qdrant query, spelled out ───────

def nebius_embed_log(query: str, latency_ms: int = None):
    lat = f"  {DIM}{latency_ms}ms{RESET}" if latency_ms else ""
    print(f"  {CYAN}→ Nebius{RESET}  {DIM}embedding \"{query}\"  (Qwen3-Embedding-8B, 4096-D){RESET}{lat}")


def qdrant_query_log(filters: dict, limit: int):
    filter_str = f"  {DIM}filters:{RESET} {CYAN}{filters}{RESET}" if filters else f"  {DIM}filters: none{RESET}"
    print(f"  {CYAN}→ Qdrant{RESET}  {DIM}querying 'jugaad_products'  limit={limit}{RESET}{filter_str}")


def qdrant_result_log(products: list, latency_ms: int = None):
    lat = f"  {DIM}{latency_ms}ms{RESET}" if latency_ms else ""
    print(f"  {CYAN}✓ Qdrant{RESET}  {DIM}returned {len(products)} results{RESET}{lat}")
    for p in products:
        rel = p.get("relevance")
        rel_str = f"  {DIM}(relevance {rel}){RESET}" if rel is not None else ""
        print(f"    {CYAN}•{RESET} {WHITE}{p['name']}{RESET}  {YELLOW}₹{p['mrp']:.0f}{RESET}{rel_str}")


# ── Vendor API — listing/floor/toggle hits ─────────────────────────────────

def vendor_login_log(vendor_name: str, shop_name: str):
    print(f"\n{BOLD}{GREEN}[{_ts()}] VENDOR LOGIN{RESET}  {WHITE}{vendor_name}{RESET}  {DIM}({shop_name}){RESET}")


def vendor_signup_log(vendor_name: str, shop_name: str, email: str):
    print(f"\n{BOLD}{GREEN}[{_ts()}] VENDOR SIGNUP {'─' * 32}{RESET}")
    print(f"  {DIM}{'Name':<14}:{RESET} {WHITE}{vendor_name}{RESET}")
    print(f"  {DIM}{'Shop':<14}:{RESET} {WHITE}{shop_name}{RESET}")
    print(f"  {DIM}{'Email':<14}:{RESET} {WHITE}{email}{RESET}")


def product_created_log(product_name: str, vendor_id: int, persona: str, is_negotiable: bool, floor_price: float, mrp: float):
    print(f"\n{BOLD}{GREEN}[{_ts()}] PRODUCT CREATED {'─' * 32}{RESET}")
    print(f"  {DIM}{'Name':<14}:{RESET} {WHITE}{product_name}{RESET}")
    print(f"  {DIM}{'Vendor ID':<14}:{RESET} {WHITE}{vendor_id}{RESET}")
    print(f"  {DIM}{'Negotiable':<14}:{RESET} {GREEN if is_negotiable else RED}{is_negotiable}{RESET}")
    if is_negotiable:
        print(f"  {DIM}{'Persona':<14}:{RESET} {ORANGE}{persona_display(persona)}{RESET}")
        print(f"  {DIM}{'Floor / MRP':<14}:{RESET} {YELLOW}₹{floor_price:.0f} / ₹{mrp:.0f}{RESET}")


def floor_updated_log(product_id: int, old_floor: float, new_floor: float):
    print(f"  {GREEN}✓ FLOOR UPDATED{RESET}  {DIM}product {product_id}:{RESET} {YELLOW}₹{old_floor:.0f} -> ₹{new_floor:.0f}{RESET}")


def negotiable_toggled_log(product_id: int, is_negotiable: bool):
    state = f"{GREEN}ON{RESET}" if is_negotiable else f"{RED}OFF{RESET}"
    print(f"  {GREEN}✓ NEGOTIABLE TOGGLED{RESET}  {DIM}product {product_id}:{RESET} {state}")


def persona_updated_log(product_id: int, old_persona: str, new_persona: str):
    print(f"  {GREEN}✓ PERSONA UPDATED{RESET}  {DIM}product {product_id}:{RESET} {ORANGE}{persona_display(old_persona)} -> {persona_display(new_persona)}{RESET}")


# ── Negotiation Agent — persona, tool calls, stall detection, safety ──────────

def persona_selected_log(persona: str, tactics: list, opening_pct: float):
    print(f"  {DIM}{'Persona':<14}:{RESET} {ORANGE}{persona_display(persona)}{RESET}")
    print(f"  {DIM}{'Bias tactics':<14}:{RESET} {ORANGE}{', '.join(tactics)}{RESET}")
    print(f"  {DIM}{'Opening anchor':<14}:{RESET} {YELLOW}{opening_pct:.0f}% of MRP{RESET}")


def negotiation_tool_call_log(tool_name: str, args: dict):
    color = TOOL_COLORS.get(tool_name, MAGENTA)
    icon = TOOL_ICONS.get(tool_name, "🔧")
    line = "─" * 62
    print(f"\n{color}{line}{RESET}")
    print(f"{color}{BOLD}  {icon}  TOOL CALL → {tool_name}{RESET}")
    for k, v in args.items():
        print(f"  {DIM}{k:<12}:{RESET} {color}{v}{RESET}")
    print(f"{color}{line}{RESET}")


def negotiation_tool_result_log(tool_name: str, summary: str):
    color = TOOL_COLORS.get(tool_name, MAGENTA)
    print(f"  {color}✓ RESULT{RESET}  {DIM}{summary}{RESET}")


def floor_rejection_log(attempted_price: float, floor_price: float):
    print(f"\n  {BOLD}{RED}🛡  CLOSE_DEAL REJECTED — BELOW FLOOR{RESET}")
    print(f"  {DIM}Attempted:{RESET} {RED}₹{attempted_price:.0f}{RESET}  {DIM}< floor{RESET} {YELLOW}₹{floor_price:.0f}{RESET}  {DIM}— model asked to retry above floor{RESET}")


def stall_triggered_log(round_num: int, reason: str, buyer_offer: float, floor_price: float):
    print(f"\n  {BOLD}{YELLOW}⚠ STALL DETECTED{RESET}  {DIM}round {round_num}{RESET}")
    print(f"  {DIM}{'Reason':<14}:{RESET} {YELLOW}{reason}{RESET}")
    print(f"  {DIM}{'Buyer offer':<14}:{RESET} {YELLOW}₹{buyer_offer:.0f}{RESET}  {DIM}vs floor{RESET} {YELLOW}₹{floor_price:.0f}{RESET}")
    print(f"  {GREEN}→ nudge injected{RESET}  {DIM}\"consider offering alternatives\"{RESET}")
