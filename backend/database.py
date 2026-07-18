from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    DateTime, Text, ForeignKey, Boolean, Enum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./molkaro.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class NegotiationOutcome(str, enum.Enum):
    success = "success"
    abandoned = "abandoned"
    in_progress = "in_progress"


class PaymentMethod(str, enum.Enum):
    prepaid = "prepaid"
    cod = "cod"
    pending = "pending"


# ── Models ────────────────────────────────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    shop_name = Column(String, nullable=False)
    password = Column(String, nullable=True)  # plaintext demo auth — nullable since the seeded demo vendor logs in via the hardcoded DEMO_VENDOR_CREDENTIALS map, not this column
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="vendor")
    negotiations = relationship("Negotiation", back_populates="vendor")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    gender = Column(String, nullable=True)         # Men / Women / Kids / Unisex — who it's for
    sub_category = Column(String, nullable=True)   # specific article type, e.g. Kurta, Sneakers, Watch
    image_url = Column(String, nullable=True)
    mrp = Column(Float, nullable=False)           # Max retail price shown to buyer
    seller_price = Column(Float, nullable=False)   # What vendor wants ideally
    floor_price = Column(Float, nullable=False)    # Absolute minimum, never revealed
    stock = Column(Integer, default=10)
    age_days = Column(Integer, default=0)          # Days since listed
    is_negotiable = Column(Boolean, default=True)   # Whether buyers can negotiate at all
    persona = Column(String, default="soft")        # soft / to_the_point / haggler — Priya's negotiation style for this product
    vendor_id = Column(Integer, ForeignKey("vendors.id"))

    vendor = relationship("Vendor", back_populates="products")
    negotiations = relationship("Negotiation", back_populates="product")


class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    negotiation_style = Column(String, default="moderate")  # soft / moderate / aggressive
    language = Column(String, default="hi-IN")  # Sarvam language_code, e.g. hi-IN, ta-IN, en-IN
    created_at = Column(DateTime, default=datetime.utcnow)

    negotiations = relationship("Negotiation", back_populates="buyer")
    shopping_list = relationship("ShoppingListItem", back_populates="buyer")


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))

    opening_price = Column(Float, nullable=True)   # Buyer's first offer
    final_price = Column(Float, nullable=True)      # Settled price
    outcome = Column(String, default=NegotiationOutcome.in_progress)
    payment_method = Column(String, default=PaymentMethod.pending)

    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    # Agent intelligence fields
    floor_price_used = Column(Float, nullable=True)
    tactics_used = Column(Text, nullable=True)      # JSON list of tactics
    full_transcript = Column(Text, nullable=True)   # Full conversation log
    persona = Column(String, nullable=True)          # Persona used this session — stored at start, future analytics groups by it

    product = relationship("Product", back_populates="negotiations")
    buyer = relationship("Buyer", back_populates="negotiations")
    vendor = relationship("Vendor", back_populates="negotiations")
    messages = relationship("NegotiationMessage", back_populates="negotiation")


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_id = Column(Integer, ForeignKey("negotiations.id"))
    role = Column(String, nullable=False)           # "agent" or "buyer"
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    negotiation = relationship("Negotiation", back_populates="messages")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    query_text = Column(String, nullable=True)  # raw text if no exact product match yet
    added_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("Buyer", back_populates="shopping_list")
    product = relationship("Product")


# ── DB dependency ─────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)


def reset_tables():
    """Drop and recreate all tables through the live connection/engine —
    use this instead of deleting the .db file directly. Deleting the file
    while a server process holds an open connection pool on it breaks that
    process (confirmed: crashed a running uvicorn --reload instance)."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
