"use client";

const HEIGHTS = [40, 70, 100, 85, 60, 90, 50, 75, 95, 65];
const DELAYS  = [0, 100, 200, 150, 50, 120, 80, 180, 30, 160];

export default function Waveform({ active, color = "#a855f7" }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 40 }}>
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-150"
          style={{
            width: 3,
            height: active ? `${h}%` : "20%",
            background: active
              ? `linear-gradient(to top, ${color}, #ec4899)`
              : "rgba(255,255,255,0.15)",
            // Use a single CSS animation property — no mixing
            animation: active
              ? `wave-bar ${0.6 + i * 0.07}s ${DELAYS[i]}ms ease-in-out infinite alternate`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}
