"""
Vendor REST Endpoints
──────────────────────
GET  /vendor/{id}/dashboard          — overview analytics
GET  /vendor/{id}/products           — all vendor products with analytics
PUT  /vendor/products/{id}/floor     — update floor price
GET  /vendor/negotiations/live       — all in-progress negotiations (for live log)
GET  /vendor/negotiations/{id}       — single negotiation detail + transcript
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Product, Vendor, Negotiation, NegotiationOutcome
from agents.learning_agent import get_product_analytics, get_vendor_analytics

router = APIRouter(prefix="/vendor", tags=["vendor"])


class UpdateFloorPriceRequest(BaseModel):
    floor_price: float


@router.get("/{vendor_id}/dashboard")
def vendor_dashboard(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    analytics = get_vendor_analytics(db, vendor_id)
    return {
        "vendor": {
            "id": vendor.id,
            "name": vendor.name,
            "shop_name": vendor.shop_name,
        },
        "analytics": analytics,
    }


@router.get("/{vendor_id}/products")
def vendor_products(vendor_id: int, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.vendor_id == vendor_id).all()
    result = []
    for p in products:
        analytics = get_product_analytics(db, p.id)
        result.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "mrp": p.mrp,
            "seller_price": p.seller_price,
            "floor_price": p.floor_price,
            "stock": p.stock,
            "age_days": p.age_days,
            "analytics": analytics,
        })
    return result


@router.put("/products/{product_id}/floor")
def update_floor_price(
    product_id: int,
    req: UpdateFloorPriceRequest,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if req.floor_price >= product.mrp:
        raise HTTPException(status_code=400, detail="Floor price must be below MRP")
    product.floor_price = req.floor_price
    db.commit()
    return {"product_id": product_id, "new_floor_price": req.floor_price}


@router.get("/negotiations/live")
def live_negotiations(vendor_id: int, db: Session = Depends(get_db)):
    """All in-progress negotiations for a vendor — polled by vendor dashboard."""
    live = (
        db.query(Negotiation)
        .filter(
            Negotiation.vendor_id == vendor_id,
            Negotiation.outcome == NegotiationOutcome.in_progress,
        )
        .all()
    )
    return [
        {
            "session_id": n.session_id,
            "product": n.product.name if n.product else None,
            "buyer": n.buyer.name if n.buyer else None,
            "buyer_city": n.buyer.city if n.buyer else None,
            "started_at": n.started_at.isoformat() if n.started_at else None,
        }
        for n in live
    ]


@router.get("/negotiations/{session_id}")
def negotiation_detail(session_id: str, db: Session = Depends(get_db)):
    n = db.query(Negotiation).filter(Negotiation.session_id == session_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    return {
        "session_id": n.session_id,
        "product": n.product.name if n.product else None,
        "buyer": n.buyer.name if n.buyer else None,
        "outcome": n.outcome,
        "opening_price": n.opening_price,
        "final_price": n.final_price,
        "floor_price_used": n.floor_price_used,
        "duration_seconds": n.duration_seconds,
        "payment_method": n.payment_method,
        "transcript": n.full_transcript,
        "tactics_used": n.tactics_used,
        "started_at": n.started_at.isoformat() if n.started_at else None,
        "ended_at": n.ended_at.isoformat() if n.ended_at else None,
    }
