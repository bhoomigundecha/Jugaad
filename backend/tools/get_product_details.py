"""
get_product_details tool
──────────────────────────
Fetches full product records by ID directly from the DB — cheap, no
embedding/API call needed. Used when the agent (or buyer) wants more info
about a product already surfaced in a prior search_product result, instead
of re-running a full semantic search.
"""

from database import SessionLocal, Product


def get_product_details(product_ids: list[int]) -> dict:
    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        return {
            "type": "product",
            "data": [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "category": p.category,
                    "image_url": p.image_url,
                    "mrp": p.mrp,
                    "stock": p.stock,
                }
                for p in products
            ],
        }
    finally:
        db.close()
