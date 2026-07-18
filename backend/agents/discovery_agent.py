"""
Discovery Agent  ★ CORE
─────────────────────────
Groq tool-calling loop for the voice-mode landing screen (mirrors Wally's
chat_service.py pattern). Takes the buyer's growing conversation history,
lets Groq decide which tool(s) to call — zero, one, or several times in a
single turn — and returns the final assistant message plus whatever
products/list-state the tools produced, for the frontend to render.

Multi-turn, stateless server-side: the frontend resends the full message
history each call (same pattern as Wally's /chat and OpenAI's own API), so
the agent can ask a clarifying question instead of guessing on an ambiguous
request, no session/websocket infra required.
"""

import json
import os
import httpx
from groq import AsyncGroq, RateLimitError

from logger import (
    agent_header, info, groq_log, error_log,
    discovery_banner, discovery_turn_start, tool_switch, tool_result, discovery_reply_log,
)

from tools.search_product import search_product
from tools.get_product_details import get_product_details
from tools.update_shopping_list import update_shopping_list
from tools.recommend_outfit import recommend_outfit

_http_client = httpx.AsyncClient(trust_env=False)
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"), http_client=_http_client)

MAX_ITERATIONS = 5

LANGUAGE_NAMES = {
    "hi-IN": "Hindi", "bn-IN": "Bengali", "kn-IN": "Kannada", "ml-IN": "Malayalam",
    "mr-IN": "Marathi", "od-IN": "Odia", "pa-IN": "Punjabi", "ta-IN": "Tamil",
    "te-IN": "Telugu", "en-IN": "English", "gu-IN": "Gujarati", "as-IN": "Assamese",
    "ur-IN": "Urdu",
}

# Static, not translated live — this is the failure path (Groq already exhausted
# retries), so we don't want a second Groq call that could fail too.
FALLBACK_MESSAGES = {
    "hi-IN": "माफ़ कीजिए, मुझे इसमें दिक्कत हो रही है — क्या आप दोबारा कोशिश कर सकते हैं?",
    "gu-IN": "માફ કરશો, મને આમાં તકલીફ પડી રહી છે — શું તમે ફરી પ્રયાસ કરી શકો છો?",
    "ta-IN": "மன்னிக்கவும், இதில் சிக்கல் உள்ளது — மீண்டும் முயற்சிக்கவும்.",
    "te-IN": "క్షమించండి, దీనిలో సమస్య ఉంది — దయచేసి మళ్లీ ప్రయత్నించండి.",
    "kn-IN": "ಕ್ಷಮಿಸಿ, ಇದರಲ್ಲಿ ತೊಂದರೆ ಇದೆ — ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "bn-IN": "দুঃখিত, এতে সমস্যা হচ্ছে — আবার চেষ্টা করবেন কি?",
    "mr-IN": "माफ करा, यात अडचण येत आहे — कृपया पुन्हा प्रयत्न करा.",
    "en-IN": "Sorry, I'm having trouble with that — could you try rephrasing?",
}


def fallback_message(language_code: str) -> str:
    return FALLBACK_MESSAGES.get(language_code, FALLBACK_MESSAGES["en-IN"])

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_product",
            "description": "Semantic search over the product catalog. Use for any direct lookup — 'find X', 'show me Y under Z rupees'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Free-form description of what to search for, in English (translate if the buyer spoke another language)"},
                    "keyword": {"type": "string", "description": "REQUIRED. The single core product-type noun, in English, lowercase, singular — e.g. buyer asks for 'kurtas' -> keyword='kurta', 'sneakers' -> keyword='sneaker', 'a watch' -> keyword='watch'. If the request truly has no specific product type (e.g. 'show me something nice'), pass an empty string."},
                    "gender": {"type": "string", "description": "REQUIRED. One of: Men, Women, Kids, Unisex — who the product is for. This is the primary filter, do not skip it. If you cannot tell who it's for from the conversation, ask the buyer instead of calling this tool."},
                    "category": {"type": "string", "description": "Optional secondary bucket: Footwear, Bags, Watches, Jewellery, Ethnic Wear, etc. Omit if unsure."},
                    "max_price": {"type": ["number", "string"], "description": "Maximum price in INR as a number, if the buyer mentioned a budget"},
                    "min_price": {"type": ["number", "string"], "description": "Minimum price in INR as a number, if mentioned"},
                },
                "required": ["query", "keyword", "gender"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": "Fetch full details for specific product IDs already shown earlier in this conversation — use instead of search_product when the buyer references a previously-shown item.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_ids": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["product_ids"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_shopping_list",
            "description": "Add or remove items from the buyer's save-for-later shopping list (NOT an immediate purchase). Use when the buyer says 'add X to my list', 'remove Y', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The buyer's raw add/remove request"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_outfit",
            "description": "Multi-item outfit/look recommendation for an occasion or vague styling request ('party outfit', 'wedding guest look', 'what goes with this'). Use instead of search_product when the buyer wants a coherent combination of items, not a single product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "context": {"type": "string", "description": "The styling context/request, in the buyer's own words (translated to English if needed)"},
                    "occasion": {"type": "string", "description": "e.g. wedding, party, casual, festival — if identifiable"},
                    "budget": {"type": ["number", "string"], "description": "Max price per item in INR as a number, if mentioned"},
                },
                "required": ["context"],
            },
        },
    },
]

