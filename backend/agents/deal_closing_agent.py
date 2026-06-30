"""
Deal Closing Agent
───────────────────
Triggered when Negotiation Agent signals DEAL_CONFIRMED.
1. Validates agreed price is above floor
2. Creates the order record
3. Returns a prepaid nudge message in Hindi
4. Hands off session data to Learning Agent
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from database import Negotiation, NegotiationOutcome, PaymentMethod
from logger import agent_header, deal_close_log, agent_header, info, session_end, session_abandoned


def build_prepaid_nudge(agreed_price: float, buyer_name: str) -> str:
    """Returns a Hindi message nudging buyer toward UPI/prepaid."""
    return (
        f"Wah {buyer_name} ji, ₹{agreed_price:.0f} mein deal pakki! "
        f"Agar aap UPI ya card se pay karein toh ₹20 extra cashback milega. "
        f"Kya aap abhi pay karna chahenge?"
    )


def close_deal(
    db: Session,
    session_id: str,
    agreed_price: float,
    floor_price: float,
    buyer_name: str,
    transcript: str,
    tactics_used: str,
    started_at: datetime,
) -> dict:
    """
    Finalises the negotiation in DB and returns checkout payload.
    """
    # Safety check — never close below floor
    if agreed_price < floor_price:
        agreed_price = floor_price

    now = datetime.utcnow()
    duration = int((now - started_at).total_seconds())

    # Update negotiation record
    negotiation = db.query(Negotiation).filter(
        Negotiation.session_id == session_id
    ).first()

    if negotiation:
        negotiation.final_price = agreed_price
        negotiation.outcome = NegotiationOutcome.success
        negotiation.ended_at = now
        negotiation.duration_seconds = duration
        negotiation.full_transcript = transcript
        negotiation.tactics_used = tactics_used
        db.commit()
        db.refresh(negotiation)

    prepaid_nudge = build_prepaid_nudge(agreed_price, buyer_name)

    # ── Demo terminal output ──────────────────────────────────────────────────
    agent_header(3, 4, "Deal Closing Agent")
    deal_close_log(agreed_price, floor_price, duration)

    agent_header(4, 4, "Learning Agent")
    info("Outcome",      "SUCCESS")
    info("Tactics used", tactics_used)
    info("Transcript",   f"{transcript.count(chr(10)) + 1} turns — saved to DB")

    session_end(agreed_price, floor_price)

    return {
        "session_id": session_id,
        "agreed_price": agreed_price,
        "prepaid_nudge": prepaid_nudge,
        "duration_seconds": duration,
        "checkout_url": f"/checkout?session={session_id}&price={agreed_price:.0f}",
    }


def mark_abandoned(
    db: Session,
    session_id: str,
    transcript: str,
    tactics_used: str,
    started_at: datetime,
) -> None:
    """Called when buyer disconnects without a deal."""
    now = datetime.utcnow()
    duration = int((now - started_at).total_seconds())

    negotiation = db.query(Negotiation).filter(
        Negotiation.session_id == session_id
    ).first()

    if negotiation:
        negotiation.outcome = NegotiationOutcome.abandoned
        negotiation.ended_at = now
        negotiation.duration_seconds = duration
        negotiation.full_transcript = transcript
        negotiation.tactics_used = tactics_used
        db.commit()

    session_abandoned(duration)
