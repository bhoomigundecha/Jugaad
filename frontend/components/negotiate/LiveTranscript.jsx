"use client";
import { useEffect, useRef } from "react";

/**
 * LiveTranscript
 * Props: messages – [{ id, speaker: "ai"|"you", text, time }]
 */
function Message({ speaker, text, time }) {
  const isAI = speaker === "ai";
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: isAI ? "#7c3aed" : "#9ca3af" }}>
          {isAI ? "AI Assistant" : "You"}
        </span>
        <span style={{ fontSize: 9, color: "#9ca3af", letterSpacing: "0.06em" }}>{time}</span>
      </div>

      {isAI ? (
        <div style={{ borderLeft: "2.5px solid #7c3aed", paddingLeft: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", lineHeight: 1.55, margin: 0 }}>
            &ldquo;{text}&rdquo;
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 13, fontWeight: 400, color: "#6b7280", lineHeight: 1.55, margin: 0, paddingLeft: 12 }}>
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function LiveTranscript({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, overflow: "hidden", position: "relative" }}>

      {/* Header */}
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9ca3af" }}>
          Live Transcript
        </span>
      </div>

      {/* Messages */}
      <div style={{ maxHeight: 220, overflowY: "auto", padding: "12px 16px 0", scrollbarWidth: "none" }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", paddingBottom: 16 }}>
            Waiting for conversation to begin…
          </p>
        ) : (
          messages.map((m) => <Message key={m.id} {...m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to top, rgba(237,230,250,0.9) 0%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ height: 24 }} />
    </div>
  );
}
