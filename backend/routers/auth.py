"""
Auth router — simple email/password login for hackathon demo.
Credentials are seeded alongside buyer data in seed.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db, Buyer

router = APIRouter(prefix="/auth", tags=["auth"])

# Hardcoded demo credentials mapped to buyer IDs
# Format: { email: (password, buyer_id) }
DEMO_CREDENTIALS = {
    "priya@jugaad.com":  ("jugaad123", 1),
    "anita@jugaad.com":  ("jugaad123", 2),
    "meena@jugaad.com":  ("jugaad123", 3),
}


class LoginRequest(BaseModel):
    email: str
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
        "id":    buyer.id,
        "name":  buyer.name,
        "city":  buyer.city,
        "email": body.email,
        "style": buyer.negotiation_style,
    }
