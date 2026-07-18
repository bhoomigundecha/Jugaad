"use client";
import { useEffect, useRef } from "react";

/**
 * VoiceTranscript
 * ────────────────
 * Dark-theme subtitle/transcript card for the voice mode screen — same
 * layout language as the negotiate page's LiveTranscript (AI ASSISTANT
 * label + timestamp + quoted line), adapted for a dark background.
 *
 * Props:
 *   messages – [{ id, speaker: "ai"|"you", text, time }]
 */
function Message({ speaker, text, time }) {
  const isAI = speaker === "ai";
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: isAI ? "#d8b4fe" : "rgba(255,255,255,0.5)" }}>
          {isAI ? "AI Assistant" : "You"}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{time}</span>
      </div>

      {isAI ? (
        <div style={{ borderLeft: "2.5px solid #a855f7", paddingLeft: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.5, margin: 0 }}>
            &ldquo;{text}&rdquo;
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: 0, paddingLeft: 12 }}>
          &ldquo;{text}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function VoiceTranscript({ messages = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ maxHeight: 130, overflowY: "auto", padding: "12px 14px 0", scrollbarWidth: "none" }}>
        {messages.map((m) => <Message key={m.id} {...m} />)}
        <div ref={bottomRef} />
      </div>
      <div style={{ height: 10 }} />
    </div>
  );
}
