"""
Negotiation Agent  ★ CORE
──────────────────────────
Runs the Hindi voice conversation using Groq Llama 3.3 70B.
Receives buyer input (text), returns agent response (text).
Detects when a deal is reached and signals the Deal Closing Agent.
"""

import os
import re
import json
import time
import httpx
from typing import List, Dict, Optional, Tuple
from groq import Groq
from dotenv import load_dotenv
from agents.price_intelligence import NegotiationParams
from logger import agent_header, info, groq_log, priya_log, deal_detected, DIM, RESET, MAGENTA, WHITE

load_dotenv()

# Initialise Groq with a clean httpx client (ignores any system proxy env vars)
_http_client = httpx.Client(trust_env=False)
client = Groq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)

DEAL_SIGNAL = "DEAL_CONFIRMED"


def build_system_prompt(
    buyer_name: str,
    product_name: str,
    mrp: float,
    params: NegotiationParams,
) -> str:
    tactics_text = {
        "scarcity":      f"- कमी बताना: स्वाभाविक रूप से उल्लेख करें कि सीमित स्टॉक बचा है।",
        "anchor_high":   "- ऊँचे से शुरू करें: MRP के पास से शुरू करें, छोटे-छोटे कदमों में नीचे आएं।",
        "value_add":     "- मूल्य जोड़ें: कीमत घटाने की जगह मुफ्त डिलीवरी या गिफ्ट रैपिंग का प्रस्ताव दें।",
        "firm_hold":     "- कम से कम दो बार मना करें, फिर थोड़ा झुकें।",
        "flattery":      "- हल्की तारीफ करें: 'आप तो समझदार ग्राहक हैं, इसीलिए बता रही हूँ...'",
        "quick_close":   "- अगर खरीदार तैयार लगे तो छोटी छूट देकर जल्दी बंद करें।",
        "reciprocity":   "- पारस्परिकता: 'मैं आपके लिए थोड़ा समायोजन कर देती हूँ, आप भी समझें।'",
        "prepaid_nudge": "- सौदे के बाद: 'UPI से भुगतान करें तो 20 रुपये अतिरिक्त कैशबैक मिलेगा।'",
    }

    active_tactics = "\n".join(
        tactics_text[t] for t in params.tactics if t in tactics_text
    )

    return f"""आप Meesho की AI बिक्री प्रतिनिधि हैं जिनका नाम "प्रिया" है।
आप एक चतुर, मिलनसार और थोड़ी दृढ़ दुकानदार की तरह बात करती हैं।
आप केवल शुद्ध हिंदी में उत्तर देती हैं — कोई अंग्रेज़ी शब्द नहीं।

उत्पाद: {product_name}
अंकित मूल्य: {mrp:.0f} रुपये
खरीदार का नाम: {buyer_name}

मोलभाव के नियम (खरीदार को कभी न बताएं):
- आपकी न्यूनतम कीमत: {params.floor_price:.0f} रुपये — इससे नीचे कभी न जाएं।
- लक्ष्य मूल्य: {params.target_price:.0f} रुपये या उससे अधिक।
- पहला प्रतिप्रस्ताव: {params.opening_counter:.0f} रुपये से शुरू करें।

रणनीतियाँ (स्वाभाविक रूप से उपयोग करें):
{active_tactics}

सौदे की पहचान:
- जब खरीदार किसी कीमत पर सहमत हो (जी / हाँ / ठीक है / चलता है / पक्का),
  पहले पुष्टि करें: "तो [कीमत] रुपये में पक्का सौदा है?"
- खरीदार ने हाँ कहा तो केवल यही लिखें: DEAL_CONFIRMED:₹[price]
- उदाहरण: DEAL_CONFIRMED:₹850

शैली के नियम:
- उत्तर छोटे रखें — एक से तीन वाक्य अधिकतम।
- गर्मजोशी और दृढ़ता का संतुलन रखें।
- एक बार में केवल एक प्रतिप्रस्ताव दें।
- न्यूनतम कीमत कभी न बताएं।
- तारे (*), इमोजी या markdown का उपयोग न करें — केवल सादा पाठ।
- संख्याएं अंकों में लिखें (850, 1200) — शब्दों में नहीं।
- वाक्य छोटे और स्पष्ट रखें।

अभिवादन से शुरू करें: "नमस्ते {buyer_name} जी! मैं आपकी किस प्रकार सहायता कर सकती हूँ?"
"""


