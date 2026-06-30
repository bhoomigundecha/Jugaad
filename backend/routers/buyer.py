"""
Buyer REST Endpoints
─────────────────────
GET  /buyer/products              — list all products
GET  /buyer/products/{id}         — product detail
POST /buyer/negotiate/start       — initialise a negotiation session
POST /buyer/checkout              — confirm payment method after deal
"""

import uuid
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
            "image_url": p.image_url,
            "mrp": p.mrp,
            "stock": p.stock,
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
        "image_url": product.image_url,
        "mrp": product.mrp,
        "stock": product.stock,
        "age_days": product.age_days,
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
