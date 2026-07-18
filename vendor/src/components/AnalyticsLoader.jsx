import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp } from 'lucide-react';

import AmbientOrbs from './AmbientOrbs';
import Skeleton from './ui/Skeleton';

/**
 * AnalyticsLoader — placeholder loading state for the Analytics tab.
 * Shapes the skeleton after the dashboard this will become (stat cards,
 * a trend chart, recent negotiations) rather than a generic spinner.
 */
export default function AnalyticsLoader({ onBack, isDark }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(160deg,#0f0a1a 0%,#150d2b 50%,#0d0820 100%)'
          : 'linear-gradient(160deg,#cfc3e8 0%,#d8cdf0 50%,#c8bde4 100%)',
      }}
    >
      <AmbientOrbs />

      {/* Top bar */}
      <div className="relative z-10 flex-shrink-0 flex items-center gap-3 px-5 pt-14 pb-5">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--header-btn-bg)',
            border: '1px solid var(--header-btn-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </motion.button>
        <div>
          <h2
            className="text-[22px] font-bold leading-none"
            style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}
          >
            Analytics
          </h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Crunching your negotiation data…
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-5 pb-10 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <Skeleton style={{ height: 72 }} />
          <Skeleton style={{ height: 72 }} />
          <Skeleton style={{ height: 72 }} />
        </div>

        {/* Trend chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Deals over time
            </span>
          </div>
          <Skeleton style={{ height: 150 }} />
        </div>

        {/* Recent negotiations list */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Recent negotiations
          </span>
          <div className="space-y-3 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton style={{ height: 52, width: 52, borderRadius: 16, flexShrink: 0 }} />
                <div className="flex-1 space-y-2">
                  <Skeleton style={{ height: 12, width: `${65 - i * 5}%` }} />
                  <Skeleton style={{ height: 10, width: '35%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <span
            className="inline-block text-[11px] font-semibold px-3.5 py-2 rounded-full"
            style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)', border: '1px solid var(--pill-border)' }}
          >
            🚧 Full analytics dashboard — coming soon
          </span>
        </div>
      </div>
    </motion.div>
  );
}
