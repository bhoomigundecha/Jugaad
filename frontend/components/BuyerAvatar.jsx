"use client";

export default function BuyerAvatar({ name, isSpeaking, size = 90 }) {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Speaking ring */}
        {isSpeaking && (
          <div
            className="absolute inset-0 rounded-full border-2 border-pink-400 opacity-70"
            style={{ animation: "mic-pulse 1s ease-in-out infinite", transform: "scale(1.2)" }}
          />
        )}
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-2xl"
          style={{
            background: "linear-gradient(135deg, #ec4899, #f97316)",
            boxShadow: isSpeaking
              ? "0 0 20px rgba(236,72,153,0.5)"
              : "0 0 10px rgba(236,72,153,0.2)",
          }}
        >
          {initials}
        </div>
      </div>
      <span className="text-xs text-pink-300 font-semibold tracking-wide">{name?.split(" ")[0] || "You"}</span>
    </div>
  );
}
