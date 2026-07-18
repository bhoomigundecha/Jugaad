"""
Ingest the product catalog into Qdrant for semantic search.

Embeds every product (name + description + category) via Nebius
Qwen3-Embedding-8B, upserts into a single Qdrant collection with product
metadata as payload (filterable alongside vector search — category, gender,
brand, price — so the Discovery Agent's search_product tool can combine
semantic search with hard filters in one query).

Run once after seeding the DB, and again any time the catalog changes:
    python3 scripts/ingest_qdrant.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PayloadSchemaType, TextIndexParams, TokenizerType

from database import SessionLocal, Product

COLLECTION_NAME = "jugaad_products"
EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B"
EMBEDDING_DIM = 4096
BATCH_SIZE = 16


def get_nebius_client() -> OpenAI:
    return OpenAI(base_url="https://api.studio.nebius.com/v1/", api_key=os.getenv("NEBIUS_API_KEY"))


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(url=os.getenv("QDRANT_ENDPOINT_URI"), api_key=os.getenv("QDRANT_API_KEY"), timeout=60)


def product_embedding_text(p: Product) -> str:
    parts = [p.name, p.gender or "", p.sub_category or "", p.category, p.description or ""]
    return ". ".join(part for part in parts if part).strip()


def ensure_collection(qc: QdrantClient):
    if qc.collection_exists(COLLECTION_NAME):
        qc.delete_collection(COLLECTION_NAME)
    qc.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
    )
    # Required for search_product's filters — Qdrant won't filter on a
    # payload field without an explicit index.
    qc.create_payload_index(collection_name=COLLECTION_NAME, field_name="category", field_schema=PayloadSchemaType.KEYWORD)
    qc.create_payload_index(collection_name=COLLECTION_NAME, field_name="gender", field_schema=PayloadSchemaType.KEYWORD)
    qc.create_payload_index(collection_name=COLLECTION_NAME, field_name="mrp", field_schema=PayloadSchemaType.FLOAT)
    qc.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="name",
        field_schema=TextIndexParams(type="text", tokenizer=TokenizerType.WORD, min_token_len=2, lowercase=True),
    )


def main():
    db = SessionLocal()
    products = db.query(Product).all()
    print(f"Loaded {len(products)} products from DB")

    nebius = get_nebius_client()
    qc = get_qdrant_client()
    ensure_collection(qc)

    total_upserted = 0
    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        texts = [product_embedding_text(p) for p in batch]

        resp = nebius.embeddings.create(model=EMBEDDING_MODEL, input=texts)
        vectors = [d.embedding for d in resp.data]

        points = [
            PointStruct(
                id=p.id,
                vector=vec,
                payload={
                    "product_id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "category": p.category,
                    "gender": p.gender,
                    "sub_category": p.sub_category,
                    "image_url": p.image_url,
                    "mrp": p.mrp,
                    "stock": p.stock,
                    "vendor_id": p.vendor_id,
                },
            )
            for p, vec in zip(batch, vectors)
        ]
        for attempt in range(3):
            try:
                qc.upsert(collection_name=COLLECTION_NAME, points=points)
                break
            except Exception as e:
                print(f"  batch at {i} failed (attempt {attempt + 1}/3): {e}")
                if attempt == 2:
                    raise
        total_upserted += len(points)
        print(f"  upserted {total_upserted}/{len(products)}")

    db.close()
    print(f"Done. {total_upserted} products indexed in Qdrant collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
