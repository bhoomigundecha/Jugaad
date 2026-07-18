"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, Heart, Share2, Star, Mic, ShoppingBag,
  ShieldCheck, Truck, RotateCcw, Sparkles,
} from "lucide-react";
import { getProduct, startNegotiation } from "@/lib/api";
import { getSession } from "@/lib/auth";

const SERIF = "var(--font-playfair), Georgia, serif";
const DEEP_PURPLE = "#2E1065";

export default function ProductPage() {
  const router  = useRouter();
  const { id }  = useParams();
  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [starting, setStarting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

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
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "#fff" }}>
      <div
        className="w-9 h-9 rounded-full animate-spin"
        style={{ border: "3px solid #E9DEFD", borderTopColor: "#7c3aed" }}
      />
    </div>
  );

  if (!product) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "#fff" }}>
      <p className="text-gray-400">Product not found</p>
    </div>
  );

  const origPrice   = product.originalPrice ?? Math.round(product.mrp * 1.25);
  const discountPct = Math.round((1 - product.mrp / origPrice) * 100);
  const description = product.description || "High quality product crafted with care. Perfect for all occasions. Handpicked by our style team for the best look and feel.";
  const descIsLong   = description.length > 110;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#fff" }}>

      {/* ── Top nav ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#fff", border: "1px solid #ECE4F5", boxShadow: "0 4px 14px rgba(46,16,101,0.08)" }}
        >
          <ChevronLeft size={19} color="#2E1065" />
        </button>
        <div className="flex gap-2">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #ECE4F5", boxShadow: "0 4px 14px rgba(46,16,101,0.08)" }}
          >
            <Share2 size={15} color="#2E1065" />
          </button>
          <button
            onClick={() => setWishlisted(!wishlisted)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #ECE4F5", boxShadow: "0 4px 14px rgba(46,16,101,0.08)" }}
          >
            <Heart size={15} color={wishlisted ? "#ef4444" : "#2E1065"} fill={wishlisted ? "#ef4444" : "none"} />
          </button>
        </div>
      </div>

      {/* ── Product image card — white, image fills it edge-to-edge ── */}
      <div className="relative flex-shrink-0 px-4 pb-4">
        <div
          className="relative rounded-[28px] overflow-hidden"
          style={{ height: 380, background: "#fff" }}
        >
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover" }}
            />
          )}

          {product.is_negotiable && (
            <div
              className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-10"
              style={{ background: DEEP_PURPLE, boxShadow: "0 4px 14px rgba(46,16,101,0.35)" }}
            >
              <Sparkles size={11} color="#f3e8ff" />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", color: "#f3e8ff" }}>
                AI Negotiation Available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content — standard Jugaad purple ── */}
      <div
        className="flex-1 flex flex-col px-6 pt-6 pb-40"
        style={{ background: `linear-gradient(160deg, #4C1D95 0%, ${DEEP_PURPLE} 100%)`, borderRadius: "26px 26px 0 0" }}
      >

        {/* Rating pill */}
        <div className="flex justify-center mb-3">
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
            style={{ background: "#fdf6e3", border: "1px solid #f0e0b8" }}
          >
            <Star size={11} color="#D4A94B" fill="#D4A94B" />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#a3781f" }}>4.8</span>
            <span style={{ fontSize: 10.5, color: "#c2a875" }}>· 1K+ sold</span>
          </div>
        </div>

        {/* Name */}
        <h1
          className="text-center leading-tight mb-2"
          style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}
        >
          {product.name}
        </h1>

        {/* Vendor row */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff" }}
          >
            <span style={{ fontSize: 8, fontWeight: 800, color: "#5B21B6" }}>
              {(product.vendor || "RF").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
          </div>
          <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
            {product.vendor || "Rajesh Fashion House"}
          </span>
          <ShieldCheck size={12} color="#D4A94B" />
        </div>

        {/* Price block */}
        <div className="flex items-baseline justify-center gap-2.5 mb-1">
          <span style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 900, color: "#fff" }}>
            ₹{product.mrp}
          </span>
          {origPrice > product.mrp && (
            <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "line-through" }}>
              ₹{origPrice}
            </span>
          )}
          {discountPct > 0 && (
            <span
              className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#fdf6e3", color: "#a3781f", border: "1px solid #f0e0b8" }}
            >
              {discountPct}% OFF
            </span>
          )}
        </div>
        <p className="text-[11px] text-center mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Inclusive of all taxes</p>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {[
            { icon: ShieldCheck, label: "100% Authentic" },
            { icon: Truck,       label: "Fast Delivery" },
            { icon: RotateCcw,   label: "7-Day Returns" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center gap-1.5 py-3 px-1.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <Icon size={16} color="#D4A94B" strokeWidth={1.8} />
              <span className="text-[9.5px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            About this piece
          </p>
          <p
            className={`text-[13.5px] leading-relaxed ${descExpanded ? "" : "line-clamp-3"}`}
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {description}
          </p>
          {descIsLong && (
            <button
              onClick={() => setDescExpanded((v) => !v)}
              className="text-[12px] font-bold mt-1"
              style={{ color: "#D4A94B", background: "none", border: "none", cursor: "pointer" }}
            >
              {descExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14) 15%, rgba(255,255,255,0.14) 85%, transparent)", marginBottom: 24 }} />

        {/* Delivery */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            Delivery
          </p>
          <div
            className="flex items-center gap-2 mb-2.5 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}
          >
            <input
              type="number"
              placeholder="Enter pincode"
              maxLength={6}
              style={{ flex: 1, fontSize: 13, color: "#fff", background: "transparent", border: "none", outline: "none" }}
            />
            <button style={{ fontSize: 12.5, fontWeight: 700, color: "#D4A94B", background: "none", border: "none", cursor: "pointer" }}>
              Check
            </button>
          </div>
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)" }}>
            Free delivery on prepaid orders · Cash on delivery available in most pincodes
          </p>
        </div>
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-5 pt-4"
        style={{
          background: `linear-gradient(180deg, rgba(46,16,101,0) 0%, ${DEEP_PURPLE} 35%)`,
        }}
      >
        {product.is_negotiable && (
          <p className="text-center text-[11px] font-medium mb-2.5 flex items-center justify-center gap-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
            <Sparkles size={11} color="#D4A94B" />
            Negotiate directly with Priya, your AI shopping concierge
          </p>
        )}
        <div
          className="flex gap-2.5 p-1.5 rounded-[26px]"
          style={{ background: "#fff", boxShadow: "0 10px 34px rgba(0,0,0,0.35)" }}
        >
          <button
            onClick={handleBuyNow}
            className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-[20px] font-bold text-[14.5px] active:scale-95 transition-transform"
            style={{ background: "#000", color: "#fff" }}
          >
            <ShoppingBag size={18} strokeWidth={2.3} />
            Buy Now
          </button>

          {product.is_negotiable && (
            <button
              onClick={handleNegotiate}
              disabled={starting}
              className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-[20px] font-bold text-[14.5px] active:scale-95 transition-transform disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, #5B21B6, ${DEEP_PURPLE})`, color: "#fff" }}
            >
              {starting
                ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><Mic size={18} strokeWidth={2.3} /> Negotiate</>
              }
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
