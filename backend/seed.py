"""
Seed Script — Demo data for Mol Karo hackathon demo
Run once: python seed.py
"""

import json
import os
import random
import re

from database import reset_tables, SessionLocal, Vendor, Product, Buyer

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
# v2 uses the full-resolution (900x1200) dataset variant — the original
# catalog_seed.json's images were a genuinely low-res 60x80px mirror, a real
# bug caught during testing. v2 replaces it entirely.
CATALOG_PATH = os.path.join(DATA_DIR, "catalog_seed_v2.json")

# catalog_seed_v2.json stores HF-dataset images as relative paths
# (/product/hf2/...) served by the buyer Next.js app. That's fine when the
# buyer frontend itself renders them (same-origin), but the vendor Vite app
# runs on a different port/origin — a relative path there resolves against
# the vendor app's own origin and 404s. Absolutize at seed time so images
# load correctly from both apps.
FRONTEND_BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _absolutize_image_url(url: str | None) -> str | None:
    if url and url.startswith("/"):
        return f"{FRONTEND_BASE_URL}{url}"
    return url


# catalog_seed_v2.json's HF-dataset items have no fabric/material field at
# all (verified against the source dataset) — this is a typical-construction
# guess per article type, not a per-item ground truth, so Priya has *something*
# concrete to cite when defending a price ("this is genuine leather...").
ARTICLE_TYPE_MATERIAL = {
    "Tshirts": "a soft cotton blend",
    "Casual Shoes": "breathable canvas with a rubber sole",
    "Watches": "a stainless steel case with a leather strap",
    "Sandals": "genuine leather straps",
    "Heels": "faux leather with a cushioned insole",
    "Backpacks": "durable water-resistant polyester",
    "Tops": "a lightweight rayon blend",
    "Flip Flops": "soft EVA foam",
    "Sports Shoes": "mesh with a cushioned foam sole",
    "Handbags": "premium vegan leather",
    "Flats": "soft faux leather",
    "Shirts": "pure cotton",
    "Sunglasses": "UV-protected polycarbonate lenses",
    "Wallets": "genuine leather",
    "Formal Shoes": "genuine leather",
    "Briefs": "breathable cotton",
    "Sarees": "pure georgette",
    "Belts": "genuine leather",
    "Jeans": "stretch denim",
    "Dresses": "soft crepe fabric",
    "Socks": "combed cotton",
    "Shorts": "a cotton blend",
    "Caps": "cotton twill",
    "Swimwear": "a quick-dry polyester blend",
    "Nightdress": "soft cotton",
    "Night suits": "soft cotton",
    "Capris": "stretch cotton",
    "Bracelet": "oxidised metal",
    "Messenger Bag": "durable canvas",
    "Pendant": "sterling silver-plated metal",
    "Track Pants": "moisture-wicking polyester",
    "Kurtas": "pure cotton",
    "Clutches": "a satin finish",
    "Ring": "silver-plated alloy",
    "Shoe Accessories": "a durable synthetic material",
}

# Real fabric mentions to surface from Tata CLiQ's scraped product titles
# (e.g. "U.S. Polo Assn. Blue Cotton Striped T-Shirt" -> "cotton") — these
# are genuine retailer-authored details, not guesses.
FABRIC_KEYWORDS = [
    "cotton", "silk", "leather", "denim", "wool", "linen", "satin",
    "georgette", "chiffon", "velvet", "rayon", "nylon", "suede", "canvas",
    "polyester", "cashmere", "jute", "khadi", "chikankari", "bandhani",
    "viscose", "fleece", "corduroy", "lycra", "spandex",
]


def _extract_fabric(name: str) -> str | None:
    lower = name.lower()
    for kw in FABRIC_KEYWORDS:
        if kw in lower:
            return kw
    return None


# Tata CLiQ scraped dumps -> (category label, gender label)
TATACLIQ_FILES = {
    "tatacliq_mens_topwear.json":            ("Men", "Men"),
    "tatacliq_womens_clothing.json":         ("Women", "Women"),
    "tatacliq_scraped_kids.json":            ("Kids", "Kids"),
    "tatacliq_scraped_mens_clothing.json":   ("Men", "Men"),
    "tatacliq_scraped_mens_footwear.json":   ("Footwear", "Men"),
    "tatacliq_scraped_watches.json":         ("Watches", "Unisex"),
    "tatacliq_scraped_western_dresses.json": ("Women", "Women"),
    "tatacliq_scraped_womens_clothing.json": ("Women", "Women"),
    "tatacliq_scraped_womens_footwear.json": ("Footwear", "Women"),
    "tatacliq_scraped_womens_western.json":  ("Women", "Women"),
    "tatacliq_scraped_ethnic_dresses.json":  ("Ethnic Wear", "Women"),
    "tatacliq_scraped_ethnic_bottoms.json":  ("Ethnic Wear", "Women"),
}


def load_catalog_products(vendor_id: int) -> list[Product]:
    """Loads the HF-dataset-sourced catalog (backend/data/catalog_seed.json)."""
    if not os.path.exists(CATALOG_PATH):
        return []
    with open(CATALOG_PATH, encoding="utf-8") as f:
        items = json.load(f)
    products = []
    for item in items:
        description = item["description"]
        material = ARTICLE_TYPE_MATERIAL.get(item.get("article_type"))
        if material:
            description = f"{description} Made from {material}."
        products.append(Product(
            name=item["name"],
            description=description,
            category=item["category"],
            gender=item.get("gender"),
            sub_category=item.get("article_type"),
            image_url=_absolutize_image_url(item["image_url"]),
            mrp=item["mrp"],
            seller_price=item["seller_price"],
            floor_price=item["floor_price"],
            stock=item["stock"],
            age_days=item["age_days"],
            is_negotiable=True,
            vendor_id=vendor_id,
        ))
    return products


