"""
recommend_outfit tool
────────────────────────
Structured multi-item recommendation pipeline (not just "call search_product
a few times and hope") — mirrors Wally's run_recommendation_pipeline:

  1. Groq generates a short list of complementary item descriptions for the
     occasion/context (e.g. "wedding guest outfit" -> kurta set, jhumka
     earrings, mojari footwear).
  2. Each description is searched in parallel (asyncio.gather, not
     sequential) via search_product.
  3. Top result per item is kept.
  4. One more Groq call synthesizes a short pitch line referencing the
     actual selected products.
"""

import asyncio
import json
import os
import httpx
from groq import AsyncGroq

from tools.search_product import search_product

_http_client = httpx.AsyncClient(trust_env=False)
_groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)


async def recommend_outfit(context: str, budget: float | None = None, occasion: str | None = None) -> dict:
    budget_line = f"Budget: under ₹{budget:.0f} per item." if budget else ""
    prompt = f"""A shopper wants outfit help. Context: "{context}" {f'Occasion: {occasion}.' if occasion else ''} {budget_line}

Return ONLY JSON: {{"items": ["short product search description", ...]}}
Generate 2-4 complementary item descriptions (e.g. different categories: topwear, footwear, accessories/jewellery) that together form a coherent outfit for this context. Keep each description short and search-friendly, in English."""

    response = await _groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.6,
        max_tokens=200,
        response_format={"type": "json_object"},
    )
    plan = json.loads(response.choices[0].message.content)
    item_descriptions = plan.get("items", [])[:4]

    if not item_descriptions:
        return {"type": "recommendation", "data": [], "message": "Could not generate outfit ideas — try rephrasing."}

    search_kwargs = {"max_price": budget} if budget else {}
    results = await asyncio.gather(*[
        search_product(desc, number_of_results=3, **search_kwargs) for desc in item_descriptions
    ])

    selected = []
    for desc, result in zip(item_descriptions, results):
        if result["data"]:
            selected.append({"for": desc, "product": result["data"][0]})

    if not selected:
        return {"type": "recommendation", "data": [], "message": "No matching products found for this outfit."}

    products_summary = "\n".join(f"- {s['product']['name']} (₹{s['product']['mrp']:.0f})" for s in selected)
    pitch_prompt = f"""These products were picked for the outfit request "{context}":
{products_summary}

Write one warm, short (max 2 sentences) pitch line recommending this combination, like a helpful shopkeeper. Plain text, no markdown."""
    pitch_response = await _groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": pitch_prompt}],
        temperature=0.7,
        max_tokens=100,
    )
    pitch = pitch_response.choices[0].message.content.strip()

    return {
        "type": "recommendation",
        "data": [s["product"] for s in selected],
        "pitch": pitch,
    }
