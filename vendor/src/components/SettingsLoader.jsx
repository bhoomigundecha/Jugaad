import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import AmbientOrbs from './AmbientOrbs';
import Skeleton from './ui/Skeleton';

/**
 * SettingsLoader — placeholder loading state for the Settings tab.
 * Shapes the skeleton after the page this will become (profile card,
 * grouped setting rows) rather than a generic spinner.
 */
export default function SettingsLoader({ onBack, isDark }) {
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
            Settings
          </h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Loading your shop preferences…
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-5 pb-10 space-y-6">
        {/* Profile card */}
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(18px)' }}
        >
          <Skeleton style={{ height: 56, width: 56, borderRadius: 18, flexShrink: 0 }} />
          <div className="flex-1 space-y-2">
            <Skeleton style={{ height: 13, width: '55%' }} />
            <Skeleton style={{ height: 10, width: '35%' }} />
          </div>
        </div>

        {/* Setting groups */}
        {['Shop', 'Notifications', 'Account'].map((group) => (
          <div key={group}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {group}
            </span>
            <div className="space-y-2.5 mt-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(18px)' }}
                >
                  <Skeleton style={{ height: 11, width: `${45 - i * 10}%` }} />
                  <Skeleton style={{ height: 22, width: 40, borderRadius: 999 }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center pt-2">
          <span
            className="inline-block text-[11px] font-semibold px-3.5 py-2 rounded-full"
            style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)', border: '1px solid var(--pill-border)' }}
          >
            🚧 Shop settings — coming soon
          </span>
        </div>
      </div>
    </motion.div>
  );
}
