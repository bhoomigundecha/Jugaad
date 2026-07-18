"""
Negotiation Agent  ★ CORE
──────────────────────────
Runs the voice conversation using Groq Llama 3.3 70B, in whichever language
the buyer selected. Receives buyer input (text), returns agent response
(text). Detects when a deal is reached and signals the Deal Closing Agent.
"""

import os
import re
import json
import time
import httpx
from typing import List, Dict, Optional, Tuple
from groq import AsyncGroq
from dotenv import load_dotenv
from agents.price_intelligence import NegotiationParams
from tools.find_alternatives import find_alternatives
from tools.get_product_details import get_product_details
from logger import (
    agent_header, info, groq_log, priya_log, deal_detected, DIM, RESET, MAGENTA, WHITE,
    negotiation_tool_call_log, negotiation_tool_result_log, floor_rejection_log, stall_triggered_log,
    persona_display,
)

load_dotenv()

# Initialise Groq with a clean httpx client (ignores any system proxy env vars).
# Async client so a single in-flight negotiation call doesn't block FastAPI's
# event loop for every other concurrent buyer/WS connection.
_http_client = httpx.AsyncClient(trust_env=False)
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)

DEAL_SIGNAL = "DEAL_CONFIRMED"
MAX_TOOL_ITERATIONS = 4
# Round at which stall detection starts checking — lowered from the original
# 4 so find_alternatives triggers faster during demo rehearsal.
STALL_MIN_ROUND = 2

