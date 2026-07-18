# Jugaad — Development Brief (execute in phases, in order)

You are continuing planned work on Jugaad, an AI-powered negotiation pipeline for Indian e-commerce (Meesho/Scripted by Her hackathon — **tool calling is a judged requirement, the negotiation agent must use real Groq tool calling**). Ship-to-prod deadline: tomorrow. Prioritize a visible, working demo. Do NOT touch voice mode.

## Repo layout
- `frontend/` — Next.js 15 buyer app (login, home, product, negotiate via WebSocket, checkout)
- `backend/` — FastAPI. Routers: `auth.py` (buyer demo creds), `buyer.py`, `vendor.py`, `ws.py` (negotiation WebSocket). Agents: `price_intelligence.py`, `negotiation_agent.py` (Groq llama-3.3-70b), `deal_closing_agent.py`, `learning_agent.py`, `discovery_agent.py` (already has a full Groq tool-calling loop — USE IT AS THE TEMPLATE). Tools in `backend/tools/`. Styled demo-terminal logging in `logger.py`.
- `vendor/` — standalone Vite+React vendor app. Currently a UI mock: renders hardcoded `INITIAL_PRODUCTS` from `src/data/constants.js`, zero API calls, no login. `AddListing.jsx` is a 5-step wizard (Identity → Photos → Pricing → Priya AI → Launch) with no backend target.

## Decisions already made (do not re-litigate)
- Persona is **per product**, chosen in AddListing's existing "Priya AI" step. 3 fixed personas only — no free-text vendor instructions.
- Vendor auth = hardcoded demo credentials, same pattern as buyer `auth.py`.
- Cross-sell on stalled negotiations: Priya voices it + product cards render in the negotiate screen. Same-vendor products only. Card click → normal product page (pre-warmed sessions are a stretch goal, skip unless ahead of schedule).
- Cut list (do NOT build): vendor visual redesign, persona analytics dashboard widget, aggressiveness slider, vendor signup, image upload (URL field or preset images only).

## LOGGING REQUIREMENT (applies to every phase)
`logger.py` already prints styled terminal output (`agent_header`, `tool_switch`, `tool_result`, etc.) — this terminal is part of the live demo. Every new behavior MUST log there:
- Every agent handoff (Price Intelligence → Negotiation → Deal Closing → Learning) — already partially done, keep it consistent for new paths.
- Every tool call and tool result in the negotiation loop (name, args, result summary).
- Persona selection at session start (which persona, which tactic/concession biases it applied).
- Stall detection firing (which condition triggered, gap values) and the system nudge injection.
- `close_deal` floor-validation rejections (attempted price vs floor) — this is a judge-facing safety story.
- New vendor API hits (product created, floor updated, negotiable toggled).
Add new logger helpers in `logger.py` matching the existing style rather than raw prints.

## Phase 1 — Wire vendor app to backend (end-to-end listing flow)
1. DB (`backend/database.py`): add to `Product`: `is_negotiable Boolean default True`, `persona String default "soft"`. Add to `Negotiation`: `persona String nullable` (stored at session start — future analytics groups by it). SQLite: update models + re-seed (`seed.py`), or ALTER. **Do this first — everything depends on it.**
2. Backend: `POST /vendor/{vendor_id}/products` (all Product fields incl. persona, is_negotiable, image_url). `/auth/vendor/login` mirroring buyer demo-credentials pattern, returns vendor id/name/shop_name. Expose `is_negotiable` + `persona` in existing vendor + buyer product endpoints.
3. Vendor app: minimal login screen (store vendor_id in localStorage). Replace `INITIAL_PRODUCTS` with `GET /vendor/{id}/products`. Wire negotiable toggle + floor-price edit to `PUT /vendor/products/{id}/floor` (add a small PATCH for is_negotiable if needed). Wire AddListing submit to the new POST. Images: URL input or preset assets.
4. Buyer frontend: Negotiate button only shows when `is_negotiable`. Verify: vendor adds listing → appears on buyer home.

## Phase 2 — Personas + richer product prompt
5. Persona picker in AddListing "Priya AI" step: 3 cards — `soft`, `to_the_point`, `haggler`.
6. `build_system_prompt` (negotiation_agent.py) — two additions:
   - **Product properties block**: pass the full Product; include description, category, sub_category, gender, stock/age context, with an instruction to weave these into the pitch ("mention the fabric/craft when defending the price"). Check seed data has non-empty descriptions; backfill a sentence where missing.
   - **Persona style block**:
     - `soft` (warm didi): friendly, uses buyer's name, longer sentences, concedes in small friendly steps, closes fast.
     - `to_the_point`: near-MRP open, max 2–3 counters, short clipped sentences, states "final price" early, firm.
     - `haggler` (bazaar style, demo star): theatrical, flattery + scarcity, big dramatic concessions in shrinking steps ("only for you, sister…"), most rounds.
7. `price_intelligence.py`: persona biases tactics + opening counter — soft ≈93% MRP + quick_close/reciprocity; to_the_point ≈99% + firm_hold; haggler ≈103–105% + scarcity/flattery/anchor_high. Persona also shapes the concession curve (how fast gap closes per round). Log the chosen persona + biases via logger.

## Phase 3 — Tool-calling negotiation agent + stall cross-sell (the win condition)
8. Convert `NegotiationSession.respond()` to a Groq tool-calling loop, mirroring `discovery_agent.py`'s structure. Three tools:
   - **`close_deal(price)`** — replaces the `DEAL_CONFIRMED:₹` regex signal. Backend validates price ≥ floor and REJECTS below-floor calls (return an error result so the model retries above floor; log the rejection prominently). Keep the regex as silent fallback.
   - **`find_alternatives(max_budget)`** — same-vendor, same-category-preferred products priced ≤ max_budget × 1.15, is_negotiable-agnostic but exclude current product. Returns compact product list. On call: `ws.py` pushes `{"type": "alternatives", "products": [...]}` and Priya's text reply voices the handoff.
   - **`get_product_details()`** — reuse `backend/tools/get_product_details.py` so Priya answers fabric/size questions mid-haggle.
9. Stall detection in `ws.py`: track buyer's extracted offer per turn (extend existing deal-detection parsing; digit regex is acceptable). Trigger when round ≥ 4 AND (buyer offer below floor twice consecutively, OR ask/offer gap hasn't shrunk ≥25% over last 2 rounds). On trigger: inject a system nudge into the conversation — "buyer is stuck below your floor — consider offering alternatives" — and let the model decide to call `find_alternatives`. Log trigger + nudge.
10. Frontend negotiate screen: render 2–3 alternative product cards when the `alternatives` WS message arrives; card click → product page.

## Demo script this must support (verify each beat end-to-end)
1. Vendor logs in → adds listing, picks Haggler persona → product appears on buyer home.
2. Buyer negotiates → Priya markets the fabric/craft in character, terminal shows agent pipeline logs.
3. Buyer lowballs below floor → terminal shows stall trigger + `find_alternatives` tool call → cards slide into buyer screen → buyer buys an alternative. If asked about safety: show `close_deal` rejecting a below-floor price in the terminal.

## Sequencing warnings
- DB columns + re-seed FIRST. Schema churn mid-day kills the timeline.
- After each phase, run the app and verify the corresponding demo beat before moving on.
- Frontend/backend contract: keep field names snake_case from API; vendor app currently uses camelCase mock fields (`isNegotiable`, `floorPrice`, `daysUnsold`) — map at fetch boundary.
