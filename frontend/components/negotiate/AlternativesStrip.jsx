"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * AlternativesStrip
 * Shown when the negotiation stalls and Priya's find_alternatives tool
 * surfaces a couple of same-vendor products near the buyer's budget.
 * Props: products – [{ id, name, mrp, image_url, category }]
 */
export default function AlternativesStrip({ products = [] }) {
  const router = useRouter();

  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 20,
          padding: "12px 14px 14px",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9ca3af" }}>
          Priya suggests instead
        </span>

        <div className="flex gap-3 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {products.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push(`/product/${p.id}`)}
              className="flex-shrink-0 text-left"
              style={{
                width: 128,
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #f3f4f6",
                boxShadow: "0 2px 10px rgba(100,70,180,0.08)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <div style={{ height: 90, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>No image</span>
                )}
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <p
                  className="line-clamp-2"
                  style={{ fontSize: 11, fontWeight: 700, color: "#1f2937", lineHeight: 1.3, minHeight: 28 }}
                >
                  {p.name}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#7c3aed" }}>₹{p.mrp}</span>
                  <ArrowRight size={12} color="#7c3aed" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
