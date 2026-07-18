"""
WebSocket Negotiation Endpoint
────────────────────────────────
ws://localhost:8000/ws/negotiate/{session_id}

Message protocol (JSON):

BROWSER → SERVER:
  { "type": "audio",  "data": "<base64 wav/webm>" }   — buyer spoke
  { "type": "text",   "text": "mujhe 700 mein chahiye" } — text fallback
  { "type": "ping" }                                    — keepalive

SERVER → BROWSER:
  { "type": "transcript",    "text": "..." }            — STT result
  { "type": "agent_text",    "text": "..." }            — agent response text
  { "type": "agent_audio",   "data": "<base64 wav>" }  — agent audio to play
  { "type": "deal_reached",  "price": 850, "nudge": "...", "checkout_url": "..." }
  { "type": "alternatives",  "products": [...] }        — find_alternatives fired (stalled deal)
  { "type": "error",         "message": "..." }
  { "type": "log",           "text": "..." }            — backend log for vendor dashboard
"""

import base64
import json
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from database import get_db, Negotiation, Product, Buyer
from agents.price_intelligence import compute_negotiation_params
from agents.negotiation_agent import NegotiationSession
from agents.deal_closing_agent import close_deal, mark_abandoned
from voice.stt import transcribe_audio
from voice.tts import synthesize_speech
from voice.language_detect import detect_language_code
from logger import banner, session_start, round_header, error_log

router = APIRouter(tags=["websocket"])

# In-memory active sessions — keyed by session_id
active_sessions: dict[str, NegotiationSession] = {}


async def send(ws: WebSocket, payload: dict):
    await ws.send_text(json.dumps(payload, ensure_ascii=False))


