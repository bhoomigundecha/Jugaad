"use client";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * TypewriterEffect — letter-by-letter reveal, triggers when scrolled into view.
 *
 * Props:
 *   words  [{ text: string, className?: string }]
 *   className      string  — wrapper div
 *   cursorClassName string — blinking cursor bar
 */
export function TypewriterEffect({ words, className, cursorClassName }) {
  const wordsArray = words.map((w) => ({ ...w, text: w.text.split("") }));

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        { display: "inline-block", opacity: 1, width: "fit-content" },
        { duration: 0.3, delay: stagger(0.1), ease: "easeInOut" }
      );
    }
  }, [isInView, animate]);

  return (
    <div className={cn("text-base font-bold text-center", className)}>
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, wi) => (
          <div key={wi} className="inline-block">
            {word.text.map((char, ci) => (
              <motion.span
                key={ci}
                initial={{ opacity: 0, display: "none" }}
                className={cn("text-gray-900 opacity-0 hidden", word.className)}
              >
                {char}
              </motion.span>
            ))}
            &nbsp;
          </div>
        ))}
      </motion.div>

      {/* Blinking cursor */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cn("inline-block rounded-sm w-[3px] h-5 bg-purple-600 align-middle ml-0.5", cursorClassName)}
      />
    </div>
  );
}

/**
 * TypewriterEffectSmooth — smooth sliding reveal (no per-letter stagger).
 * Used on the landing page bottom sheet.
 */
export function TypewriterEffectSmooth({ words, className, cursorClassName }) {
  const wordsArray = words.map((w) => ({ ...w, text: w.text.split("") }));

  return (
    <div className={cn("flex items-end gap-1", className)}>
      <motion.div
        className="overflow-hidden"
        initial={{ width: "0%" }}
        whileInView={{ width: "fit-content" }}
        transition={{ duration: 2, ease: "linear", delay: 0.3 }}
      >
        <div className="whitespace-nowrap font-black text-gray-900">
          {wordsArray.map((word, wi) => (
            <span key={wi} className="inline-block">
              {word.text.map((char, ci) => (
                <span key={ci} className={cn("text-gray-900", word.className)}>
                  {char}
                </span>
              ))}
              &nbsp;
            </span>
          ))}
        </div>
      </motion.div>

      {/* Blinking cursor */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cn("block rounded-sm w-[3px] h-6 bg-purple-600 mb-0.5 flex-shrink-0", cursorClassName)}
      />
    </div>
  );
}
