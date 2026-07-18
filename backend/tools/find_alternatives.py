"""
find_alternatives tool
────────────────────────
Called by the Negotiation Agent when a deal looks stuck (stall detection in
ws.py injects the nudge; the model decides whether to call this). Surfaces
other same-vendor products near the buyer's budget so Priya can pivot the
sale instead of losing it outright.
"""

from database import SessionLocal, Product


def find_alternatives(
    max_budget: float,
    vendor_id: int,
    category: str,
    exclude_product_id: int,
) -> dict:
    db = SessionLocal()
    try:
        ceiling = max_budget * 1.15
        base_query = db.query(Product).filter(
            Product.vendor_id == vendor_id,
            Product.id != exclude_product_id,
            Product.mrp <= ceiling,
            Product.stock > 0,
        )

        same_category = base_query.filter(Product.category == category).limit(3).all()
        results = list(same_category)
        if len(results) < 3:
            seen_ids = {p.id for p in results}
            more = (
                base_query.filter(Product.category != category)
                .limit(3 - len(results))
                .all()
            )
            results += [p for p in more if p.id not in seen_ids]

        return {
            "type": "product",
            "data": [
                {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "image_url": p.image_url,
                    "mrp": p.mrp,
                }
                for p in results
            ],
        }
    finally:
        db.close()
