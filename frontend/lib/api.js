const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// Image + discount metadata keyed by product ID
// Add more entries as you seed more products
const PRODUCT_META = {
  1: { imageUrl: "/product/bandhni_silk_dupatta.png", discount: "15% OFF", originalPrice: 1059 },
  2: { imageUrl: "/product/lucknow_chikankari_kurti.png", discount: "20% OFF", originalPrice: 1499 },
  3: { imageUrl: "/product/product3.jpeg", discount: null,       originalPrice: null  },
  4: { imageUrl: "/product/product4.jpeg", discount: "10% OFF", originalPrice: 555  },
  5: { imageUrl: "/product/product5.jpeg", discount: null,       originalPrice: null  },
  6: { imageUrl: "/product/product6.jpeg", discount: "25% OFF", originalPrice: null  },
};

function enrichProduct(p) {
  if (!p || p.id == null) return null;
  const meta = PRODUCT_META[p.id] || {};
  return { ...p, ...meta };
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
