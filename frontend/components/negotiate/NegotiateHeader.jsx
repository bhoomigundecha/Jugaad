"use client";
import { Menu, Settings } from "lucide-react";

/**
 * NegotiateHeader
 * Props: status, elapsed, onMenu, onSettings
 */
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const glass = {
  background:           "rgba(255,255,255,0.55)",
  backdropFilter:       "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border:               "1px solid rgba(255,255,255,0.75)",
};

export default function NegotiateHeader({ status = "connecting", elapsed = 0, onMenu, onSettings }) {
  const isActive = status === "negotiating" || status === "thinking";

  return (
    <div className="-mt-10 flex items-center justify-between px-5 pt-12 pb-3">

      {/* Left: hamburger + Jugaad wordmark */}
      <div className="flex items-center gap-3">
        
        <div className="ml-4">
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 40, fontWeight: 900, color: "#3F2A63", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Jugaad
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#7c3aed" : "#9ca3af", boxShadow: isActive ? "0 0 6px #7c3aed" : "none", display: "block", flexShrink: 0, animation: isActive ? "negotiate-pulse 2s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: isActive ? "#7c3aed" : "#9ca3af", textTransform: "uppercase" }}>
              {isActive ? `ACTIVE • ${formatTime(elapsed)}` : status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Right: settings */}
      <div>
        <button onClick={onSettings} className="-ml-14 w-9 h-9 rounded-full flex items-center justify-center" style={{ ...glass, borderRadius: "50%", boxShadow: "0 2px 10px rgba(100,70,200,0.12)" }}>
          <Settings size={16} color="#7c3aed" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
