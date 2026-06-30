"use client";
import { LayoutGrid, HelpCircle, PhoneOff, Pause, Mic } from "lucide-react";

/**
 * NegotiateBottomBar
 * Props: isRecording, disabled, onCounter, onClarify, onToggleMic, onEnd
 */
function BarButton({ icon: Icon, label, onClick, color = "#6b7280" }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform" style={{ minWidth: 56 }}>
      <Icon size={22} color={color} strokeWidth={1.8} />
      <span style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.04em" }}>{label}</span>
    </button>
  );
}

export default function NegotiateBottomBar({ isRecording = false, disabled = false, onCounter, onClarify, onToggleMic, onEnd }) {
  return (
    <div
      className="mb-3 rounded-[25] flex items-center justify-around px-3 pb-3 pt-4"
      style={{
        background:           "rgba(255,255,255,0.72)",
        backdropFilter:       "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop:            "1px solid rgba(255,255,255,0.55)",
        boxShadow:            "0 -2px 20px rgba(100,70,200,0.07)",
      }}
    >
      <BarButton icon={LayoutGrid} label="Counter" onClick={onCounter} />
      <BarButton icon={HelpCircle} label="Clarify"  onClick={onClarify} />

      {/* Big center mic button */}
      <button
        onClick={disabled ? undefined : onToggleMic}
        style={{
          width:          64,
          height:         64,
          borderRadius:   "50%",
          background:     disabled ? "rgba(124,58,237,0.3)" : "#7c3aed",
          boxShadow:      disabled ? "none" : "0 0 24px rgba(124,58,237,0.45)",
          border:         "none",
          cursor:         disabled ? "not-allowed" : "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginTop:      -20,
          flexShrink:     0,
          transition:     "box-shadow 0.3s ease",
          animation:      isRecording ? "orb-breathe 1.4s ease-in-out infinite" : "none",
        }}
      >
        {isRecording ? <Pause size={26} color="#fff" strokeWidth={2.5} /> : <Mic size={26} color="#fff" strokeWidth={2.5} />}
      </button>

      <BarButton icon={PhoneOff} label="End" onClick={onEnd} color="#ef4444" />
    </div>
  );
}
