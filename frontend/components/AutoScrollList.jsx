"use client";
import { motion } from "framer-motion";

/**
 * AutoScrollList
 * ───────────────
 * Vertical auto-scrolling ticker — shows `visibleCount` items at a time,
 * continuously loops through the full list. Generic: pass any renderItem.
 *
 * Props:
 *   items         – array of values to render
 *   renderItem    – (item, index) => ReactNode
 *   visibleCount  – how many rows show at once (default 3)
 *   rowHeight     – px height per row, including its gap (default 44)
 *   duration      – seconds for one full loop through the list (default 14)
 */
export default function AutoScrollList({
  items,
  renderItem,
  visibleCount = 3,
  rowHeight = 44,
  duration = 14,
}) {
  if (!items || items.length === 0) return null;

  // Duplicate the list so translating by exactly one full list-height loops seamlessly.
  const looped = [...items, ...items];
  const listHeight = items.length * rowHeight;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: visibleCount * rowHeight }}
    >
      <motion.div
        animate={{ y: [0, -listHeight] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {looped.map((item, i) => (
          <div key={i} style={{ height: rowHeight }} className="flex items-center justify-center">
            {renderItem(item, i)}
          </div>
        ))}
      </motion.div>

      {/* Fade edges so items don't hard-cut at the top/bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: rowHeight * 0.5, background: "linear-gradient(to bottom, var(--jugaad-purple), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: rowHeight * 0.5, background: "linear-gradient(to top, var(--jugaad-purple), transparent)" }}
      />
    </div>
  );
}
