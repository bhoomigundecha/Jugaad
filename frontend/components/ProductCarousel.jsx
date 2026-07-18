"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

/**
 * ProductCarousel
 * ───────────────
 * Horizontally scrollable row of ProductCards with animated stagger entry.
 *
 * Props:
 *   title       – section heading string
 *   products    – array of product objects (same shape as ProductCard expects)
 *   viewAllHref – string  (default "#")
 *   wishlist    – Set or array of wishlisted product ids
 *   onWishlist  – (id) => void
 *   onNegotiate – (product) => void
 *   glass       – boolean passed down to each ProductCard (default true)
 *   layout      – "scroll" | "grid"  (default "scroll")
 *                 scroll = horizontal swipeable row
 *                 grid   = 2-column grid (no scroll arrows)
 */
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function ProductCarousel({
  title,
  products = [],
  viewAllHref = "#",
  wishlist    = [],
  onWishlist,
  onNegotiate,
  glass  = true,
  layout = "scroll",
  CardComponent = ProductCard,
  titleColor = "#1f2937",
}) {
  // Strip any null/undefined entries the API might return
  products = (products || []).filter(Boolean);
  const scrollRef  = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, products]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const isWishlisted = (id) =>
    Array.isArray(wishlist) ? wishlist.includes(id) : wishlist.has?.(id);

  return (
    <section className="w-full mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-0">
        <h2
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 19,
            fontWeight: 900,
            color: titleColor,
          }}
        >
          {title}
        </h2>
        <a
          href={viewAllHref}
          style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}
        >
          See All
        </a>
      </div>

      {layout === "grid" ? (
        /* ── Grid layout ── */
        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {products.map((p) => (
            <CardComponent
              key={p.id}
              product={p}
              wishlisted={isWishlisted(p.id)}
              onWishlist={onWishlist}
              onNegotiate={onNegotiate}
              glass={glass}
            />
          ))}
        </motion.div>
      ) : (
        /* ── Horizontal scroll layout ── */
        <div className="relative">
          <motion.div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 4 }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {products.map((p) => (
              <div key={p.id} style={{ width: 180, flexShrink: 0 }}>
                <CardComponent
                  product={p}
                  wishlisted={isWishlisted(p.id)}
                  onWishlist={onWishlist}
                  onNegotiate={onNegotiate}
                  glass={glass}
                />
              </div>
            ))}
          </motion.div>

          {/* Left arrow */}
          {canLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                border: "1px solid rgba(255,255,255,0.8)",
                transform: "translateY(-50%) translateX(-4px)",
              }}
            >
              <ChevronLeft size={16} color="#7c3aed" strokeWidth={2.5} />
            </button>
          )}

          {/* Right arrow */}
          {canRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                border: "1px solid rgba(255,255,255,0.8)",
                transform: "translateY(-50%) translateX(4px)",
              }}
            >
              <ChevronRight size={16} color="#7c3aed" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
