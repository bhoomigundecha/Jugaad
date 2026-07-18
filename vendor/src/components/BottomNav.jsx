import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS } from '../data/constants';

/**
 * BottomNav — floating glassmorphism pill navigation bar.
 * Active tab shows a dark pill with a purple circle icon + label.
 * Inactive tabs show just the icon.
 */
export default function BottomNav({ activeTab, onTabChange, isDark }) {
  return (
    <div className="-mb-6 relative z-20 flex-shrink-0 px-5 pb-8 pt-3">
      <nav
        className="flex items-center justify-between gap-1 px-3 py-2.5 rounded-full transition-all duration-500"
        style={{
          background: isDark
            ? 'rgba(30, 18, 55, 0.6)'
            : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.75)',
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 8px 32px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.9 }}
              layout
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden"
              style={isActive ? { background: '#12082a' } : { background: 'transparent' }}
            >
              {/* Purple icon circle when active */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 30 : 24,
                  height: isActive ? 30 : 24,
                  background: isActive ? 'linear-gradient(135deg, #7c3aed, #9f67ff)' : 'transparent',
                  boxShadow: isActive ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                }}
              >
                <Icon
                  size={isActive ? 15 : 20}
                  style={{
                    color: isActive
                      ? '#ffffff'
                      : isDark
                        ? 'rgba(196,181,253,0.4)'
                        : 'rgba(100,80,140,0.5)',
                    strokeWidth: 2,
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Animated label — only shown for active tab */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-[13px] font-semibold text-white whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
