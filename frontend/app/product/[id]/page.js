"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Heart, Share2, Star, Mic, ShoppingBag } from "lucide-react";
import { getProduct, startNegotiation } from "@/lib/api";
import { getSession } from "@/lib/auth";

// Per-category gradient — same as ProductCard

export default function ProductPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [starting, setStarting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((p) => { setProduct(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleNegotiate = async () => {
    const buyer = getSession();
    if (!buyer) { router.push("/login"); return; }
    setStarting(true);
    try {
      const { session_id } = await startNegotiation(product.id, buyer.id);
      router.push(`/negotiate/${session_id}?product_id=${product.id}`);
    } catch {
      alert("Could not start negotiation. Is the backend running?");
    } finally {
      setStarting(false);
    }
  };

  const handleBuyNow = () => router.push(`/checkout?price=${product?.mrp}`);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, #e4d9f5, #d8cdf0)" }}>
      <div className="w-10 h-10 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-dvh flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, #e4d9f5, #d8cdf0)" }}>
      <p className="text-gray-400">Product not found</p>
    </div>
  );

  const grad        = "#fff";
  const origPrice   = product.originalPrice ?? Math.round(product.mrp * 1.25);
  const discountPct = Math.round((1 - product.mrp / origPrice) * 100);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#fff" }}>

      {/* ── Hero image ── */}
      <div className="relative flex-shrink-0" style={{ height: 320, background: grad }}>

        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              padding: 24,
            }}
          />
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button
            onClick={() => router.back()}
            className="-mt-11 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
          >
            <ChevronLeft size={20} color="#374151" marginTop={-1}/>
          </button>
          <div className="flex gap-2">
            <button
              className="-mt-11 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
            >
              <Share2 size={16} color="#374151" />
            </button>
            <button
              onClick={() => setWishlisted(!wishlisted)}
              className="-mt-11 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
            >
              <Heart size={16} color={wishlisted ? "#ef4444" : "#374151"} fill={wishlisted ? "#ef4444" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Info card ── */}
      <div
        className="flex-1 flex flex-col px-5 pt-6 pb-36"
        style={{
          background:   "#fff",
          borderRadius: "28px 28px 0 0",
          marginTop:    -24,
          border:       "none",
        }}
      >
        {/* Vendor + rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#ede9fe" }}>
              <ShoppingBag size={12} color="#7c3aed" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {product.vendor_name || "Rajesh Fashion House"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} color="#facc15" fill="#facc15" />
            <span className="text-xs font-bold text-gray-700">4.8</span>
            <span className="text-xs text-gray-400">· 1K+ Sold</span>
          </div>
        </div>

        {/* Name */}
        <h1 className="text-xl font-black text-gray-900 leading-tight mb-3">
          {product.name}
        </h1>

        

        {/* Negotiate hint
        <div
          className="flex items-center gap-3 p-4 mb-5"
          style={{ background: "linear-gradient(135deg, #f3e8ff, #ede9fe)", borderRadius: 18 }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#7c3aed" }}>
            <Mic size={18} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-900">Want a better price?</p>
            <p className="text-xs text-purple-500">Negotiate with our AI — Hindi, English, anything!</p>
          </div>
        </div> */}

        {/* Description */}
        <h3 className="font-bold text-gray-800 text-sm mb-1.5">Description</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {product.description || "High quality product crafted with care. Perfect for all occasions. Handpicked by our style team for the best look and feel."}
        </p>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "#f3f4f6", marginBottom: 20 }} />

        {/* ── Delivery Options ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#1f2937" }}>DELIVERY OPTIONS</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>

          {/* Pincode input */}
          <div className="flex items-center gap-2 mb-3" style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px" }}>
            <input
              type="number"
              placeholder="Enter pincode"
              maxLength={6}
              style={{ flex: 1, fontSize: 14, color: "#374151", background: "transparent", border: "none", outline: "none" }}
            />
            <button style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}>Check</button>
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>Enter PIN code to check delivery time &amp; Pay on Delivery availability</p>

          {[
            "100% Original Products",
            "Pay on delivery might be available",
            "Easy 7 days returns and exchanges",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2 mb-1.5">
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#d1d5db", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#4b5563" }}>{line}</span>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "#f3f4f6", marginBottom: 20 }} />

        {/* ── Best Offers ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#1f2937" }}>BEST OFFERS</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>

          {/* Best price highlight */}
          <p style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>Best Price: </span>
            <span style={{ color: "#7c3aed", fontWeight: 700 }}>₹{Math.round(product.mrp * 0.88)}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}> via UPI</span>
          </p>
          {[
            "Applicable on: Orders above ₹300",
            "Use UPI for instant checkout",
            "Max Discount: ₹250 off on first order",
          ].map((line) => (
            <div key={line} className="flex items-start gap-2 mb-1">
              <span style={{ color: "#9ca3af", fontSize: 13 }}>•</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{line}</span>
            </div>
          ))}
        </div>

        {/* ── Bank Offers ── */}
        {[
          { title: "10% Instant Discount on HDFC Credit Card", detail: "Min Spend ₹3,500 · Max Discount ₹1,000" },
          { title: "10% Instant Discount on Kotak Bank Credit Card", detail: "Min Spend ₹3,500 · Max Discount ₹1,000" },
          { title: "5% Cashback on Paytm Wallet", detail: "No minimum spend · Max Cashback ₹150" },
        ].map((offer) => (
          <div key={offer.title} className="mb-4">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 3 }}>{offer.title}</p>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>• {offer.detail}</p>
            <button style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              Terms &amp; Conditions
            </button>
          </div>
        ))}
      </div>

      {/* ── Fixed bottom: segmented pill ── */}
      <div
        className="rounded-[25px] fixed bottom-0 left-1/2 -translate-x-1/2 w-[360px] max-w-[430px] px-2 pb-2 pt-1"
        style={{
          background:           "rgba(255,255,255,0.72)",
          backdropFilter:       "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop:            "1px solid rgba(255,255,255,0.55)",
        }}
      >
        {/* Outer pill wrapper */}
        <div
          className="flex gap-2 p-1.5"
        >
          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            className="flex-1 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background:   "#111",
              color:        "#fff",
              fontWeight:   800,
              fontSize:     15,
              height:       52,
              borderRadius: 999,
              border:       "none",
              cursor:       "pointer",
            }}
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            Buy Now
          </button>

          {/* Negotiate */}
          <button
            onClick={handleNegotiate}
            disabled={starting}
            className="flex-1 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            style={{
              background:   "#3F2A63",
              color:        "#fff",
              fontWeight:   800,
              fontSize:     15,
              height:       52,
              borderRadius: 999,
              border:       "none",
              cursor:       "pointer",
            }}
          >
            {starting
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><Mic size={20} strokeWidth={2.5} /> Negotiate</>
            }
          </button>
        </div>
      </div>

    </div>
  );
}