@router.websocket("/ws/negotiate/{session_id}")
async def negotiate_ws(session_id: str, websocket: WebSocket):
    await websocket.accept()

    # ── Load session from DB ──────────────────────────────────────────────────
    db: Session = next(get_db())
    negotiation = db.query(Negotiation).filter(
        Negotiation.session_id == session_id
    ).first()

    if not negotiation:
        await send(websocket, {"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    product: Product = negotiation.product
    buyer: Buyer = negotiation.buyer

    # ── Demo terminal banner ──────────────────────────────────────────────────
    banner()
    session_start(session_id, buyer.name, product.name, product.mrp)

    # ── Price Intelligence Agent ──────────────────────────────────────────────
    params = compute_negotiation_params(product, buyer)

    await send(websocket, {
        "type": "log",
        "text": (
            f"[Price Intel] Floor: ₹{params.floor_price:.0f} | "
            f"Target: ₹{params.target_price:.0f} | "
            f"Opening counter: ₹{params.opening_counter:.0f} | "
            f"Tactics: {', '.join(params.tactics)}"
        ),
    })

    # ── Init Negotiation Agent session ────────────────────────────────────────
    language_code = buyer.language or "hi-IN"
    neg_session = NegotiationSession(
        session_id=session_id,
        buyer_name=buyer.name,
        product=product,
        params=params,
        language_code=language_code,
    )
    active_sessions[session_id] = neg_session
    started_at = datetime.utcnow()

    # ── Agent opening line ────────────────────────────────────────────────────
    opening_text = await neg_session.get_opening_line()
    await send(websocket, {"type": "agent_text", "text": opening_text})

    try:
        opening_audio = await synthesize_speech(opening_text, language_code=language_code)
        await send(websocket, {
            "type": "agent_audio",
            "data": base64.b64encode(opening_audio).decode(),
        })
    except Exception as e:
        error_log("TTS", str(e))
        await send(websocket, {"type": "error", "message": f"TTS error: {str(e)}"})

    # ── Main conversation loop ────────────────────────────────────────────────
    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)

            msg_type = message.get("type")

            if msg_type == "ping":
                await send(websocket, {"type": "pong"})
                continue

            # ── Convert audio to text ─────────────────────────────────────────
            round_header(neg_session.round_count + 1)
            buyer_text = ""
            if msg_type == "audio":
                try:
                    audio_bytes = base64.b64decode(message["data"])
                    buyer_text = await transcribe_audio(audio_bytes, language_code=language_code)
                    if not buyer_text:
                        # Silent recording — skip silently, don't send error
                        continue
                    await send(websocket, {"type": "transcript", "text": buyer_text})
                    await send(websocket, {
                        "type": "log",
                        "text": f"[STT] {buyer.name}: \"{buyer_text}\""
                    })
                except Exception as e:
                    error_log("STT", str(e))
                    await send(websocket, {"type": "error", "message": f"STT error: {str(e)}"})
                    continue

            elif msg_type == "text":
                buyer_text = message.get("text", "").strip()
                await send(websocket, {"type": "transcript", "text": buyer_text})
                await send(websocket, {
                    "type": "log",
                    "text": f"[Text] {buyer.name}: \"{buyer_text}\""
                })

            if not buyer_text:
                continue

            # Reply (and hint future STT) in whatever language the buyer is
            # actually using this turn, instead of staying pinned to their
            # stored profile language for the whole session.
            language_code = detect_language_code(buyer_text, fallback=language_code)

            # Track opening offer
            if negotiation.opening_price is None:
                import re
                price_match = re.search(r"[\d,]+", buyer_text.replace("₹", ""))
                if price_match:
                    try:
                        opening_price = float(price_match.group().replace(",", ""))
                        negotiation.opening_price = opening_price
                        db.commit()
                    except Exception:
                        pass

            # ── Negotiation Agent responds ────────────────────────────────────
            try:
                agent_text, deal_reached, agreed_price, alternatives = await neg_session.respond(
                    buyer_text, language_code=language_code
                )
            except Exception as e:
                error_log("Negotiation Agent", str(e))
                await send(websocket, {"type": "error", "message": f"Agent error: {str(e)}"})
                continue

            await send(websocket, {"type": "agent_text", "text": agent_text})
            await send(websocket, {
                "type": "log",
                "text": f"[Agent] Priya: \"{agent_text}\""
            })

            # ── Alternatives — pushed when find_alternatives fired this turn ───
            if alternatives:
                await send(websocket, {"type": "alternatives", "products": alternatives})
                await send(websocket, {
                    "type": "log",
                    "text": f"[find_alternatives] {len(alternatives)} product(s) pushed to buyer screen"
                })

            # ── TTS: agent speaks ─────────────────────────────────────────────
            try:
                agent_audio = await synthesize_speech(agent_text, language_code=language_code)
                await send(websocket, {
                    "type": "agent_audio",
                    "data": base64.b64encode(agent_audio).decode(),
                })
            except Exception as e:
                await send(websocket, {"type": "error", "message": f"TTS error: {str(e)}"})

            # ── Deal Closing Agent ────────────────────────────────────────────
            if deal_reached and agreed_price:
                await send(websocket, {
                    "type": "log",
                    "text": f"[Deal Closing Agent] Deal at ₹{agreed_price:.0f} — triggering close."
                })

                result = close_deal(
                    db=db,
                    session_id=session_id,
                    agreed_price=agreed_price,
                    floor_price=params.floor_price,
                    buyer_name=buyer.name,
                    transcript=neg_session.get_transcript(),
                    tactics_used=neg_session.get_tactics_used(),
                    started_at=started_at,
                )

                await send(websocket, {
                    "type": "deal_reached",
                    "price": agreed_price,
                    "nudge": result["prepaid_nudge"],
                    "checkout_url": result["checkout_url"],
                    "duration_seconds": result["duration_seconds"],
                })

                await send(websocket, {
                    "type": "log",
                    "text": (
                        f"[Learning Agent] Logged outcome: SUCCESS | "
                        f"Price: ₹{agreed_price:.0f} | "
                        f"Floor was: ₹{params.floor_price:.0f} | "
                        f"Margin saved: ₹{agreed_price - params.floor_price:.0f}"
                    )
                })

                break

    except WebSocketDisconnect:
        # Buyer closed tab / disconnected without deal
        if not neg_session.deal_reached:
            mark_abandoned(
                db=db,
                session_id=session_id,
                transcript=neg_session.get_transcript(),
                tactics_used=neg_session.get_tactics_used(),
                started_at=started_at,
            )
    finally:
        active_sessions.pop(session_id, None)
        db.close()
