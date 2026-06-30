"""
Seed Script — Demo data for Mol Karo hackathon demo
Run once: python seed.py
"""

from database import create_tables, SessionLocal, Vendor, Product, Buyer

def seed():
    create_tables()
    db = SessionLocal()

    # Clear existing data
    db.query(Buyer).delete()
    db.query(Product).delete()
    db.query(Vendor).delete()
    db.commit()

    # ── Vendor ────────────────────────────────────────────────────────────────
    vendor = Vendor(
        name="Rajesh Kumar",
        email="rajesh@fashionhouse.com",
        shop_name="Rajesh Fashion House",
    )
    db.add(vendor)
    db.flush()

    # ── Products ──────────────────────────────────────────────────────────────
    products = [
        Product(
            name="Bandhani Silk Dupatta",
            description="Handcrafted Gujarati Bandhani dupatta in vibrant reds and pinks. Perfect for festive occasions.",
            category="Ethnic Wear",
            image_url="https://images.meesho.com/images/products/49931609/htvs0_512.webp",
            mrp=899,
            seller_price=750,
            floor_price=620,
            stock=8,
            age_days=5,
            vendor_id=vendor.id,
        ),
        Product(
            name="Lucknowi Chikankari Kurti",
            description="Pure cotton kurti with hand-embroidered Chikankari work from Lucknow artisans.",
            category="Kurtis",
            image_url="https://images.meesho.com/images/products/49931609/htvs0_512.webp",
            mrp=1199,
            seller_price=950,
            floor_price=780,
            stock=3,
            age_days=45,
            vendor_id=vendor.id,
        ),
        Product(
            name="Jaipuri Block Print Bedsheet Set",
            description="Double bedsheet with 2 pillow covers. Pure cotton, hand block printed in Jaipur.",
            category="Home & Living",
            image_url="https://images.meesho.com/images/products/49931609/htvs0_512.webp",
            mrp=799,
            seller_price=650,
            floor_price=520,
            stock=25,
            age_days=15,
            vendor_id=vendor.id,
        ),
        Product(
            name="Oxidised Silver Jhumka Set",
            description="Handcrafted oxidised silver jhumkas with mirror work. Rajasthani artisan made.",
            category="Jewellery",
            image_url="https://images.meesho.com/images/products/49931609/htvs0_512.webp",
            mrp=499,
            seller_price=380,
            floor_price=280,
            stock=15,
            age_days=20,
            vendor_id=vendor.id,
        ),
    ]
    db.add_all(products)

    # ── Buyers ────────────────────────────────────────────────────────────────
    buyers = [
        Buyer(
            name="Priya Sharma",
            email="priya@example.com",
            city="Jaipur",
            state="Rajasthan",
            negotiation_style="moderate",
        ),
        Buyer(
            name="Anita Gupta",
            email="anita@example.com",
            city="Lucknow",
            state="Uttar Pradesh",
            negotiation_style="aggressive",
        ),
        Buyer(
            name="Meena Patel",
            email="meena@example.com",
            city="Surat",
            state="Gujarat",
            negotiation_style="soft",
        ),
    ]
    db.add_all(buyers)
    db.commit()

    print("✓ Seed complete!")
    print(f"  Vendor ID: {vendor.id} — {vendor.shop_name}")
    print(f"  Products: {len(products)}")
    print(f"  Buyers: {len(buyers)}")
    print()
    print("Buyer IDs for testing:")
    for b in buyers:
        db.refresh(b)
        print(f"  ID {b.id}: {b.name} ({b.negotiation_style})")

    db.close()


if __name__ == "__main__":
    seed()
