"""
Learning Agent
───────────────
Runs after every negotiation (success OR abandoned).
Aggregates outcomes to build per-product price elasticity data
and per-vendor analytics — written to DB for the vendor dashboard.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from database import Negotiation, NegotiationOutcome, Product
from typing import Optional
import json


def log_payment_method(
    db: Session,
    session_id: str,
    payment_method: str,  # "prepaid" or "cod"
) -> None:
    """Called from checkout endpoint when buyer selects payment."""
    negotiation = db.query(Negotiation).filter(
        Negotiation.session_id == session_id
    ).first()
    if negotiation:
        negotiation.payment_method = payment_method
        db.commit()


def get_product_analytics(db: Session, product_id: int) -> dict:
    """
    Compute live analytics for a product — shown on vendor dashboard.
    """
    all_negs = db.query(Negotiation).filter(
        Negotiation.product_id == product_id
    ).all()

    if not all_negs:
        return {
            "total_negotiations": 0,
            "success_rate": 0,
            "avg_settled_price": None,
            "avg_duration_seconds": None,
            "prepaid_rate": 0,
            "price_elasticity": "insufficient data",
            "common_tactics": [],
        }

    successful = [n for n in all_negs if n.outcome == NegotiationOutcome.success]
    abandoned = [n for n in all_negs if n.outcome == NegotiationOutcome.abandoned]

    success_rate = len(successful) / len(all_negs) * 100 if all_negs else 0

    avg_settled = (
        sum(n.final_price for n in successful if n.final_price) / len(successful)
        if successful else None
    )

    avg_duration = (
        sum(n.duration_seconds for n in all_negs if n.duration_seconds) /
        len([n for n in all_negs if n.duration_seconds])
        if any(n.duration_seconds for n in all_negs) else None
    )

    prepaid_count = sum(1 for n in successful if n.payment_method == "prepaid")
    prepaid_rate = prepaid_count / len(successful) * 100 if successful else 0

    # Aggregate tactics used across all sessions
    tactics_counter: dict = {}
    for n in all_negs:
        if n.tactics_used:
            try:
                tactics = json.loads(n.tactics_used)
                for t in tactics:
                    tactics_counter[t] = tactics_counter.get(t, 0) + 1
            except Exception:
                pass
    common_tactics = sorted(tactics_counter, key=tactics_counter.get, reverse=True)[:3]

    # Simple elasticity signal
    product = db.query(Product).filter(Product.id == product_id).first()
    if product and avg_settled:
        gap = product.mrp - avg_settled
        gap_pct = gap / product.mrp * 100
        if gap_pct < 5:
            elasticity = "low — buyers accept near MRP"
        elif gap_pct < 15:
            elasticity = "moderate — buyers negotiate ~10% off"
        else:
            elasticity = "high — buyers push hard, consider adjusting MRP"
    else:
        elasticity = "insufficient data"

    return {
        "total_negotiations": len(all_negs),
        "successful": len(successful),
        "abandoned": len(abandoned),
        "success_rate": round(success_rate, 1),
        "avg_settled_price": round(avg_settled, 2) if avg_settled else None,
        "avg_duration_seconds": round(avg_duration) if avg_duration else None,
        "prepaid_rate": round(prepaid_rate, 1),
        "price_elasticity": elasticity,
        "common_tactics": common_tactics,
    }


def get_vendor_analytics(db: Session, vendor_id: int) -> dict:
    """Overall vendor dashboard analytics across all products."""
    all_negs = db.query(Negotiation).filter(
        Negotiation.vendor_id == vendor_id
    ).all()

    successful = [n for n in all_negs if n.outcome == NegotiationOutcome.success]
    abandoned = [n for n in all_negs if n.outcome == NegotiationOutcome.abandoned]
    in_progress = [n for n in all_negs if n.outcome == NegotiationOutcome.in_progress]

    total_gmv = sum(n.final_price for n in successful if n.final_price)
    prepaid_count = sum(1 for n in successful if n.payment_method == "prepaid")

    return {
        "total_negotiations": len(all_negs),
        "successful": len(successful),
        "abandoned": len(abandoned),
        "in_progress": len(in_progress),
        "success_rate": round(len(successful) / len(all_negs) * 100, 1) if all_negs else 0,
        "total_gmv": round(total_gmv, 2),
        "prepaid_conversions": prepaid_count,
        "prepaid_rate": round(prepaid_count / len(successful) * 100, 1) if successful else 0,
    }
