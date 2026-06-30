"use client";

export default function AgentBlob({ isSpeaking, size = 100 }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow ring */}
        {isSpeaking && (
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, #a855f7, transparent)",
              animation: "mic-pulse 1.2s ease-in-out infinite",
              transform: "scale(1.4)",
            }}
          />
        )}
        {/* Blob */}
        <div
          className={`w-full h-full ${isSpeaking ? "blob-morph-fast" : "blob-morph"}`}
          style={{
            background: isSpeaking
              ? "linear-gradient(135deg, #a855f7, #ec4899, #8b5cf6)"
              : "linear-gradient(135deg, #7c3aed, #a855f7)",
            boxShadow: isSpeaking
              ? "0 0 30px rgba(168,85,247,0.6), 0 0 60px rgba(236,72,153,0.3)"
              : "0 0 20px rgba(124,58,237,0.4)",
          }}
        >
          {/* Face */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-white opacity-90" />
                <div className="w-2 h-2 rounded-full bg-white opacity-90" />
              </div>
              <div className="w-4 h-1 rounded-full bg-white opacity-70 mt-1" />
            </div>
          </div>
        </div>
      </div>
      <span className="text-xs text-purple-300 font-semibold tracking-wide">Priya (AI)</span>
    </div>
  );
}
