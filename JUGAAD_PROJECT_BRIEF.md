# Jugaad — Complete Project Brief

*Written as a standalone reference: everything about this project, so that anyone (including another LLM with zero prior context) can build a pitch deck, README, or demo script from this document alone.*

---

## 1. Identity

- **Name:** Jugaad
- **Meaning:** Hindi word for a clever, frugal workaround — "a fix that just works." The name is intentional: the whole product is a workaround for a problem e-commerce created.
- **Hackathon:** Scripted By Her, 2026. Theme: **"Building Bharat with the Power of Agentic AI."** Associated with Meesho.
- **Team:** Bhoomi Gundecha (solo builder, working with an AI pair-programming assistant throughout).
- **Current phase:** Prototyping → moving to deployment.

### Taglines developed (in order of preference)
1. **"AI-powered bazaar, for how Bharat actually shops."** ← locked, used on cover slide.
2. "AI-powered shopkeeper for Bharat."
3. "AI-powered shopping that listens, negotiates, remembers."
4. Subline paired with the cover tagline: *"Most apps make you search. Jugaad listens — and shows you exactly what you asked for."*

### Founder's note (300-character version, for tight slide space)
> *I wanted to bring Indian market shopping to e-commerce — real negotiation, not a fixed price. Buyers wait for sales, vendors sit on unsold stock. Jugaad brings back the haggle, in your own language — fun for buyers, a real fix for vendors.*

### Founder's note (full ~300-word version, for an About/Why-I-built-this slide)
> I wanted to bring the feel of Indian market shopping to e-commerce — completely, not as a gimmick bolted onto a checkout page.
>
> Growing up, shopping meant walking into a store, picking up the fabric, asking the price, and negotiating a little before walking away with something that felt earned. There was a shopkeeper who listened, who knew your size, who'd throw in a matching dupatta if you asked nicely. E-commerce gave us none of that. It gave us a fixed price, a search bar, and a checkout button — and somewhere along the way, the entire ritual that made shopping personal just disappeared.
>
> That observation led to a second one: buyers have quietly adapted to this loss. They wait. They wait for sales, for prices to drop, for a discount notification — because that's the only lever they have left in a system with no room to negotiate. Meanwhile, vendors sit on unsold inventory for weeks, hoping the next sale event clears it, eroding their own margins in the process. Nobody's actually winning here — buyers feel like they're always overpaying until a sale proves otherwise, and vendors are stuck engineering discounts instead of just selling at a price that already works for both sides.
>
> Jugaad exists to close that gap — not with another discount banner, but by putting negotiation back where it belongs: in a real conversation, in your own language, the same way it happens at a local market. Buyers get their price today, without waiting for a sale. Vendors move inventory today, without slashing prices for everyone.
>
> And honestly — it's fun. Getting a good price by asking for it feels like winning something, not clicking a button. That feeling was always part of how India shops. Jugaad just brings it back.

---

## 2. The Problem