TOOL_DISPATCH = {
    "search_product": search_product,
    "get_product_details": get_product_details,
    "update_shopping_list": update_shopping_list,
    "recommend_outfit": recommend_outfit,
}


def build_system_prompt(language_code: str, buyer_id: int) -> str:
    language_name = LANGUAGE_NAMES.get(language_code, "Hindi")
    return f"""You are "Priya", a warm and proactive AI shopping assistant for an Indian e-commerce marketplace, helping the buyer discover products by voice.

CRITICAL LANGUAGE RULE: Respond ONLY in {language_name}, native script (not romanized), unless it's English.

Buyer's internal ID for tool calls: {buyer_id}

Behavior:
- For a direct product lookup ("find X", "Y under Z rupees"), call search_product once.
- For occasion/styling requests ("party outfit", "wedding guest look", "what goes with this"), call recommend_outfit — it composes a multi-item combination itself, you don't need to call search_product multiple times yourself for this case.
- For "add X to my list" / "remove X", call update_shopping_list.

CRITICAL SEARCH RULE: The product catalog (names, descriptions) is entirely in English. Whenever you call search_product, recommend_outfit, or update_shopping_list, always translate the query/context/item text to English first, even if the buyer spoke in {language_name} — e.g. buyer says "कुर्ते" (kurte), you call search_product(query="kurta", ...). Never pass non-English text as a tool argument. Your spoken reply back to the buyer still stays in {language_name} — only the tool arguments need to be English.

CRITICAL — search_product's `keyword` AND `gender` arguments are REQUIRED, never skip either:
- `keyword` is the single core product-type noun in English (singular, lowercase) — finds an exact literal match on top of semantic search.
- `gender` is who it's for (Men/Women/Kids/Unisex) — without it, results mix everyone's products together (e.g. a "shirts" search returning kids' shirts to someone shopping for women's wear). If you cannot tell who it's for, do NOT guess — ask instead (see below).
Example: buyer says "मुझे हज़ार के अंदर में कुछ कुर्ते बता दीजिए" (show me some kurtas under a thousand, buyer is a woman based on context) -> search_product(query="kurtas under 1000 rupees", keyword="kurta", gender="Women", max_price=1000).
Example: buyer says "Reebok shoes under 800 for me, I'm a guy" -> search_product(query="Reebok shoes under 800", keyword="shoe", gender="Men", max_price=800).
- After tool results come back, write a short (1-3 sentence) natural reply summarizing what you found — don't just repeat raw data, and don't list every field.
- Never fabricate products that weren't in a tool's results. If nothing matched, say so honestly.
- No markdown, no asterisks, no emoji — plain text only, since this is read aloud via text-to-speech.

IMPORTANT — ask before guessing on genuinely ambiguous requests:
If a request is missing information that would meaningfully change what you'd show (who it's for, budget, or the type of occasion), ask ONE short clarifying question instead of calling a tool. A good shopkeeper asks before showing you twenty random things.

Example — do NOT do this:
User: "I'm getting ready for my cousin's wedding, suggest me outfits"
Bad: [immediately calls recommend_outfit and shows random wedding-guest items]

Example — do this instead:
User: "I'm getting ready for my cousin's wedding, suggest me outfits"
Good: "Congratulations! Is this for you, and are you shopping for men's or women's wear? Also, do you have a budget in mind?" (no tool call this turn)

Example — search_product with unclear gender:
User: "Show me shirts under 1000"
Bad: [calls search_product with gender omitted or guessed, mixing men's/women's/kids' results]
Good: "Sure — are you looking for men's, women's, or kids' shirts?" (no tool call this turn)
Once the buyer answers (or already implied it earlier in the conversation, e.g. said "for me" and mentioned being a woman), proceed with the tool call including gender — don't ask again if it's already known from context.

Once you have enough to go on (even just gender + rough occasion), proceed with recommend_outfit — don't over-ask on every turn, only when the request as given can't be searched meaningfully.
"""