class NegotiationSession:
    """Holds per-session state for one buyer-product negotiation."""

    def __init__(
        self,
        session_id: str,
        buyer_name: str,
        product_name: str,
        mrp: float,
        params: NegotiationParams,
    ):
        self.session_id = session_id
        self.buyer_name = buyer_name
        self.product_name = product_name
        self.mrp = mrp
        self.params = params
        self.history: List[Dict[str, str]] = []
        self.deal_reached = False
        self.agreed_price: Optional[float] = None
        self.round_count = 0

        # Inject system prompt
        self.system_prompt = build_system_prompt(buyer_name, product_name, mrp, params)

        # ── Demo terminal output ──────────────────────────────────────────────
        agent_header(2, 4, "Negotiation Agent — Priya")
        info("Model",    "llama-3.3-70b-versatile  (Groq LPU)")
        info("Language", "Hindi — Devanagari system prompt")
        info("Floor",    f"₹{params.floor_price:.0f}  (hard constraint, hidden from buyer)")
        info("Tactics",  ", ".join(params.tactics))

    def get_opening_line(self) -> str:
        """Agent speaks first — warm Hindi greeting."""
        opening = (
            f"नमस्ते {self.buyer_name} जी! "
            f"आज मैं आपकी किस प्रकार सहायता कर सकती हूँ? "
            f"यह {self.product_name} देखना चाहेंगे? "
            f"बहुत अच्छा उत्पाद है, {self.mrp:.0f} रुपये में उपलब्ध है।"
        )
        self.history.append({"role": "assistant", "content": opening})
        print(f"\n  {DIM}[OPENING]{RESET} {MAGENTA}Priya →{RESET} {WHITE}"{opening[:100]}…"{RESET}")
        return opening

    async def respond(self, buyer_input: str) -> Tuple[str, bool, Optional[float]]:
        """
        Process buyer input, return (agent_text, deal_reached, agreed_price).
        """
        self.round_count += 1
        self.history.append({"role": "user", "content": buyer_input})

        messages = [{"role": "system", "content": self.system_prompt}] + self.history

        t0 = time.time()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
        )
        latency_ms = int((time.time() - t0) * 1000)

        agent_text = response.choices[0].message.content.strip()

        groq_log(latency_ms)

        # Check for deal signal
        deal_match = re.search(r"DEAL_CONFIRMED:₹?([\d,]+)", agent_text)
        if deal_match:
            price_str = deal_match.group(1).replace(",", "")
            agreed_price = float(price_str)
            # Clamp to floor price — safety net
            agreed_price = max(agreed_price, self.params.floor_price)
            self.deal_reached = True
            self.agreed_price = agreed_price
            # Clean signal from response shown to buyer
            clean_text = agent_text.replace(deal_match.group(0), "").strip()
            if not clean_text:
                clean_text = f"बहुत अच्छा! {agreed_price:.0f} रुपये में सौदा पक्का! अभी भुगतान करें।"
            self.history.append({"role": "assistant", "content": clean_text})
            deal_detected(agreed_price, self.params.floor_price)
            priya_log(clean_text)
            return clean_text, True, agreed_price

        self.history.append({"role": "assistant", "content": agent_text})
        priya_log(agent_text)
        return agent_text, False, None

    def get_transcript(self) -> str:
        """Return full conversation as plain text for logging."""
        lines = []
        for msg in self.history:
            speaker = "Priya (Agent)" if msg["role"] == "assistant" else self.buyer_name
            lines.append(f"{speaker}: {msg['content']}")
        return "\n".join(lines)

    def get_tactics_used(self) -> str:
        return json.dumps(self.params.tactics)
