"use client";

/**
 * AIOrb
 * Props: status ("idle"|"thinking"|"speaking"|"listening"), onAction
 */
const STATUS_LABEL = { idle: "IDLE", thinking: "THINKING", speaking: "SPEAKING", listening: "LISTENING" };

export default function AIOrb({ status = "idle", onAction }) {
  const isActive   = status !== "idle";
  const isSpeaking = status === "speaking";
  const isThinking = status === "thinking";

  const glowColor = isActive ? "rgba(124,58,237,0.35)" : "rgba(124,58,237,0.10)";
  const ringColor = isActive ? "rgba(124,58,237,0.35)" : "rgba(124,58,237,0.15)";

  return (
    <div className="relative flex flex-col items-center" style={{ paddingTop: 12 }}>

      {/* Top-right small circle action button */}

      {/* Outer ring */}
      <div style={{ width: 220, height: 220, borderRadius: "50%", border: `1px solid ${ringColor}`, display: "flex", alignItems: "center", justifyContent: "center", animation: isThinking ? "orb-rotate 6s linear infinite" : "none", transition: "border-color 0.6s ease" }}>
        {/* Middle ring */}
        <div style={{ width: 178, height: 178, borderRadius: "50%", border: `1px solid ${ringColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Inner orb — light glassmorphism */}
          <div style={{
            width: 148, height: 148, borderRadius: "50%",
            background: "radial-gradient(circle at 38% 38%, rgba(255,255,255,0.85) 0%, rgba(237,230,250,0.75) 60%, rgba(196,181,253,0.5) 100%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: `0 0 40px ${glowColor}, inset 0 0 24px rgba(124,58,237,0.08)`,
            border: "1px solid rgba(255,255,255,0.8)",
            transition: "box-shadow 0.6s ease",
            animation: isSpeaking ? "orb-breathe 1.4s ease-in-out infinite" : (isThinking ? "orb-breathe 2.4s ease-in-out infinite" : "none"),
          }} />
        </div>
      </div>

      {/* Status chip */}
      <div className="flex items-center gap-2 mt-4" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: 99, padding: "5px 14px" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "#7c3aed" : "#d1d5db", boxShadow: isActive ? "0 0 6px #7c3aed" : "none", display: "block", animation: isActive ? "negotiate-pulse 1.8s ease-in-out infinite" : "none", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: isActive ? "#7c3aed" : "#9ca3af", textTransform: "uppercase" }}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}
