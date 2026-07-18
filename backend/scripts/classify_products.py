"""
Classify products into (gender, sub_category) via Groq, batched.

Reusable/idempotent — safe to re-run any time new products are added; only
classifies products where gender or sub_category is still NULL.

Cached to disk (data/classification_cache.json, keyed by product name) so a
DB rebuild (seed.py wipes and recreates on every run) doesn't force
re-spending Groq quota on products already classified once. Cache is applied
first, LLM only called for genuinely new names, and written incrementally
after every batch so a rate limit or crash mid-run doesn't lose progress.

Run after seed.py, before ingest_qdrant.py:
    python3 scripts/classify_products.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

import httpx
from groq import Groq

from database import SessionLocal, Product

BATCH_SIZE = 25
GENDERS = ["Men", "Women", "Kids", "Unisex"]
CACHE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "classification_cache.json")

_http_client = httpx.Client(trust_env=False)
client = Groq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)


def load_cache() -> dict[str, dict]:
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict[str, dict]):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def classify_batch(products: list[Product]) -> dict[int, dict]:
    items = [{"id": p.id, "name": p.name, "description": p.description or ""} for p in products]
    prompt = f"""Classify each product below into:
- "gender": one of {GENDERS} — who the product is for.
- "sub_category": a short, specific article-type label in Title Case, e.g. "Kurta", "T-Shirt", "Jeans", "Sneakers", "Sandals", "Sports Shoes", "Watch", "Necklace", "Earrings", "Dress", "Saree", "Jacket", "Shorts", "Trousers", "Bag", "Clutch". Be specific and consistent — use the same label for the same article type across products.

Products:
{json.dumps(items, ensure_ascii=False)}

Return ONLY JSON: {{"classifications": [{{"id": <id>, "gender": "...", "sub_category": "..."}}, ...]}} — one entry per product, same order."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content)
    return {c["id"]: c for c in data.get("classifications", [])}


def main():
    db = SessionLocal()
    cache = load_cache()
    print(f"Cache has {len(cache)} previously classified product names")

    unclassified = db.query(Product).filter(
        (Product.gender.is_(None)) | (Product.sub_category.is_(None))
    ).all()
    print(f"{len(unclassified)} products need classification")

    # Apply cache first — zero Groq calls for names we've already seen.
    still_unclassified = []
    cache_hits = 0
    for p in unclassified:
        cached = cache.get(p.name)
        if cached:
            p.gender = cached["gender"]
            p.sub_category = cached["sub_category"]
            cache_hits += 1
        else:
            still_unclassified.append(p)
    if cache_hits:
        db.commit()
        print(f"  {cache_hits} filled from cache, {len(still_unclassified)} need the LLM")

    total_done = 0
    for i in range(0, len(still_unclassified), BATCH_SIZE):
        batch = still_unclassified[i:i + BATCH_SIZE]
        try:
            classifications = classify_batch(batch)
        except Exception as e:
            print(f"  batch at {i} failed: {e}")
            continue

        for p in batch:
            c = classifications.get(p.id)
            if not c:
                continue
            gender = c.get("gender") if c.get("gender") in GENDERS else "Unisex"
            sub_category = c.get("sub_category") or p.category
            p.gender = gender
            p.sub_category = sub_category
            cache[p.name] = {"gender": gender, "sub_category": sub_category}

        db.commit()
        save_cache(cache)  # incremental — survives a rate limit hit mid-run
        total_done += len(batch)
        print(f"  classified {total_done}/{len(still_unclassified)}")

    db.close()
    print("Done.")


if __name__ == "__main__":
    main()