### Unifying insight (lead with this, not stats)
**E-commerce forgot what a shopkeeper actually does.** A shopkeeper *listens* (understands intent, shows you exactly that — not a search results page), *negotiates* (a fair price for both sides), and *remembers* (knows what you're looking for, holds it for you). Digital shopping does none of the three. This isn't three separate problems — it's one problem wearing three faces, and each face maps directly to one of Jugaad's three services (see below).

### Opening scene (use this instead of leading with a stat)
> At the local market, she checks the fabric, asks the price, counters it — maybe gets the matching dupatta thrown in. On the app, she sees a fixed number, in English, with no one to talk to. She closes the tab and waits for a sale.

### The three problem pillars (each maps 1:1 to a service)

**1. No intent, only search.** Shoppers don't get to *ask* — they type keywords, apply filters, scroll past hundreds of irrelevant results, and often give up before finding what they came for. No personalized, intent-based shopping solution exists across physical or digital platforms. This is also a *business* problem: that friction is exactly what tanks cart completion rates for platforms and vendors, not just an inconvenience for buyers.
→ Solved by **conversational shopping** (voice discovery).

**2. No negotiation.** Fixed prices, zero conversation. The one ritual that makes offline shopping feel personal and fair — haggling — has no digital equivalent on any major platform. Buyers respond by waiting for sale events instead of negotiating; vendors respond by sitting on unsold inventory between sales, eroding margin.
→ Solved by **negotiation that protects both sides** (floor price is a hard backend constraint, not an AI suggestion).

**3. No memory.** Shoppers forget items mid-browse, re-search for things they liked days ago, or lose the thread entirely in a huge catalog with no "hold this for me" option.
→ Solved by **shopping list curation** (voice-driven, DB-backed, persists across sessions).

### Supporting stats (use as confirmation at the bottom of the page, not as the opener)
- COD order share on platforms like Meesho: **~67%**
- Return rate on COD orders: **~40–50%**, #1 cited reason: *"price felt too high"*
- Cart abandonment on first visit: **~72%**
- Platforms offering negotiation today: **0**

### The "who" (sharpen this for Scripted By Her)
The women who negotiate every day at the sabzi mandi or with the local tailor are the exact buyers excluded by English-first, text-heavy, filter-driven checkout flows. This isn't a generic UX complaint — it's a specific population (vernacular speakers, low-literacy users, Tier 2/3 India, women who are often the primary household shoppers) being locked out of a convenience everyone else already has.

---

## 3. The Solution — Three Services

1. **Conversational shopping experience** — say what you want, in your own language, and the recommended-products shelf *becomes* exactly that. Ask "kurtas under 500" and the entire screen becomes kurtas under 500 — not a ranked list you still have to dig through, a direct replacement, the way a shopkeeper physically pulls stock for you. **This is built and tested live, not aspirational.**
2. **Negotiation that helps both sides** — not a discount gimmick. Real price discrimination logic: buyers who negotiate get the deal, sellers who'd rather not spend margin on buyers who'd pay full price anyway don't lose anything, because the floor price is a hard backend constraint the AI physically cannot cross. This is *why* a real shopkeeper negotiates in the first place — smart selling, not charity.
3. **Shopping list curation** — "add this for later" builds a running list by voice, across sessions. No forgetting, no re-searching, come back when ready to actually buy.

### Why it's genuinely agentic (not just "we called an LLM")
The Discovery Agent has **one search tool** and decides *for itself* how many times to call it — once for a simple lookup ("Reebok shoes under 800"), several times across categories for a composition request ("bling outfit for a party" → separately searches dresses, footwear, jewellery, then synthesizes a coherent combination). This is not hand-coded branching logic; it's the model's own reasoning producing different tool-call patterns for different intents. It also asks a clarifying question instead of guessing on genuinely ambiguous requests (e.g. "suggest outfits for my cousin's wedding" → asks who it's for, budget, before searching) rather than dumping random results.

---

## 4. Full Feature Inventory — Everything Built

### Buyer-side: Voice Discovery (`/voice` page)
- Full-screen, single-viewport (no scroll) voice-first landing experience, dark purple background matching brand.
- **VoiceGlowOrb** — custom animated orb (layered pulsing rings + rotating conic-gradient core + frosted glass cap), with a seamless mic icon (no background badge, just the icon with drop-shadow) centered directly on the orb. Tap to start/stop listening; shows a spinner while the agent is "thinking."
- **AutoScrollList** — vertical auto-scrolling ticker showing 3 example commands at a time, looping continuously through 8 suggestions (in Playfair Display heading "Try these commands"), with fade-out edges.
- **SuggestedCommandChip** — glassmorphism pill chips (translucent blur, matches app's existing glass language).
- **VoiceTranscript** — dark-theme subtitle/transcript card (AI ASSISTANT / You labels + timestamp + quoted text), appears once a conversation starts, replacing the suggestion ticker in the same screen space.
- **Recommended Products rail** — real `ProductCarousel` + `ProductRevealCard`, populated initially from the full catalog, then **replaced live** by whatever the Discovery Agent's tools return for the current conversation.
- Real audio recording via browser `MediaRecorder`, sent as base64 to the backend; also works via text (tapping a suggestion chip sends text, same pipeline, no mic needed — this is how the app is being tested without live voice).
- Full round-trip tested and working: tap → backend Discovery Agent → tool call(s) → transcript updates + products update + synthesized speech plays back.

### Backend: Discovery Agent (`agents/discovery_agent.py`)
- Groq (Llama 3.3 70B) tool-calling loop, mirrors the "Wally" reference architecture pattern (FastAPI + tool dispatch), max 5 iterations, stateless server-side (frontend resends growing message history each turn — same pattern as OpenAI's own chat API).
- **Four tools:**
  1. `search_product` — Nebius Qwen3-Embedding-8B embeds the query (4096-D) → Qdrant semantic search over the full catalog, with hard payload filters (category, min/max price) combined with vector search in one query. Logs every step: embedding call, Qdrant query + filters, full list of returned products with names/prices/relevance scores.
  2. `get_product_details` — direct SQLite lookup by product ID (no embedding/API call), for follow-up questions about an already-shown item.
  3. `update_shopping_list` — Groq parses the buyer's natural-language add/remove request against their current list, resolves "add" items to a real product via a quick search where possible, DB-backed (`ShoppingListItem` table) so it survives across sessions.
  4. `recommend_outfit` — structured multi-step pipeline (not just "call search a few times and hope"): Groq generates a short list of complementary item descriptions for the occasion → each searched in parallel via `asyncio.gather` → top result per item kept → one more Groq call synthesizes a natural pitch line referencing the actual selected products.
- Ambiguous-request handling: system prompt includes a concrete few-shot example teaching the agent to ask ONE clarifying question (e.g. "is this for you, men's or women's, budget?") instead of guessing on under-specified requests — tested and confirmed working, including full multi-turn follow-through once the buyer answers.
- Defensive error handling: numeric tool-call arguments coerced from string→float (a real Groq tool-calling quirk hit and fixed during testing); Groq API failures caught and fed back to the model as a self-correction prompt rather than crashing the request.
- Color-coded terminal logging (see Section 6) — every tool call gets a bordered, colored box, distinct per tool, with before/after detail (query embedded, Qdrant filters used, exact products returned).

### Buyer-side: Negotiation (`/negotiate/[sessionId]` page + WebSocket)
- Pre-existing core feature, now upgraded for multi-language.
- **Four-agent pipeline**, each with a distinct role and its own terminal log banner:
  1. **Price Intelligence Agent** — computes floor price, target price, opening counter-offer, and which negotiation tactics to deploy, based on product age (fresher stock = less flexibility) and stock level (scarcity signal).
  2. **Negotiation Agent ("Priya")** — Groq Llama 3.3 70B, live conversational bargaining. System prompt generalized to any language (was hardcoded Hindi-only before this build phase) — one parametrized template, not N per-language templates. Opening greeting is generated live via a Groq call in the buyer's language (not a hardcoded template), tested working in Hindi and Tamil.
  3. **Deal Closing Agent** — validates the agreed price is above floor (hard safety clamp even if the LLM says otherwise), writes the deal to DB, returns a UPI-prepaid cashback nudge.
  4. **Learning Agent** — post-negotiation analytics (success rate, average settled price, price elasticity signal, common tactics used) feeding the vendor dashboard.
- Floor price is enforced server-side as a literal code constraint — the LLM cannot close a deal below it regardless of what it generates; this is the core seller-trust mechanism.
- Full WebSocket protocol: audio in → Sarvam STT → Groq negotiation response → Sarvam TTS → audio out, plus text fallback.

### Multi-language (both Discovery and Negotiation)
- **Sarvam Saaras v3** for STT (23 languages: 22 Indian + English) — upgraded from the deprecated Saarika v2.5 (11 languages) during this build.
- **Sarvam Bulbul v3** for TTS — upgraded from deprecated Bulbul v2. Default speaker changed to "priya" (matches the agent's persona name; the previous default speaker "manisha" is not compatible with v3).
- `Buyer.language` column added to the DB (Sarvam language_code, e.g. `hi-IN`, `ta-IN`, `gu-IN`, `en-IN`), seeded with 5 buyers across 4 languages for testing variety.
- Reasoning/tool-calling stays on Groq (not Sarvam's own LLM) — deliberate choice: Sarvam-105B exists and is real, but Groq's LPU inference is proven sub-200ms in this app already and swapping the reasoning engine days before a deadline for an unmeasured latency trade was judged too risky. Sarvam's role is strictly voice I/O (STT/TTS), not reasoning.

### Product Catalog — 865 real products
- **62 products** from a Hugging Face dataset mirror of the classic "Fashion Product Images" dataset (`ashraq/fashion-product-images-small` initially, images found to be only 60×80px/2KB — a real quality bug caught during testing; a proper full-resolution variant (`benitomartin/fashion-product-images-small-900x1200`) was identified as the fix, not yet re-ingested at time of writing).
- **523 products scraped live from Tata CLiQ** using a custom Playwright + BeautifulSoup scraper (`backend/scraper_tatacliq.py`) — built after confirming Meesho and Myntra both actively block bots (Myntra's own `robots.txt` disallows it and blocklists dozens of competitor domains; Meesho returns an Akamai "Access Denied" at the edge for even a `robots.txt` fetch). Tata CLiQ's `robots.txt` is permissive and explicitly welcomes AI crawlers (ClaudeBot, GPTBot named directly), but is a client-rendered SPA — plain `requests`/`curl` sees an empty shell, so Playwright renders it for real, scrolling each product card individually into view to force lazy-loaded images to mount (this fixed an early bug where only the first ~8 products per category had real images).
- Scraper supports pagination (`/page-1`, `/page-2`...) — Tata CLiQ caps each page at ~40 products regardless of scroll depth, so multi-page scraping was added to get real volume (e.g. the Kids category alone went from 35 to 186 products across 5 pages).
- Categories covered: Men, Women, Kids, Footwear (men's + women's), Watches, Ethnic Wear (dresses + bottoms), Western Wear. Known gaps: jewellery is thin (~4 items), no men's ethnic wear (sherwani/kurta) at all — flagged as a risk for "wedding outfit"-style demo queries, not yet fixed.
- All product data seeded into SQLite via `backend/seed.py`, which normalizes both the HF dataset format and the raw scraped Tata CLiQ format (different field names) into one schema.

### Semantic Search Infrastructure
- **Nebius** (`Qwen/Qwen3-Embedding-8B`, OpenAI-compatible API) for embeddings — 4096 dimensions (not 1024 as an earlier reference architecture used).
- **Qdrant Cloud** — single collection (`jugaad_products`), all 865 products embedded and upserted (batches of 16 with retry logic after an early timeout at batch size 32). Payload indexes explicitly created on `category` (keyword) and `mrp` (float) — a real bug was hit and fixed where Qdrant silently ignores filters on unindexed fields, meaning price/category filtering appeared to "work" (no error) while actually returning unfiltered results until the indexes were added.
- One-time ingestion script: `backend/scripts/ingest_qdrant.py`.

### Reusable Frontend Component Library (component-first, JSX not TSX per project convention)
- **`ProductRevealCard`** (`components/ui/product-reveal-card.jsx`) — drop-in replacement for the original `ProductCard`, same prop shape, adapted from a 21st.dev-style shadcn component: hover/tap reveals a details panel (description, category, stock, two pill-shaped action buttons — black "Buy Now" with bag icon, purple `#7C3AED` "Negotiate" with mic icon, stacked vertically). Colors mapped to the Jugaad purple palette instead of generic shadcn tokens (new CSS variable tokens added to `globals.css` — `--card`, `--primary`, `--muted`, etc. — so future shadcn-style components drop in on-brand automatically).
- **`components/ui/button.jsx`** — the shadcn Button primitive, converted to plain JSX, `rounded-full` by default.
- **`ProductCarousel`** — now accepts a swappable `CardComponent` prop instead of hardcoding which card renders, used to swap in `ProductRevealCard` on specific pages without touching shared logic.
- **`VoiceGlowOrb`, `AutoScrollList`, `VoiceTranscript`, `SuggestedCommandChip`** — all new, all built for `/voice`, all designed as generic/reusable rather than page-specific.
- Fixed a real bug in `lib/api.js`: `enrichProduct()` only ever set `imageUrl` (camelCase) for 6 hardcoded legacy products; the backend actually returns `image_url` (snake_case) for all 865 — meaning every scraped/dataset product's image was silently never rendering anywhere in the app until this was caught and fixed.

### Backend Logging System (`backend/logger.py`)
- Full ANSI color-coded terminal logging, purpose-built for demo visibility ("see when Qdrant gets called," "see agent switches") — this was an explicit deliverable ask.
- Each Discovery Agent tool gets its own color: `search_product` = cyan, `recommend_outfit` = magenta, `update_shopping_list` = green, `get_product_details` = blue, each with its own icon (🔍✨🛒📦).
- Every tool call prints a bordered box (tool name, icon, arguments) on hand-off, and a result-summary line after ("10 products found", "4-item outfit assembled", "added 1, removed 0").
- `search_product` specifically logs the Nebius embedding call (with latency), the Qdrant query (with filters used), and then lists every single product returned (name + price + relevance score) — not just a count.
- Negotiation pipeline has its own pre-existing banner system (session start, 4 agent headers, deal-detected flash, session-complete summary) — separate visual style (cyan) from Discovery's (orange), so a demo video can visually distinguish which system is active.

### Vendor/Seller side
- Backend endpoints already exist (`routers/vendor.py`): dashboard analytics, per-product analytics (success rate, price elasticity signal), live in-progress negotiations feed, floor-price editing.
- **Frontend dashboard is being built separately by the founder and will be integrated into `frontend/app/vendor/` soon** — not yet present in this codebase as of this document. Do not claim it's built in a pitch deck; frame it as "in progress / integrating."

### Checkout
- Full UI (payment method selection: UPI/card with cashback framing, credit/debit, COD), calls a real backend endpoint that logs the payment method choice to the DB.
- **No real payment gateway integration** — intentional scope decision, not a bug. Should be stated explicitly and honestly in any submission material rather than discovered by a judge.

---

## 5. Technical Architecture Summary

```
Buyer (voice or text)
  │
  ├── Discovery flow: POST /buyer/discover
  │     └── Discovery Agent (Groq, tool-calling loop)
  │           ├── search_product      → Nebius embed → Qdrant search
  │           ├── recommend_outfit    → Groq plan → parallel search_product calls → Groq synthesis
  │           ├── update_shopping_list→ Groq diff → DB (ShoppingListItem)
  │           └── get_product_details → direct DB lookup
  │
  └── Negotiation flow: WS /ws/negotiate/{session_id}
        ├── Price Intelligence Agent (floor/target/tactics)
        ├── Negotiation Agent "Priya" (Groq, per-language system prompt)
        ├── Deal Closing Agent (floor-price hard clamp, DB write)
        └── Learning Agent (analytics → vendor dashboard)

Voice I/O (both flows): Sarvam Saaras v3 (STT) / Sarvam Bulbul v3 (TTS)
Reasoning (both flows): Groq Llama 3.3 70B (chosen for LPU sub-200ms latency)
Search: Nebius Qwen3-Embedding-8B + Qdrant Cloud
Data: SQLite (SQLAlchemy), 865 products, 5 buyers, 1 vendor
```

### Stack
- **Frontend:** Next.js 15/16 (App Router), Tailwind v4, Framer Motion, Lucide icons, JSX (not TypeScript) by project convention.
- **Backend:** FastAPI, Python 3.11+/3.13, SQLAlchemy + SQLite, Groq SDK, Sarvam REST API, Nebius (OpenAI-compatible SDK), Qdrant client.
- **Scraping:** Playwright (headless Chromium) + BeautifulSoup.

---

## 6. Honesty Ledger — what's real vs. what's scoped out

**Fully built and live-tested (not mocked):**
- Voice/text discovery → real Qdrant search → real product results shown
- Multi-turn conversation with clarifying questions
- Outfit recommendation (multi-item, parallel search, synthesized pitch)
- Shopping list add/remove
- Multi-language negotiation (Hindi + Tamil confirmed live; Gujarati/English seeded, same code path)
- Floor-price hard constraint (cannot be overridden by the LLM)
- 865-product real catalog (real scrape + real dataset, not placeholder data)

**Deliberately out of scope (say so proactively, don't let a judge find it):**
- Payment gateway — checkout UI is real, payment processing is not
- Automated test suite — currently zero, a known gap against "code quality" judging criteria
- Live deployment — not done as of this document; planned next

**In progress, not yet integrated into this repo:**
- Vendor/seller dashboard frontend (backend endpoints exist; UI being built separately)
- Higher-resolution HF dataset images (bug identified, fix not yet applied)
- Jewellery and men's ethnic wear catalog depth (thin coverage, flagged as a demo risk for wedding-style queries)

---

## 7. Suggested Pitch Deck Structure (bento-grid format, 8 pages)

1. **Cover** — Jugaad wordmark, tagline "AI-powered bazaar, for how Bharat actually shops.", presenter/date/event tags. *(Already built.)*
2. **The shift** — "E-commerce forgot what a shopkeeper does" + three problem-pillar tiles + supporting stats.
3. **Built: Discovery** — screenshot of `/voice`, a real "ask → shelf becomes exactly that" example, multi-turn clarifying-question example.
4. **Built: Negotiation** — screenshot of negotiate screen, real Hindi/Tamil transcript excerpts, floor-price-as-hard-constraint callout.
5. **Agentic architecture** — the 4+4 agent diagram, real model names (Groq Llama 3.3 70B, Sarvam Saaras v3/Bulbul v3, Nebius Qwen3-Embedding-8B, Qdrant).
6. **Proof it's not mocked** — 865 real products, terminal log screenshot (the color-coded tool-call boxes are strong visual proof), Qdrant latency numbers.
7. **Dual-sided — the seller agent** — once the vendor dashboard is integrated: her AI agent negotiating while she's away, same floor-price protection.
8. **Close** — deployed URL, GitHub link, one line on what's next.

---

*This document reflects the state of the project as of the current build session. If features have changed since, verify against the actual codebase before finalizing deck content.*
