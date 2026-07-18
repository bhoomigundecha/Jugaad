"""
search_product tool
────────────────────
Nebius Qwen3-Embedding-8B embeds the query -> Qdrant semantic search over the
product catalog, with optional hard filters (category, price range) applied
alongside the vector search. This is the Discovery Agent's core tool — it can
be called once for a simple lookup, or several times in one turn (different
category each time) when the agent is assembling a multi-item recommendation.

Hybrid search: pure semantic search can rank a genuinely relevant item below
the cutoff when its name/description happens to use terser language than
competing products (verified directly — a product literally named "...Grey
Kurta" scored 0.618 against the query "kurta", below the top-30 threshold of
~0.69, because other kurta listings repeat ethnic-wear vocabulary more
densely). Fix: also try a strict keyword + vector combo first via Qdrant's
own full-text payload index (MatchText) — if that returns results, they're
guaranteed to literally contain the keyword, ranked by vector similarity
among matches. Falls back to pure semantic search if the keyword match is
too strict (e.g. no results, or no keyword given).
"""

import os
import time
from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchText, Range, SearchParams

from logger import nebius_embed_log, qdrant_query_log, qdrant_result_log, hybrid_fallback_log

COLLECTION_NAME = "jugaad_products"
EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B"

# Async clients — this is the Discovery Agent's hottest tool (fires on nearly
# every turn, sometimes several times in parallel via recommend_outfit's
# asyncio.gather), so a blocking/sync call here would stall FastAPI's event
# loop for every other concurrent buyer.
_nebius_client: AsyncOpenAI | None = None
_qdrant_client: AsyncQdrantClient | None = None


def get_nebius_client() -> AsyncOpenAI:
    global _nebius_client
    if _nebius_client is None:
        _nebius_client = AsyncOpenAI(base_url="https://api.studio.nebius.com/v1/", api_key=os.getenv("NEBIUS_API_KEY"))
    return _nebius_client


def get_qdrant_client() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = AsyncQdrantClient(
            url=os.getenv("QDRANT_ENDPOINT_URI"), api_key=os.getenv("QDRANT_API_KEY"), timeout=30
        )
    return _qdrant_client


def _base_conditions(gender: str | None, category: str | None, max_price: float | None, min_price: float | None) -> list:
    conditions = []
    if gender and gender != "Unisex":
        # Unisex buyer intent should see Unisex + gender-specific items, so
        # only filter strictly when a specific gender was actually given.
        conditions.append(FieldCondition(key="gender", match=MatchValue(value=gender)))
    if category:
        conditions.append(FieldCondition(key="category", match=MatchValue(value=category)))
    if max_price is not None or min_price is not None:
        conditions.append(FieldCondition(
            key="mrp",
            range=Range(gte=min_price, lte=max_price),
        ))
    return conditions


async def _run_query(qc: AsyncQdrantClient, vector: list[float], query_filter: Filter | None, limit: int):
    return (await qc.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        query_filter=query_filter,
        limit=limit,
        # Filtered HNSW search can miss genuinely relevant points when the
        # filtered subset is small relative to the collection — raising
        # hnsw_ef makes the graph search more exhaustive at query time. At
        # our catalog size (~865 points) this comfortably covers the whole
        # collection, so filtered queries get correct recall without
        # switching off ANN search.
        search_params=SearchParams(hnsw_ef=1024),
    )).points


async def search_product(
    query: str,
    keyword: str | None = None,
    gender: str | None = None,
    category: str | None = None,
    max_price: float | None = None,
    min_price: float | None = None,
    number_of_results: int = 10,
) -> dict:
    """
    Semantic product search. `gender` should be one of: Men, Women, Kids,
    Unisex — who the product is for; this is the primary audience filter and
    should almost always be set. `category` is a looser secondary bucket
    (Footwear, Bags, Watches, Jewellery, Ethnic Wear, etc.) — omit if unsure,
    semantic search alone usually finds the right items. `keyword` is the
    single core product-type word (e.g. "kurta", "sneakers") — used for an
    exact-match boost via Qdrant's full-text index, on top of the semantic
    `query`.
    """
    nebius = get_nebius_client()
    t0 = time.time()
    resp = await nebius.embeddings.create(model=EMBEDDING_MODEL, input=query)
    nebius_embed_log(query, int((time.time() - t0) * 1000))
    vector = resp.data[0].embedding

    base_conditions = _base_conditions(gender, category, max_price, min_price)

    filters_display = {}
    if gender:
        filters_display["gender"] = gender
    if category:
        filters_display["category"] = category
    if max_price is not None:
        filters_display["max_price"] = max_price
    if min_price is not None:
        filters_display["min_price"] = min_price

    qc = get_qdrant_client()
    results = []
    qdrant_latency_ms = 0

    # Tier 1: strict keyword (Qdrant full-text MatchText) + vector ranking —
    # guaranteed literal match, ranked by semantic similarity among matches.
    if keyword:
        keyword_filter = Filter(must=base_conditions + [FieldCondition(key="name", match=MatchText(text=keyword))])
        qdrant_query_log({**filters_display, "keyword": keyword}, number_of_results)
        t0 = time.time()
        results = await _run_query(qc, vector, keyword_filter, number_of_results)
        qdrant_latency_ms = int((time.time() - t0) * 1000)

    # Tier 2: fall back to pure semantic search if keyword match was too
    # strict (or no keyword given at all).
    if not results:
        if keyword:
            hybrid_fallback_log(keyword)
        query_filter = Filter(must=base_conditions) if base_conditions else None
        qdrant_query_log(filters_display, number_of_results)
        t0 = time.time()
        results = await _run_query(qc, vector, query_filter, number_of_results)
        qdrant_latency_ms = int((time.time() - t0) * 1000)

    products = [
        {
            "id": p.payload["product_id"],
            "name": p.payload["name"],
            "description": p.payload.get("description"),
            "category": p.payload["category"],
            "gender": p.payload.get("gender"),
            "sub_category": p.payload.get("sub_category"),
            "image_url": p.payload.get("image_url"),
            "mrp": p.payload["mrp"],
            "stock": p.payload.get("stock"),
            "relevance": round(p.score, 3),
        }
        for p in results
    ]
    qdrant_result_log(products, qdrant_latency_ms)
    return {"type": "product", "data": products}
