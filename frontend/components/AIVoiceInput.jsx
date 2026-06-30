"use client";
import { Mic, MicOff } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * AIVoiceInput — click-to-toggle mic with animated waveform visualizer.
 *
 * Props:
 *   onStart  ()      → called when recording starts
 *   onStop   (secs)  → called when recording stops, receives duration in seconds
 *   disabled  bool   → greys out the button (e.g. while agent is speaking)
 *   visualizerBars  number (default 48)
 *   className  string
 */
export default function AIVoiceInput({
  onStart,
  onStop,
  disabled = false,
  visualizerBars = 48,
  className,
}) {
  const [active, setActive] = useState(false);
  const [time, setTime]     = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Timer while recording
  useEffect(() => {
    let id;
    if (active) {
      onStart?.();
      id = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (time > 0) onStop?.(time);
      setTime(0);
    }
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const toggle = () => {
    if (disabled) return;
    setActive((a) => !a);
  };

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={cn("w-full flex flex-col items-center gap-3", className)}>

      {/* Mic button */}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 relative",
          disabled && "opacity-40 cursor-not-allowed",
          !disabled && "active:scale-90"
        )}
        style={{
          background: active
            ? "linear-gradient(135deg, #7c3aed, #ec4899)"
            : "rgba(124,58,237,0.15)",
          border: active
            ? "2px solid rgba(236,72,153,0.5)"
            : "2px solid rgba(124,58,237,0.3)",
          boxShadow: active
            ? "0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(236,72,153,0.2)"
            : "0 0 10px rgba(124,58,237,0.2)",
        }}
      >
        {/* Pulse ring when active */}
        {active && (
          <span
            className="absolute inset-0 rounded-2xl opacity-40"
            style={{
              border: "2px solid #ec4899",
              animation: "mic-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        {active ? (
          /* Spinning square = "recording" indicator */
          <div
            className="w-6 h-6 rounded-sm"
            style={{
              background: "white",
              animation: "spin 3s linear infinite",
            }}
          />
        ) : (
          <Mic className="w-7 h-7 text-purple-300" />
        )}
      </button>

      {/* Timer */}
      <span
        className="font-mono text-sm transition-all duration-300"
        style={{ color: active ? "rgba(216,180,254,0.9)" : "rgba(168,85,247,0.35)" }}
      >
        {fmt(time)}
      </span>

      {/* Waveform visualizer */}
      <div
        className="flex items-center justify-center gap-[2px]"
        style={{ height: 32, width: "100%", maxWidth: 240 }}
      >
        {Array.from({ length: visualizerBars }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: 2,
              height: active && isClient
                ? `${20 + Math.random() * 80}%`
                : "12%",
              background: active
                ? `linear-gradient(to top, #7c3aed, #ec4899)`
                : "rgba(168,85,247,0.2)",
              animation: active
                ? `wave-bar ${0.5 + (i % 8) * 0.08}s ${i * 20}ms ease-in-out infinite alternate`
                : undefined,
            }}
          />
        ))}
      </div>

      {/* Status label */}
      <p
        className="text-xs transition-all duration-300"
        style={{ color: active ? "rgba(216,180,254,0.8)" : "rgba(168,85,247,0.5)" }}
      >
        {disabled ? "Wait for Priya..." : active ? "Listening..." : "Tap to speak"}
      </p>
    </div>
  );
}
