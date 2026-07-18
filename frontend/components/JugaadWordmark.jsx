"use client";

/**
 * JugaadWordmark
 * ─────────────
 * Props:
 *   titleSize  – font size for "Jugaad"        (default: 34)
 *   titleColor – colour for "Jugaad"           (default: "#111")
 *   tagline    – subtitle text                 (default: "Mol karo · Save karo")
 *   taglineColor – colour for tagline          (default: "#9ca3af")
 *   align      – "left" | "center" | "right"  (default: "left")
 */
export default function JugaadWordmark({
  titleSize    = 34,
  titleColor   = "#3F2A63",
  tagline      = "Mol karo · Save karo",
  taglineColor = "#9ca3af",
  align        = "left",
}) {
  return (
    <div className="-mt-12" style={{ textAlign: align }}>
      <h1
        className="leading-none"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: titleSize,
          fontWeight: 900,
          color: titleColor,
          letterSpacing: "-0.02em",
        }}
      >
        Jugaad
      </h1>
      {tagline && (
        <p
          className="mt-0.5 tracking-widest uppercase font-medium"
          style={{ fontSize: 11, color: taglineColor }}
        >
          {tagline}
        </p>
      )}
    </div>
  );
}
