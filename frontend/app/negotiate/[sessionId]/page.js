"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import NegotiateHeader    from "@/components/negotiate/NegotiateHeader";
import AIOrb              from "@/components/negotiate/AIOrb";
import LiveTranscript     from "@/components/negotiate/LiveTranscript";
import NegotiateBottomBar from "@/components/negotiate/NegotiateBottomBar";
import AlternativesStrip  from "@/components/negotiate/AlternativesStrip";
import { getNegotiationWsUrl } from "@/lib/api";
import { getSession }          from "@/lib/auth";

export default function NegotiatePage() {
  const router      = useRouter();
  const { sessionId } = useParams();

  const [buyer,       setBuyer]       = useState(null);
  const [status,      setStatus]      = useState("connecting");
  const [orbStatus,   setOrbStatus]   = useState("idle");   // idle | thinking | speaking | listening
  const [isRecording, setIsRecording] = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [dealPrice,   setDealPrice]   = useState(null);
  const [dealNudge,   setDealNudge]   = useState("");
  const [elapsed,     setElapsed]     = useState(0);
  const [alternatives, setAlternatives] = useState([]);

  const wsRef             = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const audioQueueRef     = useRef([]);
  const isPlayingRef      = useRef(false);
  const msgIdRef          = useRef(0);
  const startTimeRef      = useRef(null);

  // ── Elapsed timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Helper: add a transcript message ────────────────────────────────────
  const addMessage = (speaker, text) => {
    const id   = ++msgIdRef.current;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    setMessages((prev) => [...prev, { id, speaker, text, time }]);
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const session = getSession();
    if (!session) { router.push("/login"); return; }
    setBuyer(session);

    const ws = new WebSocket(getNegotiationWsUrl(sessionId));
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("negotiating");
      startTimeRef.current = Date.now();
      setOrbStatus("idle");
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "agent_text") {
        addMessage("ai", msg.text);
        setOrbStatus("speaking");
      }

      if (msg.type === "agent_audio") {
        enqueueAudio(msg.data);
      }

      if (msg.type === "transcript") {
        addMessage("you", msg.text);
        setOrbStatus("thinking");   // AI is processing what you said
      }

      if (msg.type === "log") {
        // silent — could surface in a debug overlay
      }

      if (msg.type === "alternatives") {
        setAlternatives(msg.products || []);
      }

      if (msg.type === "deal_reached") {
        setDealPrice(msg.price);
        setDealNudge(msg.nudge);
        setStatus("deal");
      }

      if (msg.type === "error") {
        console.error("WS error:", msg.message);
      }
    };

    ws.onclose = () => {
      if (status !== "deal") setStatus("abandoned");
      setOrbStatus("idle");
    };

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 20000);

    return () => { clearInterval(ping); ws.close(); };
  }, [sessionId]);

  // ── Audio queue ───────────────────────────────────────────────────────────
  const enqueueAudio = (b64) => {
    audioQueueRef.current.push(b64);
    if (!isPlayingRef.current) playNext();
  };

  const playNext = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setOrbStatus((s) => s === "speaking" ? "idle" : s);
      return;
    }
    isPlayingRef.current = true;
    const b64 = audioQueueRef.current.shift();
    try {
      const bytes = new Uint8Array(atob(b64).split("").map((c) => c.charCodeAt(0)));
      const url   = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); playNext(); };
      await audio.play();
    } catch {
      isPlayingRef.current = false;
      playNext();
    }
  };

  // ── Mic ───────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (status !== "negotiating") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob   = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (wsRef.current?.readyState === WebSocket.OPEN)
            wsRef.current.send(JSON.stringify({ type: "audio", data: reader.result.split(",")[1] }));
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setOrbStatus("listening");
    } catch {
      alert("Microphone access required for voice negotiation.");
    }
  }, [status]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setOrbStatus("thinking");
  }, []);

  const handleToggleMic = () => isRecording ? stopRecording() : startRecording();

  const handleEnd = () => { wsRef.current?.close(); router.back(); };

  const handleCounter = () => {
    wsRef.current?.send(JSON.stringify({ type: "text", text: "I want to make a counter offer" }));
  };

  const handleClarify = () => {
    wsRef.current?.send(JSON.stringify({ type: "text", text: "Can you clarify that?" }));
  };

  // ── CSS keyframes injected once ──────────────────────────────────────────
  const KEYFRAMES = `
    @keyframes negotiate-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.55; transform: scale(0.88); }
    }
    @keyframes orb-breathe {
      0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.55), inset 0 0 30px rgba(124,58,237,0.12); }
      50%       { box-shadow: 0 0 70px rgba(124,58,237,0.85), inset 0 0 40px rgba(124,58,237,0.22); }
    }
    @keyframes orb-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;

  // ── Deal screen ───────────────────────────────────────────────────────────
  if (status === "deal") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(160deg, #e4d9f5 0%, #ede6fa 50%, #d8cdf0 100%)" }}>
        <style>{KEYFRAMES}</style>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}>
          <CheckCircle size={48} color="#fff" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#3F2A63", marginBottom: 8 }}>Deal Pakka! 🎉</h2>
        <p style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, color: "#7c3aed" }}>₹{dealPrice}</p>
        <p style={{ color: "#7c3aed", fontSize: 13, textAlign: "center", marginBottom: 32, lineHeight: 1.6 }}>
          {dealNudge}
        </p>
        <div className="w-full flex gap-3">
          <button onClick={handleEnd}
            style={{ flex: 1, padding: "16px 0", borderRadius: 16, fontWeight: 700, color: "#6b7280", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.75)", backdropFilter: "blur(12px)" }}>
            Cancel
          </button>
          <button onClick={() => router.push(`/checkout?session=${sessionId}&price=${dealPrice}`)}
            style={{ flex: 1, padding: "16px 0", borderRadius: 16, fontWeight: 700, color: "#fff", background: "#7c3aed", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
            Pay ₹{dealPrice} →
          </button>
        </div>
      </div>
    );
  }

  // ── Main negotiate screen ─────────────────────────────────────────────────
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "linear-gradient(160deg, #e4d9f5 0%, #ede6fa 50%, #d8cdf0 100%)" }}
    >
      <style>{KEYFRAMES}</style>

      {/* Header — fixed so it never scrolls away */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40"
        
      >
        <NegotiateHeader
          status={status}
          elapsed={elapsed}
          onSettings={() => {}}
          onMenu={() => {}}
        />
      </div>

      {/* Scrollable body — pt-24 clears the fixed header */}
      <div className="flex-1 flex flex-col px-5 gap-5 overflow-y-auto pb-32 pt-24" style={{ scrollbarWidth: "none" }}>

        {/* Orb */}
        <AIOrb status={orbStatus} onAction={() => {}} />

        {/* Transcript */}
        <LiveTranscript messages={messages} />

        {/* Alternatives — Priya's find_alternatives pick, when the deal stalls */}
        <AlternativesStrip products={alternatives} />

        {/* ── Deal pill — same segmented style as product cards ── */}
        <div
          className="flex gap-2 p-1.5"
          style={{
            background:   "#fff",
            borderRadius: 999,
            border:       "1.5px solid #e5e7eb",
            boxShadow:    "0 4px 20px rgba(100,70,180,0.10)",
          }}
        >
          {/* Cancel Deal */}
          <button
            onClick={handleEnd}
            className="flex-1 flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "#111", color: "#fff", fontWeight: 800, fontSize: 13, height: 44, borderRadius: 999, border: "none", cursor: "pointer" }}
          >
            Cancel Deal
          </button>

          {/* Done Deal */}
          <button
            onClick={() => wsRef.current?.send(JSON.stringify({ type: "text", text: "theek hai deal pakka" }))}
            className="flex-1 flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "#3F2A63", color: "#fff", fontWeight: 800, fontSize: 13, height: 44, borderRadius: 999, border: "none", cursor: "pointer" }}
          >
            Done Deal ✓
          </button>
        </div>

      </div>

      {/* Bottom bar — fixed */}
      <div className="rounded fixed bottom-0 left-1/2 -translate-x-1/2 w-[340px] max-w-[430px]">
        <NegotiateBottomBar
          isRecording={isRecording}
          disabled={status !== "negotiating" || orbStatus === "speaking"}
          onCounter={handleCounter}
          onClarify={handleClarify}
          onToggleMic={handleToggleMic}
          onEnd={handleEnd}
        />
      </div>
    </div>
  );
}
