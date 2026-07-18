const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

function enrichProduct(p) {
  if (!p || p.id == null) return null;
  // camelCase alias for the backend's snake_case image_url — every product
  // now has a real, correctly-matched image from the seed catalog, so no
  // per-ID overrides here. (A previous PRODUCT_META table hardcoded a
  // handful of legacy ids to unrelated placeholder images — e.g. product 3
  // showed a band t-shirt photo instead of the actual bedsheet — and faked
  // discount badges for only 4 of 936 products. Removed both: they were
  // stale data that actively contradicted the real catalog.)
  return { imageUrl: p.image_url, ...p };
}

export async function getProducts() {
  const res = await fetch(`${BASE}/buyer/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.map(enrichProduct).filter(Boolean);
}

export async function getProduct(id) {
  const res = await fetch(`${BASE}/buyer/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch product");
  const data = await res.json();
  return enrichProduct(data);
}

export async function startNegotiation(productId, buyerId) {
  const res = await fetch(`${BASE}/buyer/negotiate/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, buyer_id: buyerId }),
  });
  if (!res.ok) throw new Error("Failed to start negotiation");
  return res.json();
}

export async function submitCheckout(sessionId, paymentMethod) {
  const res = await fetch(`${BASE}/buyer/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, payment_method: paymentMethod }),
  });
  if (!res.ok) throw new Error("Checkout failed");
  return res.json();
}

export async function getVendorDashboard(vendorId) {
  const res = await fetch(`${BASE}/vendor/${vendorId}/dashboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch vendor dashboard");
  return res.json();
}

export async function getVendorProducts(vendorId) {
  const res = await fetch(`${BASE}/vendor/${vendorId}/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch vendor products");
  return res.json();
}

export async function updateFloorPrice(productId, floorPrice) {
  const res = await fetch(`${BASE}/vendor/products/${productId}/floor`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ floor_price: floorPrice }),
  });
  if (!res.ok) throw new Error("Failed to update floor price");
  return res.json();
}

export async function getLiveNegotiations(vendorId) {
  const res = await fetch(`${BASE}/vendor/negotiations/live?vendor_id=${vendorId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch live negotiations");
  return res.json();
}

export function getNegotiationWsUrl(sessionId) {
  return `${WS_BASE}/ws/negotiate/${sessionId}`;
}

/**
 * One Discovery Agent turn — either `audioBase64` (recorded mic clip) or
 * `text` (fallback), plus the growing conversation history so far.
 * Returns { messages, reply, transcript, reply_audio, tool_results }.
 */
export async function discoverTurn(buyerId, messages, { audioBase64, text } = {}) {
  const res = await fetch(`${BASE}/buyer/discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyer_id: buyerId,
      messages,
      audio: audioBase64 || undefined,
      text: text || undefined,
    }),
  });
  if (!res.ok) throw new Error("Discovery turn failed");
  return res.json();
}

/** Extract product cards out of a discover-turn's tool_results, if any. */
export function extractProductsFromToolResults(toolResults = []) {
  for (const tr of toolResults) {
    const data = tr.result?.data;
    if (Array.isArray(data) && data.length && (tr.tool === "search_product" || tr.tool === "recommend_outfit")) {
      return data.map(enrichProduct).filter(Boolean);
    }
  }
  return null;
}
