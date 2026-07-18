"""
Vendor REST Endpoints
──────────────────────
GET  /vendor/{id}/dashboard          — overview analytics
GET  /vendor/{id}/products           — all vendor products with analytics
POST /vendor/{id}/products           — create a new product listing
PUT  /vendor/products/{id}/floor     — update floor price
PATCH /vendor/products/{id}/negotiable — toggle is_negotiable
PATCH /vendor/products/{id}/persona  — update negotiation persona
GET  /vendor/negotiations/live       — all in-progress negotiations (for live log)
GET  /vendor/negotiations/{id}       — single negotiation detail + transcript
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Product, Vendor, Negotiation, NegotiationOutcome
from agents.learning_agent import get_product_analytics, get_vendor_analytics
from logger import product_created_log, floor_updated_log, negotiable_toggled_log, persona_updated_log

router = APIRouter(prefix="/vendor", tags=["vendor"])

VALID_PERSONAS = {"soft", "to_the_point", "haggler"}


class UpdateFloorPriceRequest(BaseModel):
    floor_price: float


class UpdateNegotiableRequest(BaseModel):
    is_negotiable: bool


class UpdatePersonaRequest(BaseModel):
    persona: str


class CreateProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    gender: Optional[str] = None
    sub_category: Optional[str] = None
    image_url: Optional[str] = None
    mrp: float
    seller_price: Optional[float] = None
    floor_price: float
    stock: int = 10
    age_days: int = 0
    is_negotiable: bool = True
    persona: str = "soft"


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
            "gender": p.gender,
            "sub_category": p.sub_category,
            "image_url": p.image_url,
            "mrp": p.mrp,
            "seller_price": p.seller_price,
            "floor_price": p.floor_price,
            "stock": p.stock,
            "age_days": p.age_days,
            "is_negotiable": p.is_negotiable,
            "persona": p.persona,
            "analytics": analytics,
        })
    return result


@router.post("/{vendor_id}/products")
def create_product(vendor_id: int, req: CreateProductRequest, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if req.floor_price >= req.mrp:
        raise HTTPException(status_code=400, detail="Floor price must be below MRP")
    if req.persona not in VALID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"persona must be one of {sorted(VALID_PERSONAS)}")

    product = Product(
        name=req.name,
        description=req.description,
        category=req.category,
        gender=req.gender,
        sub_category=req.sub_category,
        image_url=req.image_url,
        mrp=req.mrp,
        seller_price=req.seller_price if req.seller_price is not None else req.mrp,
        floor_price=req.floor_price,
        stock=req.stock,
        age_days=req.age_days,
        is_negotiable=req.is_negotiable,
        persona=req.persona,
        vendor_id=vendor_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    product_created_log(product.name, vendor_id, product.persona, product.is_negotiable, product.floor_price, product.mrp)

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "gender": product.gender,
        "sub_category": product.sub_category,
        "image_url": product.image_url,
        "mrp": product.mrp,
        "seller_price": product.seller_price,
        "floor_price": product.floor_price,
        "stock": product.stock,
        "age_days": product.age_days,
        "is_negotiable": product.is_negotiable,
        "persona": product.persona,
        "vendor_id": product.vendor_id,
    }


@router.patch("/products/{product_id}/negotiable")
def update_negotiable(product_id: int, req: UpdateNegotiableRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_negotiable = req.is_negotiable
    db.commit()
    negotiable_toggled_log(product_id, req.is_negotiable)
    return {"product_id": product_id, "is_negotiable": req.is_negotiable}


@router.patch("/products/{product_id}/persona")
def update_persona(product_id: int, req: UpdatePersonaRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if req.persona not in VALID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"persona must be one of {sorted(VALID_PERSONAS)}")
    old_persona = product.persona
    product.persona = req.persona
    db.commit()
    persona_updated_log(product_id, old_persona, req.persona)
    return {"product_id": product_id, "persona": req.persona}


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
    old_floor = product.floor_price
    product.floor_price = req.floor_price
    db.commit()
    floor_updated_log(product_id, old_floor, req.floor_price)
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
