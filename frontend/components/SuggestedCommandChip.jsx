"use client";
import { motion } from "framer-motion";

/**
 * SuggestedCommandChip
 * ─────────────────────
 * Pill-shaped example-prompt chip for voice mode's "Try these commands" list.
 *
 * Props:
 *   label    – chip text
 *   onClick  – (label) => void
 */
export default function SuggestedCommandChip({ label, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick?.(label)}
      className="px-3.5 py-1.5 rounded-full text-xs text-center"
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.22)",
        color: "#fff",
        fontWeight: 500,
      }}
    >
      {label}
    </motion.button>
  );
}
