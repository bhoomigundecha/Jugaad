"use client";
import { Mic, MicOff } from "lucide-react";

export default function MicButton({ isRecording, onPress, onRelease, disabled }) {
  return (
    <button
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      disabled={disabled}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 ${
        isRecording ? "mic-pulse" : ""
      }`}
      style={{
        background: isRecording
          ? "linear-gradient(135deg, #ec4899, #f97316)"
          : "linear-gradient(135deg, #7c3aed, #a855f7)",
        boxShadow: isRecording
          ? "0 0 30px rgba(236,72,153,0.6)"
          : "0 0 20px rgba(124,58,237,0.4)",
      }}
    >
      {isRecording
        ? <Mic size={24} className="text-white" />
        : <MicOff size={24} className="text-white opacity-70" />
      }
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
      )}
    </button>
  );
}
