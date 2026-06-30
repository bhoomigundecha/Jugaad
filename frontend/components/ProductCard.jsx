"use client";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * ProductCard
 * ───────────
 * Props:
 *   product  – { id, name, mrp, originalPrice?, discount?, category, imageUrl? }
 *   wishlisted   – boolean
 *   onWishlist   – (id) => void
 *   onNegotiate  – (product) => void   (optional — falls back to /product/:id)
 *   glass        – boolean  (default true) use glassmorphism card style
 */

const GRAD = { _default: "#fff" };

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function ProductCard({ product, wishlisted, onWishlist, onNegotiate, glass = true }) {
  const router = useRouter();
  if (!product) return null;
  const grad = "#fff";

  const handleClick = () => {
    if (onNegotiate) onNegotiate(product);
    else router.push(`/product/${product.id}`);
  };

  const cardStyle = glass
    ? {
        background:           "rgba(255,255,255,0.58)",
        backdropFilter:       "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border:               "1px solid rgba(255,255,255,0.78)",
        borderRadius:         22,
        boxShadow:            "0 4px 20px rgba(100,70,180,0.10)",
      }
    : {
        background:   "#fff",
        borderRadius: 22,
        boxShadow:    "0 2px 12px rgba(0,0,0,0.07)",
        border:       "1px solid #f3f4f6",
      };

  return (
    <motion.div
      variants={cardVariants}
      onClick={handleClick}
      className="relative overflow-hidden cursor-pointer active:scale-95 transition-transform w-full"
      style={cardStyle}
    >
      {/* ── Image / placeholder ── */}
      <div
        className="relative"
        style={{ height: 160, background: grad, borderRadius: "22px 22px 0 0", position: "relative", overflow: "hidden" }}
      >
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              padding: "8px",
              borderRadius: "22px 22px 0 0",
            }}
          />
        )}

        {/* Discount badge */}
        {product.discount && (
          <div
            className="absolute top-3 left-3 font-bold"
            style={{
              background: "#dcfce7", color: "#16a34a",
              fontSize: 9, padding: "3px 8px", borderRadius: 99,
            }}
          >
            {product.discount}
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.stopPropagation(); onWishlist?.(product.id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(8px)" }}
        >
          <Heart
            size={14}
            color={wishlisted ? "#ef4444" : "#9ca3af"}
            fill={wishlisted  ? "#ef4444" : "none"}
          />
        </button>

        {/* Star rating */}
        
    
      </div>

      {/* ── Info ── */}
      <div style={{ padding: "10px 12px 12px" }}>
        {/* Product name */}
        <p
          className="font-semibold leading-tight line-clamp-2"
          style={{ fontSize: 12, color: "#1f2937", minHeight: 32 }}
        >
          {product.name}
        </p>

        {/* Price — centred */}
        <div className="flex items-baseline justify-center gap-1.5 my-2">
          {product.originalPrice && (
            <span style={{ fontSize: 10, color: "#9ca3af", textDecoration: "line-through" }}>
              ₹{product.originalPrice}
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>
            ₹{product.mrp}
          </span>
        </div>

        {/* Segmented pill — white outer, two dark inner pills */}
        <div
          className="flex gap-1.5 p-1"
          style={{ background: "#fff", borderRadius: 999, border: "1.5px solid #e5e7eb" }}
        >
          {/* Buy Now — purple */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}`); }}
            className="flex-1 flex items-center justify-center"
            style={{ background: "#3F2A63", color: "#fff", fontSize: 10, fontWeight: 800, padding: "6px 8px", borderRadius: 999, border: "none", cursor: "pointer" }}
          >
            Buy Now
          </motion.button>

          {/* Negotiate — black */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
            className="flex-1 flex items-center justify-center"
            style={{ background: "#111", color: "#fff", fontSize: 10, fontWeight: 800, padding: "6px 8px", borderRadius: 999, border: "none", cursor: "pointer" }}
          >
            Negotiate
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
