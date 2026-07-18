"""
update_shopping_list tool
────────────────────────────
Save-for-later, not immediate purchase — the "add Polo T-Shirts to my list,
not now" use case. Groq parses the buyer's natural-language request against
their current list (add / remove), DB-backed so it survives across sessions.
Each "add" is resolved to a real product via a quick search_product call
where possible, so the frontend can render an actual card, not just text.
"""

import json
import os
import httpx
from groq import AsyncGroq

from database import SessionLocal, ShoppingListItem, Product
from tools.search_product import search_product

_http_client = httpx.AsyncClient(trust_env=False)
_groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)


async def update_shopping_list(buyer_id: int, query: str) -> dict:
    db = SessionLocal()
    try:
        current_items = db.query(ShoppingListItem).filter(ShoppingListItem.buyer_id == buyer_id).all()
        current_labels = [
            (item.product.name if item.product else item.query_text) for item in current_items
        ]

        prompt = f"""Current shopping list:
{json.dumps(current_labels)}

Buyer's request: "{query}"

Return ONLY JSON: {{"add": ["item description", ...], "remove": ["exact item label from current list", ...]}}
Items in "add" should be short product descriptions suitable for a product search (e.g. "polo t-shirt for women").
Items in "remove" must exactly match a label from the current list, or be omitted if nothing should be removed."""

        response = await _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        diff = json.loads(response.choices[0].message.content)

        added, removed = [], []

        for label in diff.get("remove", []):
            for item in current_items:
                item_label = item.product.name if item.product else item.query_text
                if item_label == label:
                    db.delete(item)
                    removed.append(label)
                    break

        for desc in diff.get("add", []):
            product_id = None
            try:
                results = await search_product(desc, number_of_results=1)
                if results["data"]:
                    product_id = results["data"][0]["id"]
            except Exception:
                pass
            db.add(ShoppingListItem(buyer_id=buyer_id, product_id=product_id, query_text=desc))
            added.append(desc)

        db.commit()

        remaining = db.query(ShoppingListItem).filter(ShoppingListItem.buyer_id == buyer_id).all()
        items = [
            {
                "id": item.id,
                "product_id": item.product_id,
                "name": item.product.name if item.product else item.query_text,
                "image_url": item.product.image_url if item.product else None,
                "mrp": item.product.mrp if item.product else None,
            }
            for item in remaining
        ]

        return {"type": "shopping_list", "data": {"items": items, "added": added, "removed": removed}}
    finally:
        db.close()
