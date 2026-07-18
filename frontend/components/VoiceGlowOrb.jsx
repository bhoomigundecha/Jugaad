"use client";
import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";

/**
 * VoiceGlowOrb
 * ────────────
 * Tap-to-activate voice orb for dark voice-mode screens — layered pulsing
 * rings around a warm gradient core, with a mic badge overlay so the
 * tap-to-speak affordance is obvious, not just an animated blob.
 *
 * Props:
 *   active    – boolean, switches to the "listening" animation state
 *   thinking  – boolean, shows a processing spinner on the badge instead of the mic
 *   size      – px, default 168
 *   onTap     – () => void
 */
export default function VoiceGlowOrb({ active = false, thinking = false, size = 168, onTap }) {
  const ringCount = 3;

  return (
    <button
      onClick={onTap}
      className="relative flex items-center justify-center"
      style={{ width: size * 1.7, height: size * 1.7, background: "transparent", border: "none" }}
    >
      {/* Pulsing rings */}
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            border: "1.5px solid rgba(196,181,253,0.5)",
          }}
          animate={{
            scale: [1, active ? 1.9 : 1.5],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: active ? 1.6 : 2.6,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * (active ? 0.4 : 0.7),
          }}
        />
      ))}

      {/* Core gradient orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background:
            "conic-gradient(from 180deg, #f3e8ff, #d8b4fe, #a855f7, #7c3aed, #5b21b6, #7c3aed, #d8b4fe, #f3e8ff)",
          filter: "blur(2px)",
        }}
        animate={{
          rotate: 360,
          scale: active ? [1, 1.08, 1] : [1, 1.03, 1],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: active ? 1 : 2.4, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Soft frosted core cap so it reads as a glowing sphere, not a ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background:
            "radial-gradient(circle at 38% 32%, rgba(255,255,255,0.75), rgba(255,255,255,0.05) 60%)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Mic icon — seamless with the orb, no badge/background, just the icon */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: active
            ? "drop-shadow(0 0 8px rgba(236,72,153,0.9)) drop-shadow(0 1px 3px rgba(0,0,0,0.5))"
            : "drop-shadow(0 1px 4px rgba(0,0,0,0.45))",
        }}
      >
        {thinking ? (
          <Loader2 size={size * 0.2} color="#fff" className="animate-spin" />
        ) : (
          <Mic size={size * 0.21} color="#fff" strokeWidth={2.25} />
        )}
      </div>
    </button>
  );
}
