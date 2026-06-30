"use client";
import { motion } from "framer-motion";

/**
 * HomeBanner
 * ──────────
 * Props:
 *   title        – big offer text           (default: "40% OFF")
 *   subtitle     – line above title          (default: "Pay via UPI & enjoy a special offer!")
 *   ctaLabel     – button text              (default: "Pay with UPI")
 *   onCta        – () => void               (button click handler)
 *   imageSrc     – path to cutout image     (default: "/home/banner.png")
 *   imageAlt     – alt text for image       (default: "Offer")
 *   bgFrom       – gradient start colour    (default: "#4a1a8a")
 *   bgTo         – gradient end colour      (default: "#9b5de5")
 */
export default function HomeBanner({
  title    = "40% OFF",
  subtitle = "Pay via UPI & enjoy a special offer!",
  ctaLabel = "Pay with UPI",
  onCta,
  imageSrc = "/home/banner.png",
  imageAlt = "Offer",
  bgFrom   = "#4a1a8a",
  bgTo     = "#9b5de5",
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:   `linear-gradient(120deg, ${bgFrom} 0%, ${bgTo} 100%)`,
        borderRadius: 25,
        minHeight:    148,
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "absolute", right: -24, top: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: -16, bottom: -20, width: 80,  height: 80,  borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      {/* Left: text + CTA */}
      <div className="relative z-10 flex flex-col justify-center h-full" style={{ width: "56%", padding: "20px 0 20px 20px" }}>
        <p style={{ color: "rgba(220,200,255,0.9)", fontSize: 11, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
          {subtitle}
        </p>

        <p style={{ color: "#fbbf24", fontSize: 34, fontWeight: 900, lineHeight: 1, marginBottom: 14 }}>
          {title}
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCta}
          style={{
            alignSelf:    "flex-start",
            background:   "#111",
            color:        "#fff",
            fontSize:     11,
            fontWeight:   800,
            padding:      "9px 18px",
            borderRadius: 999,
            border:       "none",
            cursor:       "pointer",
          }}
        >
          {ctaLabel}
        </motion.button>
      </div>

      {/* Right: cutout image with purple hue blend */}
      <div
        style={{
          position: "absolute",
          right: 0, bottom: 0, top: 0,
          width: "50%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          style={{
            height: "115%",
            width: "115%",
            objectFit: "contain",
            objectPosition: "80% bottom",
          }}
        />
      </div>
    </div>
  );
}
