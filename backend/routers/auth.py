"""
Auth router — simple email/password login for hackathon demo.
Credentials are seeded alongside buyer/vendor data in seed.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Buyer, Vendor
from logger import vendor_login_log, vendor_signup_log

router = APIRouter(prefix="/auth", tags=["auth"])

# Hardcoded demo credentials mapped to buyer IDs
# Format: { email: (password, buyer_id) }
DEMO_CREDENTIALS = {
    "priya@jugaad.com":         ("jugaad123", 1),
    "anita@jugaad.com":         ("jugaad123", 2),
    "meena@jugaad.com":         ("jugaad123", 3),
    "kavya@jugaad.com":         ("jugaad123", 4),
    "bhoomigundecha@gmail.com": ("bhoomi123", 5),
}

# Hardcoded demo vendor credentials mapped to vendor IDs
# Format: { email: (password, vendor_id) }
DEMO_VENDOR_CREDENTIALS = {
    "rajesh@jugaad.com": ("jugaad123", 1),
}


class LoginRequest(BaseModel):
    email: str
    password: str


class VendorSignupRequest(BaseModel):
    name: str
    email: str
    shop_name: str
    password: str


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    entry = DEMO_CREDENTIALS.get(body.email.lower().strip())
    if not entry or entry[0] != body.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    buyer_id = entry[1]
    buyer = db.query(Buyer).filter(Buyer.id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found — run seed.py")

    return {
        "id":       buyer.id,
        "name":     buyer.name,
        "city":     buyer.city,
        "email":    body.email,
        "style":    buyer.negotiation_style,
        "language": buyer.language,
    }


@router.post("/vendor/login")
def vendor_login(body: LoginRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()

    # Hardcoded demo vendor first, then real vendors created via signup.
    entry = DEMO_VENDOR_CREDENTIALS.get(email)
    if entry and entry[0] == body.password:
        vendor = db.query(Vendor).filter(Vendor.id == entry[1]).first()
    else:
        vendor = db.query(Vendor).filter(
            Vendor.email == email, Vendor.password == body.password
        ).first()

    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    vendor_login_log(vendor.name, vendor.shop_name)

    return {
        "id":        vendor.id,
        "name":      vendor.name,
        "shop_name": vendor.shop_name,
        "email":     vendor.email,
    }


@router.post("/vendor/signup")
def vendor_signup(body: VendorSignupRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    name = body.name.strip()
    shop_name = body.shop_name.strip()

    if not name or not email or not shop_name or not body.password:
        raise HTTPException(status_code=400, detail="All fields are required")
    if email in DEMO_VENDOR_CREDENTIALS:
        raise HTTPException(status_code=400, detail="That email is already in use")
    if db.query(Vendor).filter(Vendor.email == email).first():
        raise HTTPException(status_code=400, detail="That email is already in use")

    vendor = Vendor(name=name, email=email, shop_name=shop_name, password=body.password)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)

    vendor_signup_log(vendor.name, vendor.shop_name, vendor.email)

    return {
        "id":        vendor.id,
        "name":      vendor.name,
        "shop_name": vendor.shop_name,
        "email":     vendor.email,
    }
