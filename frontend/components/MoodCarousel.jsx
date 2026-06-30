"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// ─── Mood data ────────────────────────────────────────────────────────────────
const moods = [
  { title: "SMART",     subtitle: "Sharp everyday confidence.",    image: "/moods/smart.jpeg" },
  { title: "NIGHT OUT", subtitle: "Own the night.",                image: "/moods/night-out.jpeg" },
  { title: "CASUAL",    subtitle: "Relaxed. Comfortable. Stylish.", image: "/moods/casual.jpeg" },
  { title: "ELEVATED",  subtitle: "Timeless everyday elegance.",   image: "/moods/elevated.jpg" },
  { title: "STREET",    subtitle: "Bold urban energy.",            image: "/moods/street.jpeg" },
];

const N = moods.length;

// ─── Fallback gradient per card ───────────────────────────────────────────────
const gradients = [
  "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",
  "linear-gradient(160deg,#0d0d0d,#1a0033,#2d0068)",
  "linear-gradient(160deg,#0a1628,#0d2137,#112240)",
  "linear-gradient(160deg,#2a1500,#3d2000,#5a3800)",
  "linear-gradient(160deg,#0f0f0f,#1a1a1a,#2a2a2a)",
];

// ─── Stack transform per normalised offset ────────────────────────────────────
function getStackProps(offset) {
  switch (offset) {
    case 0:      return { x: 0,   y: 0,  scale: 1,     rotate: 0,     opacity: 1,    zIndex: 20 };
    case 1:      return { x: 52,  y: 22, scale: 0.875, rotate: 5.5,   opacity: 0.78, zIndex: 16 };
    case 2:      return { x: 92,  y: 40, scale: 0.76,  rotate: 10.5,  opacity: 0.50, zIndex: 12 };
    case N - 1:  return { x: -52, y: 22, scale: 0.875, rotate: -5.5,  opacity: 0.78, zIndex: 16 };
    case N - 2:  return { x: -92, y: 40, scale: 0.76,  rotate: -10.5, opacity: 0.50, zIndex: 12 };
    default:     return { x: 0,   y: 0,  scale: 0.65,  rotate: 0,     opacity: 0,    zIndex: 1  };
  }
}

const spring = { type: "spring", stiffness: 255, damping: 28, mass: 1 };

const CARD_W = 300;
const CARD_H = 430;

export default function MoodCarousel({ onIndexChange }) {
  const [current, setCurrent] = useState(0);
  const dragStartX = useRef(null);
  const hasDragged = useRef(false);

  // Notify parent after current changes — never call parent setState inside our own updater
  useEffect(() => { onIndexChange?.(current); }, [current]);

  const goNext = () => setCurrent((c) => (c + 1) % N);
  const goPrev = () => setCurrent((c) => (c - 1 + N) % N);

  const onPointerDown = (e) => {
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    hasDragged.current = false;
  };
  const onPointerMove = (e) => {
    if (dragStartX.current === null) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    if (Math.abs(x - dragStartX.current) > 8) hasDragged.current = true;
  };
  const onPointerUp = (e) => {
    if (dragStartX.current === null) return;
    const x = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = x - dragStartX.current;
    if (Math.abs(diff) > 60) diff < 0 ? goNext() : goPrev();
    dragStartX.current = null;
  };

  const handleCardClick = (offset) => {
    if (hasDragged.current || offset === 0) return;
    if (offset <= Math.floor(N / 2)) goNext();
    else goPrev();
  };

  return (
    <div
      className="relative w-full select-none touch-none"
      style={{ height: 500 }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {moods.map((mood, index) => {
        const offset = (index - current + N) % N;
        const { x, y, scale, rotate, opacity, zIndex } = getStackProps(offset);
        const isFront = offset === 0;

        return (
          <motion.div
            key={mood.title}
            onClick={() => handleCardClick(offset)}
            className="absolute"
            style={{
              width: CARD_W,
              height: CARD_H,
              left: "50%",
              top: "50%",
              marginLeft: -CARD_W / 2,
              marginTop: -CARD_H / 2,
              cursor: isFront ? "grab" : "pointer",
              borderRadius: 36,
              overflow: "hidden",
              // Shadow applied here so it works with border-radius
              boxShadow: isFront
                ? "0 44px 88px rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.35)"
                : "0 20px 44px rgba(0,0,0,0.38)",
              // Gradient fallback behind the image
              background: gradients[index % gradients.length],
            }}
            animate={{ x, y, scale, rotate, opacity, zIndex }}
            transition={spring}
          >
            {/* ── Photography — plain <img> so no Next.js fill positioning issues ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mood.image}
              alt={mood.title}
              loading={isFront ? "eager" : "lazy"}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                display: "block",
              }}
            />

            {/* ── Bottom gradient ─────────────────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom," +
                  "rgba(0,0,0,0.02) 0%," +
                  "rgba(0,0,0,0) 28%," +
                  "rgba(0,0,0,0.55) 65%," +
                  "rgba(0,0,0,0.92) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Top vignette ─────────────────────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom,rgba(0,0,0,0.18) 0%,transparent 25%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Bottom text ───────────────────────────────────────────────── */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 28px 32px" }}>
              <h2 style={{
                fontSize: 54,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 0.93,
                color: "white",
                fontFamily: "system-ui,-apple-system,'Helvetica Neue',sans-serif",
                textShadow: "0 2px 16px rgba(0,0,0,0.4)",
                margin: 0,
              }}>
                {mood.title}
              </h2>
              <p style={{
                fontSize: 12, fontWeight: 400, letterSpacing: "0.045em",
                color: "rgba(255,255,255,0.56)", marginTop: 7, marginBottom: 0,
              }}>
                {mood.subtitle}
              </p>

              {isFront && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.28, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                    color: "white", textTransform: "uppercase",
                  }}>
                    96 Looks
                  </span>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: "white",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                  }}>
                    <ArrowRight size={15} color="#111" strokeWidth={2.5} />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
