"use client";

export default function TranscriptBubble({ text, speaker }) {
  if (!text) return null;
  const isAgent = speaker === "agent";

  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"} w-full px-1`}>
      <div
        className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isAgent
            ? "rgba(168,85,247,0.15)"
            : "rgba(236,72,153,0.15)",
          border: isAgent
            ? "1px solid rgba(168,85,247,0.3)"
            : "1px solid rgba(236,72,153,0.3)",
          color: isAgent ? "#e9d5ff" : "#fbcfe8",
          backdropFilter: "blur(8px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
