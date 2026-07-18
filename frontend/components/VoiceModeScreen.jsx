"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import JugaadWordmark from "@/components/JugaadWordmark";
import VoiceGlowOrb from "@/components/VoiceGlowOrb";
import SuggestedCommandChip from "@/components/SuggestedCommandChip";
import AutoScrollList from "@/components/AutoScrollList";
import VoiceTranscript from "@/components/VoiceTranscript";
import BottomNav from "@/components/BottomNav";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductRevealCard } from "@/components/ui/product-reveal-card";
import { getProducts, discoverTurn, extractProductsFromToolResults } from "@/lib/api";
import { getSession } from "@/lib/auth";

const SUGGESTED_COMMANDS = [
  "Add Polo T-Shirts for women in my Shopping list",
  "Suggest me a party-outfit, make it bling!",
  "Outfits for my trip to Switzerland",
  "Find me sneakers under ₹2000",
  "What goes well with this kurti?",
  "Show me today's best discounts",
  "Negotiate this dupatta for me",
  "Add a birthday gift to my list",
];

/**
 * VoiceModeScreen
 * ────────────────
 * Full-screen voice-first landing, sized to fit in one viewport (no scroll):
 * orb (tap to speak), a live transcript once the conversation starts, a
 * "Recommended Products" rail driven by the Discovery Agent's latest tool
 * results, and the same fixed BottomNav used across the app.
 *
 * Props:
 *   onClose – () => void   (optional — falls back to router.back())
 */
export default function VoiceModeScreen({ onClose }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);       // Discovery Agent history (role/content)
  const [transcript, setTranscript] = useState([]);    // display bubbles {id, speaker, text, time}
  const buyerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const msgIdRef = useRef(0);

  useEffect(() => {
    buyerRef.current = getSession();
    getProducts()
      .then((p) => setProducts(p.slice(0, 10)))
      .catch(() => setProducts([]));
  }, []);

  const handleClose = () => (onClose ? onClose() : router.back());

  const addBubble = (speaker, text) => {
    const id = ++msgIdRef.current;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    setTranscript((prev) => [...prev, { id, speaker, text, time }]);
  };

  const playAudio = (base64) => {
    if (!base64) return;
    try {
      const bytes = new Uint8Array(atob(base64).split("").map((c) => c.charCodeAt(0)));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    } catch {
      // ignore playback failure — text/transcript still shown
    }
  };

  const sendTurn = async ({ audioBase64, text }) => {
    const buyer = buyerRef.current;
    if (!buyer) return;
    setThinking(true);
    try {
      const result = await discoverTurn(buyer.id, messages, { audioBase64, text });
      if (result.transcript) addBubble("you", result.transcript);
      if (result.reply) addBubble("ai", result.reply);
      setMessages(result.messages || messages);
      playAudio(result.reply_audio);

      const newProducts = extractProductsFromToolResults(result.tool_results);
      if (newProducts && newProducts.length > 0) setProducts(newProducts);
    } catch (e) {
      addBubble("ai", "Sorry, something went wrong. Please try again.");
    } finally {
      setThinking(false);
    }
  };

  const handleCommandTap = (label) => sendTurn({ text: label });

  const handleOrbTap = async () => {
    if (thinking) return;
    if (listening) {
      mediaRecorderRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          sendTurn({ audioBase64: base64 });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setListening(true);
    } catch {
      alert("Microphone access is needed for voice mode.");
    }
  };

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ background: "var(--jugaad-purple)" }}
    >
      {/* Close button */}
      <div className="flex justify-end px-5 pt-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <X size={15} color="#fff" />
        </button>
      </div>

      {/* Wordmark */}
      <div className="mb-3 pt-1 pb-0 flex-shrink-0">
        <JugaadWordmark
          titleSize={40}
          titleColor="#fff"
          taglineColor="rgba(255,255,255,0.55)"
          align="center"
        />
      </div>

      {/* Orb */}
      <div className="flex justify-center items-center flex-shrink-0" style={{ height: 175 }}>
        <VoiceGlowOrb active={listening} thinking={thinking} size={118} onTap={handleOrbTap} />
      </div>

      {/* Transcript once conversation has started, else suggested commands */}
      <div className="px-5 mb-5 flex-shrink-0">
        {transcript.length > 0 ? (
          <VoiceTranscript messages={transcript} />
        ) : (
          <>
            <p
              className="text-center mb-3"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 16, color: "#fff" }}
            >
              Try these commands
            </p>
            <AutoScrollList
              items={SUGGESTED_COMMANDS}
              visibleCount={3}
              rowHeight={40}
              duration={18}
              renderItem={(label) => (
                <SuggestedCommandChip label={label} onClick={handleCommandTap} />
              )}
            />
          </>
        )}
      </div>

      {/* Recommended products — centered within remaining space */}
      <div className="px-5 flex-1 min-h-0 flex flex-col justify-center">
        {products.length > 0 ? (
          <ProductCarousel
            title="Recommended Products"
            products={products}
            layout="scroll"
            CardComponent={ProductRevealCard}
            titleColor="#fff"
          />
        ) : (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading products…</p>
        )}
      </div>

      {/* Space reserved for the fixed BottomNav */}
      <div className="flex-shrink-0" style={{ height: 92 }} />
      <BottomNav />
    </div>
  );
}
