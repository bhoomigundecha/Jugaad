"""
Price Intelligence Agent
────────────────────────
Computes negotiation parameters before the conversation starts.
Feeds the Negotiation Agent with: floor price, flexibility budget,
opening counter, and which tactics to deploy.
"""

from dataclasses import dataclass, field
from typing import List
from database import Product, Buyer
from logger import agent_header, info, price_info, tactics_info, persona_selected_log

# ── Persona biases — soft/to_the_point/haggler drive opening anchor, tactic
# mix, and how the concession gap is meant to close round over round. Persona
# is chosen per-product by the vendor (AddListing "Priya AI" step) and is now
# the primary bargaining-style driver, replacing buyer.negotiation_style.
PERSONA_OPENING_PCT = {
    "soft":          0.93,
    "to_the_point":  0.99,
    "haggler":       1.04,
}

PERSONA_TACTICS = {
    "soft":          ["quick_close", "reciprocity"],
    "to_the_point":  ["firm_hold"],
    "haggler":       ["scarcity", "flattery", "anchor_high"],
}

PERSONA_CONCESSION_CURVE = {
    "soft": (
        "Concede quickly and warmly — aim to close within 2-3 rounds, giving "
        "away roughly a third of the remaining gap to the target each round."
    ),
    "to_the_point": (
        "Make at most 2-3 counters total. State a near-final price early and "
        "hold it — concede only once more, then declare it final."
    ),
    "haggler": (
        "Draw it out — concede in small, shrinking steps across 4-6+ rounds, "
        "each concession smaller and more theatrical than the last, so the "
        "buyer feels they won it out of you."
    ),
}


@dataclass
class NegotiationParams:
    floor_price: float          # Absolute minimum — never share with buyer
    target_price: float         # Aim to close here or above
    opening_counter: float      # First counter-offer from agent
    flexibility_pct: float      # How much % room agent has from floor to MRP
    tactics: List[str]          # Ordered list of tactics to use
    buyer_style: str            # soft / moderate / aggressive
    scarcity_signal: bool       # Whether to use "stock is low" signal
    product_context: str        # One-line Hindi hint for the agent
    persona: str                 # soft / to_the_point / haggler — this product's negotiation persona
    concession_curve: str        # How the gap should close round over round, for this persona


def compute_negotiation_params(product: Product, buyer: Buyer) -> NegotiationParams:
    """
    Core intelligence: given a product and buyer, decide how to negotiate.
    """
    mrp = product.mrp
    floor = product.floor_price
    seller_price = product.seller_price
    age = product.age_days
    stock = product.stock
    persona = product.persona or "soft"

    # ── Flexibility based on product age ─────────────────────────────────────
    # Fresh product (<7 days): very little flexibility
    # Mid-age (7-30 days): moderate
    # Old (30+ days): willing to negotiate harder to clear stock
    if age < 7:
        age_flexibility = 0.02       # 2% room
    elif age < 30:
        age_flexibility = 0.05       # 5% room
    else:
        age_flexibility = 0.10       # 10% room — clear old stock

    # ── Flexibility based on stock level ─────────────────────────────────────
    scarcity_signal = stock <= 5
    if stock <= 3:
        stock_flexibility = -0.02    # Low stock → less flexible (can sell to others)
    elif stock > 20:
        stock_flexibility = 0.03     # High stock → more flexible
    else:
        stock_flexibility = 0.0

    # ── Total flexibility budget ──────────────────────────────────────────────
    # This is how much below seller_price the agent can go (but never below floor)
    raw_flexibility = age_flexibility + stock_flexibility
    flex_amount = mrp * raw_flexibility
    effective_floor = max(floor, seller_price - flex_amount)

    # ── Opening counter ───────────────────────────────────────────────────────
    # Persona sets the anchor: soft opens below MRP, to_the_point opens near
    # MRP, haggler opens ABOVE MRP for dramatic effect before conceding.
    opening_pct = PERSONA_OPENING_PCT.get(persona, 0.97)
    opening_counter = round(mrp * opening_pct, -1)   # Round to nearest 10

    # ── Target price ─────────────────────────────────────────────────────────
    # We want to close between seller_price and mrp
    target_price = round((seller_price + mrp) / 2, -1)

    # ── Tactics selection ─────────────────────────────────────────────────────
    tactics = []

    if scarcity_signal:
        tactics.append("scarcity")          # "Sirf 3 piece bacha hai"

    if age > 30:
        tactics.append("value_add")         # Offer free delivery instead of price cut
    else:
        tactics.append("anchor_high")       # Start high, come down slowly

    # Persona is the primary bargaining-style driver (per-product, chosen by
    # the vendor) — it replaces the old buyer.negotiation_style-based branch.
    for t in PERSONA_TACTICS.get(persona, PERSONA_TACTICS["soft"]):
        if t not in tactics:
            tactics.append(t)

    tactics.append("prepaid_nudge")         # Always end with UPI cashback nudge

    concession_curve = PERSONA_CONCESSION_CURVE.get(persona, PERSONA_CONCESSION_CURVE["soft"])

    # ── Product context hint for agent ───────────────────────────────────────
    if scarcity_signal:
        product_context = f"Sirf {stock} piece bacha hai, demand zyada hai."
    elif age > 30:
        product_context = "Yeh product kaafi time se hai, par quality top-notch hai."
    else:
        product_context = "Naya collection hai, bahut demand chal rahi hai."

    params = NegotiationParams(
        floor_price=effective_floor,
        target_price=target_price,
        opening_counter=opening_counter,
        flexibility_pct=raw_flexibility * 100,
        tactics=tactics,
        buyer_style=buyer.negotiation_style,
        scarcity_signal=scarcity_signal,
        product_context=product_context,
        persona=persona,
        concession_curve=concession_curve,
    )

    # ── Demo terminal output ──────────────────────────────────────────────────
    agent_header(1, 4, "Price Intelligence Agent")
    info("Product",      product.name)
    info("MRP",          f"₹{mrp:.0f}")
    info("Age",          f"{age} days  →  flexibility {raw_flexibility * 100:.0f}%")
    info("Stock",        f"{stock} units{'  →  scarcity signal ON' if scarcity_signal else ''}")
    info("Buyer style",  buyer.negotiation_style)
    price_info("Floor price",   effective_floor, "hard minimum — never shared with buyer")
    price_info("Target price",  target_price,    "ideal close price")
    price_info("Opening ask",   opening_counter, "anchor high strategy")
    tactics_info(tactics)
    persona_selected_log(persona, tactics, opening_pct * 100)

    return params
