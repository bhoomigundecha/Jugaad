"""
Buyer REST Endpoints
─────────────────────
GET  /buyer/products              — list all products
GET  /buyer/products/{id}         — product detail
POST /buyer/negotiate/start       — initialise a negotiation session
POST /buyer/checkout              — confirm payment method after deal
POST /buyer/discover              — voice-mode Discovery Agent (search/recommend/list)
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database import get_db, Product, Buyer, Negotiation, NegotiationOutcome

router = APIRouter(prefix="/buyer", tags=["buyer"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class StartNegotiationRequest(BaseModel):
    product_id: int
    buyer_id: int


class CheckoutRequest(BaseModel):
    session_id: str
    payment_method: str   # "prepaid" or "cod"


class DiscoverRequest(BaseModel):
    buyer_id: int
    messages: list[dict]           # growing conversation history so far (before this turn)
    audio: Optional[str] = None    # base64 webm/wav — transcribed server-side if provided
    text: Optional[str] = None     # text fallback, used if audio not provided


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.stock > 0).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "category": p.category,
            "gender": p.gender,
            "sub_category": p.sub_category,
            "image_url": p.image_url,
            "mrp": p.mrp,
            "stock": p.stock,
            "is_negotiable": p.is_negotiable,
            "persona": p.persona,
            "vendor": p.vendor.shop_name if p.vendor else None,
        }
        for p in products
    ]


@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "gender": product.gender,
        "sub_category": product.sub_category,
        "image_url": product.image_url,
        "mrp": product.mrp,
        "stock": product.stock,
        "age_days": product.age_days,
        "is_negotiable": product.is_negotiable,
        "persona": product.persona,
        "vendor_id": product.vendor_id,
        "vendor": product.vendor.shop_name if product.vendor else None,
    }


@router.post("/negotiate/start")
def start_negotiation(req: StartNegotiationRequest, db: Session = Depends(get_db)):
    """
    Creates a Negotiation record and returns a session_id.
    The frontend uses this session_id to open the WebSocket.
    """
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    buyer = db.query(Buyer).filter(Buyer.id == req.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    session_id = str(uuid.uuid4())

    negotiation = Negotiation(
        session_id=session_id,
        product_id=product.id,
        buyer_id=buyer.id,
        vendor_id=product.vendor_id,
        floor_price_used=product.floor_price,
        persona=product.persona,
        started_at=datetime.utcnow(),
    )
    db.add(negotiation)
    db.commit()

    return {
        "session_id": session_id,
        "product_name": product.name,
        "mrp": product.mrp,
        "buyer_name": buyer.name,
        "ws_url": f"/ws/negotiate/{session_id}",
    }


@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    """Called after buyer selects payment method post-deal."""
    from agents.learning_agent import log_payment_method
    log_payment_method(db, req.session_id, req.payment_method)
    return {"status": "ok", "payment_method": req.payment_method}


@router.post("/discover")
async def discover(req: DiscoverRequest, db: Session = Depends(get_db)):
    """
    Voice-mode Discovery Agent turn. Stateless — frontend sends the full
    growing message history so far, plus this turn's input as either audio
    (transcribed server-side, same as the negotiate WS flow) or text.
    Returns the agent's reply as both text and synthesized speech.
    """
    import base64
    from agents.discovery_agent import run_discovery_turn
    from voice.stt import transcribe_audio
    from voice.tts import synthesize_speech
    from voice.language_detect import detect_language_code

    buyer = db.query(Buyer).filter(Buyer.id == req.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    language_code = buyer.language or "hi-IN"

    user_text = req.text
    if req.audio:
        audio_bytes = base64.b64decode(req.audio)
        user_text = await transcribe_audio(audio_bytes, language_code=language_code)
        if not user_text:
            return {"messages": req.messages, "reply": "", "transcript": "", "tool_results": []}

    # Reply in whatever language this turn's input actually is, rather than
    # always defaulting to the buyer's stored profile language.
    language_code = detect_language_code(user_text, fallback=language_code)

    messages = req.messages + [{"role": "user", "content": user_text}]

    result = await run_discovery_turn(
        messages=messages,
        language_code=language_code,
        buyer_id=buyer.id,
        buyer_name=buyer.name,
    )
    result["transcript"] = user_text

    try:
        audio_bytes = await synthesize_speech(result["reply"], language_code=language_code)
        result["reply_audio"] = base64.b64encode(audio_bytes).decode()
    except Exception:
        result["reply_audio"] = None

    return result
