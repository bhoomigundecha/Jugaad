"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoodCarousel from "@/components/MoodCarousel";
import { ArrowUpRight } from "lucide-react";

// ── Cycling typewriter words ────────────────────────────────────────────────
const LOOKS = ["Smart", "Casual", "Street", "Party"];
const TYPE_SPEED   = 90;   // ms per character typed
const DELETE_SPEED = 55;   // ms per character deleted
const PAUSE_AFTER  = 1400; // ms pause when word fully typed

function useCyclingTypewriter(words) {
  const [display, setDisplay]     = useState("");
  const [wordIdx, setWordIdx]     = useState(0);
  const [deleting, setDeleting]   = useState(false);
  const [pausing, setPausing]     = useState(false);

  useEffect(() => {
    const word = words[wordIdx];

    if (pausing) {
      const t = setTimeout(() => { setPausing(false); setDeleting(true); }, PAUSE_AFTER);
      return () => clearTimeout(t);
    }

    if (!deleting) {
      // Typing forward
      if (display.length < word.length) {
        const t = setTimeout(
          () => setDisplay(word.slice(0, display.length + 1)),
          TYPE_SPEED
        );
        return () => clearTimeout(t);
      } else {
        setPausing(true);
      }
    } else {
      // Deleting backward
      if (display.length > 0) {
        const t = setTimeout(
          () => setDisplay(display.slice(0, -1)),
          DELETE_SPEED
        );
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }
  }, [display, deleting, pausing, wordIdx, words]);

  return display;
}

const N_MOODS = 5;

export default function LandingPage() {
  const router  = useRouter();
  const [current, setCurrent] = useState(0);
  const typedWord = useCyclingTypewriter(LOOKS);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--jugaad-purple)" }}>

      {/* ── Header ── */}
      <div className="-mt-3 pt-8 pb-1 px-6 text-center">
        <h1
          className="text-white tracking-tight leading-none"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Jugaad
        </h1>
        <p className="text-purple-200 text-xs mt-1 tracking-widest uppercase">
          Mol karo · Save karo
        </p>
      </div>

      {/* ── Mood carousel ── */}
      <div className="flex-1 flex items-center justify-center px-4" style={{ marginTop: -8 }}>
        <MoodCarousel onIndexChange={setCurrent} />
      </div>

      {/* ── Indicator dots ── */}
      <div className="flex justify-center gap-2 pb-3">
        {Array.from({ length: N_MOODS }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 6,
              background: i === current ? "white" : "rgba(255,255,255,0.32)",
            }}
          />
        ))}
      </div>

      {/* ── Bottom white sheet ── */}
      <div className="text-center bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">

        {/* Cycling typewriter headline — single line */}
        <p className=" font-black leading-none mb-1 whitespace-nowrap" style={{ fontSize: 19 }}>
          <span className="text-gray-900">Get your </span>
          <span style={{ color: "var(--jugaad-purple-light)" }}>
            {typedWord}
            <span
              className="inline-block w-[2px] h-[14px] align-middle ml-[1px] rounded-sm"
              style={{ background: "var(--jugaad-purple-light)", animation: "blink 0.9s step-end infinite" }}
            />
          </span>
          <span className="text-gray-900"> looks only on </span>
          <span style={{ color: "var(--jugaad-purple)" }}>Jugaad</span>
          <span className="text-gray-900">.</span>
        </p>

        {/* Subtitle */}
        <p className="text-gray-500 text-center text-md leading-snug mt-4 mb-4">
          Negotiate the prices in your own language.
          Why wait for sale, when you have{" "}
          <span className="font-semibold text-gray-600">Jugaad</span>?
        </p>

        {/* Sliding circle button */}
        <button
          onClick={() => router.push("/login")}
          className="group relative w-full overflow-hidden rounded-full p-1 pl-7 pr-14 h-14
                     transition-all duration-500 ease-in-out
                     hover:pl-14 hover:pr-7
                     active:scale-95 cursor-pointer"
          style={{ background: "#111" }}
        >
          {/* Text slides right as left-padding grows */}
          <span className="relative z-10 text-2xl text-white font-bold tracking-wide transition-all duration-500">
            Get Started
          </span>

          {/* Circle rolls from right → left on hover */}
          <div
            className="absolute top-1 right-1 w-11 h-11 bg-white rounded-full
                       flex items-center justify-center
                       transition-all duration-500 ease-in-out
                       group-hover:right-[calc(100%-48px)] group-hover:rotate-45"
          >
            <ArrowUpRight size={18} color="#111" strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  );
}