def _parse_price(raw: str | None) -> float | None:
    if not raw:
        return None
    match = re.search(r"[\d,]+", raw.replace("₹", ""))
    return float(match.group().replace(",", "")) if match else None


def load_tatacliq_products(vendor_id: int) -> list[Product]:
    """Loads all scraped Tata CLiQ dumps (backend/data/tatacliq_*.json)."""
    random.seed(7)
    products = []
    for filename, (category, gender) in TATACLIQ_FILES.items():
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            items = json.load(f)
        for item in items:
            if item.get("image_url") in (None, "Image not available"):
                continue
            mrp = _parse_price(item.get("original_price")) or _parse_price(item.get("current_price"))
            seller_price = _parse_price(item.get("current_price")) or mrp
            if not mrp or not seller_price:
                continue
            floor_price = round(seller_price * random.uniform(0.72, 0.86) / 10) * 10
            brand = item.get("brand_name", "").strip() or "a trusted brand"
            fabric = _extract_fabric(item["product_name"])
            article = "An" if category[0].lower() in "aeiou" else "A"
            if fabric:
                description = f"{article} {category.lower()} piece by {brand}, made from {fabric} for lasting quality and comfort."
            else:
                description = f"{article} {category.lower()} piece by {brand} — a well-loved style from their current collection."
            products.append(Product(
                name=item["product_name"],
                description=description,
                category=category,
                gender=gender,
                image_url=_absolutize_image_url(item["image_url"]),
                mrp=mrp,
                seller_price=seller_price,
                floor_price=min(floor_price, seller_price - 10),
                stock=random.randint(3, 25),
                age_days=random.randint(1, 60),
                is_negotiable=True,
                vendor_id=vendor_id,
            ))
    return products


def seed():
    # Drop + recreate through the live engine — safe to run against a server
    # that's already up (unlike deleting the .db file, which breaks an open
    # connection pool), and picks up schema changes (new columns) that a
    # plain create_all() would silently skip on existing tables.
    reset_tables()
    db = SessionLocal()

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
            gender="Women",
            sub_category="Dupatta",
            image_url=f"{FRONTEND_BASE_URL}/product/bandhni_silk_dupatta.png",
            mrp=899,
            seller_price=750,
            floor_price=620,
            stock=8,
            age_days=5,
            is_negotiable=True,
            persona="haggler",
            vendor_id=vendor.id,
        ),
        Product(
            name="Lucknowi Chikankari Kurti",
            description="Pure cotton kurti with hand-embroidered Chikankari work from Lucknow artisans.",
            category="Kurtis",
            gender="Women",
            sub_category="Kurti",
            image_url=f"{FRONTEND_BASE_URL}/product/lucknow_chikankari_kurti.png",
            mrp=1199,
            seller_price=950,
            floor_price=780,
            stock=3,
            age_days=45,
            is_negotiable=True,
            persona="soft",
            vendor_id=vendor.id,
        ),
        Product(
            name="Jaipuri Block Print Bedsheet Set",
            description="Double bedsheet with 2 pillow covers. Pure cotton, hand block printed in Jaipur.",
            category="Home & Living",
            gender="Unisex",
            sub_category="Bedsheet",
            image_url="https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600",
            mrp=799,
            seller_price=650,
            floor_price=520,
            stock=25,
            age_days=15,
            is_negotiable=True,
            persona="to_the_point",
            vendor_id=vendor.id,
        ),
        Product(
            name="Oxidised Silver Jhumka Set",
            description="Handcrafted oxidised silver jhumkas with mirror work. Rajasthani artisan made.",
            category="Jewellery",
            gender="Women",
            sub_category="Jhumka",
            image_url="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600",
            mrp=499,
            seller_price=380,
            floor_price=280,
            stock=15,
            age_days=20,
            is_negotiable=True,
            persona="soft",
            vendor_id=vendor.id,
        ),
    ]
    catalog_products = load_catalog_products(vendor.id)
    tatacliq_products = load_tatacliq_products(vendor.id)
    products = products + catalog_products + tatacliq_products
    db.add_all(products)

    # ── Buyers ────────────────────────────────────────────────────────────────
    buyers = [
        Buyer(
            name="Priya Sharma",
            email="priya@example.com",
            city="Jaipur",
            state="Rajasthan",
            negotiation_style="moderate",
            language="hi-IN",
        ),
        Buyer(
            name="Anita Gupta",
            email="anita@example.com",
            city="Lucknow",
            state="Uttar Pradesh",
            negotiation_style="aggressive",
            language="hi-IN",
        ),
        Buyer(
            name="Meena Patel",
            email="meena@example.com",
            city="Surat",
            state="Gujarat",
            negotiation_style="soft",
            language="gu-IN",
        ),
        Buyer(
            name="Kavya Reddy",
            email="kavya@example.com",
            city="Chennai",
            state="Tamil Nadu",
            negotiation_style="moderate",
            language="ta-IN",
        ),
        Buyer(
            name="Bhoomi Gundecha",
            email="bhoomigundecha@gmail.com",
            city="Mumbai",
            state="Maharashtra",
            negotiation_style="moderate",
            language="en-IN",
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