async def run_discovery_turn(
    messages: list[dict],
    language_code: str,
    buyer_id: int,
    buyer_name: str = "Buyer",
) -> dict:
    """
    messages: growing conversation history, e.g. [{"role": "user", "content": "..."}]
    (frontend keeps and resends this each turn — stateless server-side).

    Returns: {"messages": [...updated history...], "reply": "...", "tool_results": [...]}
    """
    system_prompt = build_system_prompt(language_code, buyer_id)
    conversation = [{"role": "system", "content": system_prompt}] + messages

    discovery_banner()
    latest_user_input = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
    discovery_turn_start(buyer_name, f"{LANGUAGE_NAMES.get(language_code, language_code)} ({language_code})", latest_user_input)

    tool_results = []

    for iteration in range(MAX_ITERATIONS):
        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=conversation,
                tools=TOOL_SCHEMAS,
                tool_choice="auto" if iteration < MAX_ITERATIONS - 1 else "none",
                temperature=0.5,
                max_tokens=400,
            )
        except RateLimitError as e:
            # Retrying immediately just hits the same wall — burning the rest
            # of MAX_ITERATIONS here only adds latency and, worse, persists
            # failed-attempt junk into `messages`, which the frontend resends
            # on every future turn. Fail fast and return the ORIGINAL
            # messages unchanged instead.
            error_log("Discovery Agent", f"Groq rate limit: {str(e)[:200]}")
            fallback = fallback_message(language_code)
            discovery_reply_log(fallback)
            return {
                "messages": messages,
                "reply": fallback,
                "tool_results": tool_results,
            }
        except Exception as e:
            # Malformed tool call (e.g. wrong arg type) or transient API error —
            # let the model see the failure and self-correct, rather than 500ing.
            conversation.append({
                "role": "user",
                "content": f"[system: your last response failed — {str(e)[:200]}. Please try again, making sure tool arguments match the expected types.]",
            })
            continue
        groq_log()
        msg = response.choices[0].message

        # Groq rejects an assistant message with tool_calls explicitly set
        # to null on a later call — must omit the key entirely, not null it.
        assistant_msg = {"role": "assistant", "content": msg.content}
        if msg.tool_calls:
            assistant_msg["tool_calls"] = [tc.model_dump() for tc in msg.tool_calls]
        conversation.append(assistant_msg)

        if not msg.tool_calls:
            reply = msg.content or ""
            discovery_reply_log(reply)
            return {
                "messages": conversation[1:],  # drop system prompt before returning to frontend
                "reply": reply,
                "tool_results": tool_results,
            }

        for tool_call in msg.tool_calls:
            name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                args = {}

            # Coerce numeric fields the model may have emitted as strings
            for numeric_field in ("max_price", "min_price", "budget"):
                if numeric_field in args and args[numeric_field] is not None:
                    try:
                        args[numeric_field] = float(args[numeric_field])
                    except (TypeError, ValueError):
                        args[numeric_field] = None

            tool_switch(name, args)
            fn = TOOL_DISPATCH.get(name)
            if not fn:
                result = {"error": f"Unknown tool {name}"}
            else:
                try:
                    if name == "update_shopping_list":
                        args["buyer_id"] = buyer_id
                    if asyncio_iscoroutinefunction(fn):
                        result = await fn(**args)
                    else:
                        result = fn(**args)
                except Exception as e:
                    result = {"error": str(e)}

            tool_result(name, summarize_tool_result(name, result))
            tool_results.append({"tool": name, "args": args, "result": result})
            conversation.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": name,
                "content": json.dumps(result, ensure_ascii=False, default=str),
            })

    fallback = fallback_message(language_code)
    discovery_reply_log(fallback)
    return {
        "messages": messages,
        "reply": fallback,
        "tool_results": tool_results,
    }


def asyncio_iscoroutinefunction(fn) -> bool:
    import inspect
    return inspect.iscoroutinefunction(fn)


def summarize_tool_result(name: str, result: dict) -> str:
    if "error" in result:
        return f"error — {str(result['error'])[:100]}"
    if name in ("search_product", "get_product_details"):
        data = result.get("data", [])
        return f"{len(data)} products found" if data else "no products matched"
    if name == "recommend_outfit":
        data = result.get("data", [])
        return f"{len(data)}-item outfit assembled" if data else "no outfit could be assembled"
    if name == "update_shopping_list":
        d = result.get("data", {})
        return f"added {len(d.get('added', []))}, removed {len(d.get('removed', []))}, list now {len(d.get('items', []))} items"
    return "done"
