// Jugaad Vendor — backend API client
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function vendorLogin(email, password) {
  const res = await fetch(`${BASE}/auth/vendor/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Invalid email or password");
  }
  return res.json();
}

export async function vendorSignup({ name, email, shop_name, password }) {
  const res = await fetch(`${BASE}/auth/vendor/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, shop_name, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Signup failed");
  }
  return res.json();
}

export async function getVendorProducts(vendorId) {
  const res = await fetch(`${BASE}/vendor/${vendorId}/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createProduct(vendorId, payload) {
  const res = await fetch(`${BASE}/vendor/${vendorId}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to create product");
  }
  return res.json();
}

export async function updateFloorPrice(productId, floorPrice) {
  const res = await fetch(`${BASE}/vendor/products/${productId}/floor`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ floor_price: floorPrice }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Failed to update floor price");
  }
  return res.json();
}

export async function updateNegotiable(productId, isNegotiable) {
  const res = await fetch(`${BASE}/vendor/products/${productId}/negotiable`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_negotiable: isNegotiable }),
  });
  if (!res.ok) throw new Error("Failed to update negotiable state");
  return res.json();
}

export async function updatePersona(productId, persona) {
  const res = await fetch(`${BASE}/vendor/products/${productId}/persona`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona }),
  });
  if (!res.ok) throw new Error("Failed to update persona");
  return res.json();
}

/** Maps a backend product (snake_case) to the shape the UI components expect. */
export function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    mrp: p.mrp,
    daysUnsold: p.age_days ?? 0,
    isNegotiable: !!p.is_negotiable,
    isExpanded: false,
    floorPrice: p.floor_price ?? null,
    persona: p.persona || "soft",
    image: p.image_url || null,
  };
}