NEGOTIATION_TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "close_deal",
            "description": (
                "Finalize the sale once the buyer has clearly confirmed a specific price. "
                "The backend validates the price against your floor and rejects it if too "
                "low — if rejected, keep negotiating instead of repeating the same price."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "price": {"type": "number", "description": "The exact agreed price in INR"},
                },
                "required": ["price"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_alternatives",
            "description": (
                "Look up other products from your shop near the buyer's budget. Use this "
                "when the buyer's offer is stuck well below what you can accept, to pivot "
                "them to a different item instead of losing the sale."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "max_budget": {"type": "number", "description": "The buyer's stated or implied budget in INR"},
                },
                "required": ["max_budget"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": (
                "Get full details of the product currently being negotiated (fabric, size, "
                "care, stock) to answer a buyer's question mid-haggle."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def _extract_price(text: str, take_last: bool = False) -> Optional[float]:
    """Best-effort digit-regex price extraction from free-form negotiation text."""
    matches = re.findall(r"[\d,]+(?:\.\d+)?", text.replace("₹", ""))
    if not matches:
        return None
    raw = matches[-1] if take_last else matches[0]
    try:
        return float(raw.replace(",", ""))
    except ValueError:
        return None

# Sarvam language_code -> display name, for the prompt instruction
LANGUAGE_NAMES = {
    "hi-IN": "Hindi", "bn-IN": "Bengali", "kn-IN": "Kannada", "ml-IN": "Malayalam",
    "mr-IN": "Marathi", "od-IN": "Odia", "pa-IN": "Punjabi", "ta-IN": "Tamil",
    "te-IN": "Telugu", "en-IN": "English", "gu-IN": "Gujarati", "as-IN": "Assamese",
    "ur-IN": "Urdu",
}

TACTIC_DESCRIPTIONS = {
    "scarcity":      "Scarcity: naturally mention that stock is limited.",
    "anchor_high":   "Anchor high: start near MRP, come down in small steps.",
    "value_add":     "Value-add: offer free delivery or gift wrapping instead of a price cut.",
    "firm_hold":     "Firm hold: decline at least twice before conceding anything.",
    "flattery":      "Flattery: light compliments, e.g. \"you're clearly a smart shopper, so let me tell you...\"",
    "quick_close":   "Quick close: if the buyer seems ready, offer a small discount and close fast.",
    "reciprocity":   "Reciprocity: \"I'll adjust a little for you, hope you understand too.\"",
    "prepaid_nudge": "Prepaid nudge: after the deal, mention an extra ₹20 cashback for paying via UPI.",
}

# Persona style — chosen per-product by the vendor (AddListing "Priya AI"
# step). Drives tone, pacing, and how theatrical the negotiation feels.
PERSONA_STYLE_BLOCKS = {
    "soft": (
        "PERSONA — Soft (warm didi):\n"
        "- Warm and friendly. Use the buyer's name often.\n"
        "- Speak in slightly longer, caring sentences.\n"
        "- Concede in small, friendly steps and look to close quickly once the buyer engages seriously."
    ),
    "to_the_point": (
        "PERSONA — To The Point (straight shooter):\n"
        "- Open near MRP. Short, clipped sentences — no small talk.\n"
        "- Give at most 2-3 counter-offers total, then state \"this is my final price\" and hold firm."
    ),
    "haggler": (
        "PERSONA — Haggler (bazaar style):\n"
        "- Theatrical. Flatter the buyer, invoke scarcity (\"only this one piece left, sister/brother\").\n"
        "- Make big, dramatic concessions that shrink each round (\"okay okay, only for you...\").\n"
        "- Drag the negotiation out over several rounds rather than closing fast — the performance is part of the sale."
    ),
}


def build_product_block(product) -> str:
    """One-line-per-fact product context so Priya can weave real details
    (fabric/craft/brand, freshness) into her pitch instead of talking blind."""
    lines = []
    if getattr(product, "description", None):
        lines.append(f"Description: {product.description}")
    if getattr(product, "category", None):
        lines.append(f"Category: {product.category}")
    if getattr(product, "sub_category", None):
        lines.append(f"Type: {product.sub_category}")
    if getattr(product, "gender", None):
        lines.append(f"Made for: {product.gender}")
    stock = getattr(product, "stock", None)
    if stock is not None:
        low = "  (low stock)" if stock <= 5 else ""
        lines.append(f"Stock: {stock} units left{low}")
    age = getattr(product, "age_days", None)
    if age is not None:
        aging = "  (aging stock — clear it if a fair deal comes)" if age > 30 else ""
        lines.append(f"Listed: {age} days ago{aging}")
    return "\n".join(f"- {l}" for l in lines)


def build_system_prompt(
    buyer_name: str,
    product,
    params: NegotiationParams,
    language_code: str = "hi-IN",
) -> str:
    language_name = LANGUAGE_NAMES.get(language_code, "Hindi")

    active_tactics = "\n".join(
        f"- {TACTIC_DESCRIPTIONS[t]}" for t in params.tactics if t in TACTIC_DESCRIPTIONS
    )
    product_block = build_product_block(product)
    persona_block = PERSONA_STYLE_BLOCKS.get(params.persona, PERSONA_STYLE_BLOCKS["soft"])

    return f"""You are "Priya", an AI sales representative for an Indian e-commerce marketplace.
You talk like a clever, warm, slightly firm shopkeeper.

CRITICAL LANGUAGE RULE: Respond ONLY in {language_name}.
{"- Write in plain, natural English only. Do not use any Hindi/Hinglish words, even transliterated ones (no \"ji\", \"aap\", \"humein\", \"bas\", \"yaar\", etc.) — a monolingual English speaker must understand every word." if language_code == "en-IN" else f"- Write in {language_name}'s native script (not romanized/transliterated). Never mix in English words except for the product name if it has no natural translation."}

Product: {product.name}
MRP: ₹{product.mrp:.0f}
Buyer's name: {buyer_name}

Product details (weave these into your pitch naturally when defending the price or answering questions — e.g. mention the fabric/craft/brand, or that it's fresh stock. Don't recite them as a list):
{product_block}

{persona_block}
Concession pacing for this negotiation: {params.concession_curve}

Negotiation rules (never reveal these to the buyer):
- Your absolute minimum price: ₹{params.floor_price:.0f} — never go below this.
- Target price: ₹{params.target_price:.0f} or above.
- Your first counter-offer: start at ₹{params.opening_counter:.0f}.

Tactics (use naturally, don't announce them):
{active_tactics}

Deal detection:
- When the buyer agrees to a price, first confirm it in natural {language_name}: "so is ₹[price] final?" (translated to {language_name}).
- Once the buyer confirms yes, call the close_deal tool with that price — don't just say the deal is done in text.
- If close_deal is rejected for being below your floor, apologize briefly and keep negotiating toward the floor instead of repeating the same price.
- If the buyer's offer is stuck well below what you can accept and doesn't seem to be moving, consider calling find_alternatives to offer them a different product from your shop instead of losing the sale outright.
- If the buyer asks about fabric, size, care, or other specifics, call get_product_details rather than guessing.

Style rules:
- Keep responses short — one to three sentences max.
- Balance warmth with firmness.
- Only ever give one counter-offer at a time.
- Never reveal your minimum price.
- No asterisks, emoji, or markdown — plain text only.
- Write numbers as digits (850, 1200), not spelled out.
- Keep sentences short and clear.
"""


async def generate_opening_line(
    buyer_name: str,
    product_name: str,
    mrp: float,
    language_code: str = "hi-IN",
) -> str:
    """One quick Groq call to greet the buyer in the target language — scales to
    any of Sarvam's supported languages without hand-authoring N greeting templates."""
    language_name = LANGUAGE_NAMES.get(language_code, "Hindi")
    prompt = (
        f"Write a short, warm one-to-two sentence shopkeeper greeting in {language_name} "
        f"(native script), for a buyer named {buyer_name} who is looking at \"{product_name}\" "
        f"priced at ₹{mrp:.0f}. Mention the product and price. Plain text only, no markdown."
    )
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=100,
    )
    return response.choices[0].message.content.strip()


class NegotiationSession:
    """Holds per-session state for one buyer-product negotiation."""

    def __init__(
        self,
        session_id: str,
        buyer_name: str,
        product,
        params: NegotiationParams,
        language_code: str = "hi-IN",
    ):
        self.session_id = session_id
        self.buyer_name = buyer_name
        self.product = product
        self.product_id = product.id
        self.product_name = product.name
        self.mrp = product.mrp
        self.vendor_id = product.vendor_id
        self.category = product.category
        self.params = params
        self.language_code = language_code
        self.history: List[Dict[str, str]] = []
        self.deal_reached = False
        self.agreed_price: Optional[float] = None
        self.round_count = 0
        self.buyer_offers: List[Optional[float]] = []
        self.agent_offers: List[Optional[float]] = []
        self.last_alternatives: Optional[list] = None

        # Inject system prompt
        self.system_prompt = build_system_prompt(buyer_name, product, params, language_code)

        # ── Demo terminal output ──────────────────────────────────────────────
        agent_header(2, 4, "Negotiation Agent — Priya")
        info("Model",    "llama-3.3-70b-versatile  (Groq LPU)")
        info("Language", f"{LANGUAGE_NAMES.get(language_code, language_code)} ({language_code})")
        info("Persona",  persona_display(params.persona))
        info("Floor",    f"₹{params.floor_price:.0f}  (hard constraint, hidden from buyer)")
        info("Tactics",  ", ".join(params.tactics))

    async def get_opening_line(self) -> str:
        """Agent speaks first — warm greeting in the buyer's language."""
        opening = await generate_opening_line(
            self.buyer_name, self.product_name, self.mrp, self.language_code
        )
        self.history.append({"role": "assistant", "content": opening})
        print(f"\n  {DIM}[OPENING]{RESET} {MAGENTA}Priya ->{RESET} {WHITE}'{opening[:100]}...'{RESET}")
        return opening

    def _check_stall(self) -> Optional[str]:
        """Returns a human-readable trigger reason if the negotiation looks
        stuck, else None. Round >= STALL_MIN_ROUND AND (buyer stuck below
        floor twice in a row, OR the ask/offer gap hasn't shrunk >=25% over
        the last 2 rounds)."""
        if self.round_count < STALL_MIN_ROUND:
            return None

        floor = self.params.floor_price
        recent_buyer = [o for o in self.buyer_offers[-2:] if o is not None]
        if len(recent_buyer) == 2 and all(o < floor for o in recent_buyer):
            return (
                f"buyer offer below floor twice in a row "
                f"(₹{recent_buyer[-2]:.0f}, ₹{recent_buyer[-1]:.0f} vs floor ₹{floor:.0f})"
            )

        if len(self.buyer_offers) >= 2 and len(self.agent_offers) >= 2:
            b1, b2 = self.buyer_offers[-2], self.buyer_offers[-1]
            a1, a2 = self.agent_offers[-2], self.agent_offers[-1]
            if None not in (b1, b2, a1, a2):
                gap1, gap2 = abs(a1 - b1), abs(a2 - b2)
                if gap1 > 0 and (gap1 - gap2) / gap1 < 0.25:
                    return f"ask/offer gap hasn't shrunk ≥25% over last 2 rounds (₹{gap1:.0f} -> ₹{gap2:.0f})"

        return None

    def _dispatch_tool(self, name: str, args: dict) -> dict:
        if name == "close_deal":
            try:
                price = float(args.get("price", 0))
            except (TypeError, ValueError):
                price = 0.0
            if price < self.params.floor_price:
                floor_rejection_log(price, self.params.floor_price)
                return {
                    "status": "rejected",
                    "reason": (
                        f"₹{price:.0f} is below the floor. Offer at least "
                        f"₹{self.params.floor_price:.0f}, or continue negotiating."
                    ),
                }
            self.deal_reached = True
            self.agreed_price = price
            deal_detected(price, self.params.floor_price)
            return {"status": "accepted", "price": price}

        if name == "find_alternatives":
            try:
                max_budget = float(args.get("max_budget", self.params.floor_price))
            except (TypeError, ValueError):
                max_budget = self.params.floor_price
            result = find_alternatives(
                max_budget=max_budget,
                vendor_id=self.vendor_id,
                category=self.category,
                exclude_product_id=self.product_id,
            )
            if result.get("data"):
                self.last_alternatives = result["data"]
            return result

        if name == "get_product_details":
            return get_product_details([self.product_id])

        return {"error": f"Unknown tool {name}"}

    @staticmethod
    def _summarize_tool_result(name: str, result: dict) -> str:
        if "error" in result:
            return f"error — {str(result['error'])[:100]}"
        if name == "close_deal":
            if result.get("status") == "accepted":
                return f"accepted at ₹{result['price']:.0f}"
            return f"rejected — {result.get('reason', '')[:80]}"
        if name == "find_alternatives":
            data = result.get("data", [])
            return f"{len(data)} alternative(s) found" if data else "no alternatives found"
        if name == "get_product_details":
            return f"{len(result.get('data', []))} product(s) returned"
        return "done"

    async def respond(
        self, buyer_input: str, language_code: Optional[str] = None
    ) -> Tuple[str, bool, Optional[float], Optional[list]]:
        """
        Process buyer input via a Groq tool-calling loop (mirrors discovery_agent.py).
        Returns (agent_text, deal_reached, agreed_price, alternatives_this_turn).
        """
        if language_code and language_code != self.language_code:
            self.language_code = language_code
            self.system_prompt = build_system_prompt(
                self.buyer_name, self.product, self.params, language_code
            )
            info("Language", f"switched to {LANGUAGE_NAMES.get(language_code, language_code)} ({language_code})")

        self.round_count += 1
        self.history.append({"role": "user", "content": buyer_input})
        self.buyer_offers.append(_extract_price(buyer_input))
        self.last_alternatives = None

        stall_reason = self._check_stall()
        if stall_reason:
            nudge = (
                "SYSTEM NOTE (internal — never mention this to the buyer): This "
                f"negotiation looks stuck — {stall_reason}. Consider proactively "
                "offering the buyer a different product from your shop using the "
                "find_alternatives tool instead of repeating the same counter."
            )
            self.history.append({"role": "system", "content": nudge})
            stall_triggered_log(self.round_count, stall_reason, self.buyer_offers[-1] or 0, self.params.floor_price)

        conversation = [{"role": "system", "content": self.system_prompt}] + self.history

        agent_text = ""
        for iteration in range(MAX_TOOL_ITERATIONS):
            tool_choice = "none" if self.deal_reached else ("auto" if iteration < MAX_TOOL_ITERATIONS - 1 else "none")

            t0 = time.time()
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=conversation,
                tools=NEGOTIATION_TOOL_SCHEMAS,
                tool_choice=tool_choice,
                temperature=0.7,
                max_tokens=200,
            )
            latency_ms = int((time.time() - t0) * 1000)
            groq_log(latency_ms)
            msg = response.choices[0].message

            # Groq rejects an assistant message with tool_calls explicitly set
            # to null — the key must be omitted entirely when there are none.
            assistant_msg = {"role": "assistant", "content": msg.content}
            if msg.tool_calls:
                assistant_msg["tool_calls"] = [tc.model_dump() for tc in msg.tool_calls]
            conversation.append(assistant_msg)

            if not msg.tool_calls:
                agent_text = (msg.content or "").strip()
                break

            for tool_call in msg.tool_calls:
                name = tool_call.function.name
                try:
                    args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                negotiation_tool_call_log(name, args)
                result = self._dispatch_tool(name, args)
                negotiation_tool_result_log(name, self._summarize_tool_result(name, result))

                conversation.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": name,
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                })

        self.history = conversation[1:]

        # Silent fallback — in case the model ever emits the old text signal
        # instead of calling close_deal.
        if not self.deal_reached:
            deal_match = re.search(r"DEAL_CONFIRMED:₹?([\d,]+)", agent_text)
            if deal_match:
                agreed_price = max(float(deal_match.group(1).replace(",", "")), self.params.floor_price)
                self.deal_reached = True
                self.agreed_price = agreed_price
                agent_text = agent_text.replace(deal_match.group(0), "").strip()
                if not agent_text:
                    agent_text = f"बहुत अच्छा! {agreed_price:.0f} रुपये में सौदा पक्का!"
                if self.history and self.history[-1].get("role") == "assistant":
                    self.history[-1]["content"] = agent_text
                deal_detected(agreed_price, self.params.floor_price)

        # Silent fallback — Llama-on-Groq occasionally leaks a tool call as
        # literal text (<function=NAME>{...}</function>) instead of
        # populating the structured tool_calls field, for any of the 3
        # tools. Parse and dispatch it for real (still runs floor
        # validation, still surfaces alternatives) rather than leaving
        # broken function syntax visible to the buyer.
        if not self.deal_reached:
            tag_match = re.search(r"<function=(\w+)>\s*(\{.*?\})\s*</function>", agent_text, re.DOTALL)
            if tag_match:
                leaked_name = tag_match.group(1)
                try:
                    leaked_args = json.loads(tag_match.group(2))
                except json.JSONDecodeError:
                    leaked_args = {}

                if leaked_name in ("close_deal", "find_alternatives", "get_product_details"):
                    negotiation_tool_call_log(leaked_name, leaked_args)
                    result = self._dispatch_tool(leaked_name, leaked_args)
                    negotiation_tool_result_log(leaked_name, self._summarize_tool_result(leaked_name, result))
                    clean_text = re.sub(r"<function=\w+>.*?</function>", "", agent_text, flags=re.DOTALL).strip()

                    if leaked_name == "close_deal":
                        price = leaked_args.get("price")
                        if result.get("status") == "accepted":
                            agent_text = clean_text or f"Great, ₹{price:.0f} it is!"
                        else:
                            agent_text = f"Hmm, ₹{price:.0f} doesn't quite work for me — can you come up a little?"
                    else:
                        agent_text = clean_text or "Let me see what else I can offer you..."

                    if self.history and self.history[-1].get("role") == "assistant":
                        self.history[-1]["content"] = agent_text

        if not agent_text:
            agent_text = "Sorry, could you say that again?"

        self.agent_offers.append(_extract_price(agent_text, take_last=True))
        priya_log(agent_text)
        return agent_text, self.deal_reached, self.agreed_price, self.last_alternatives

    def get_transcript(self) -> str:
        """Return full conversation as plain text for logging — skips
        tool-call/tool-result plumbing messages, only real dialogue turns."""
        lines = []
        for msg in self.history:
            role, content = msg.get("role"), msg.get("content")
            if role not in ("user", "assistant") or not content:
                continue
            speaker = "Priya (Agent)" if role == "assistant" else self.buyer_name
            lines.append(f"{speaker}: {content}")
        return "\n".join(lines)

    def get_tactics_used(self) -> str:
        return json.dumps(self.params.tactics)
