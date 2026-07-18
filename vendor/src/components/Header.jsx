import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut } from 'lucide-react';

export default function Header({ isDark, onToggleTheme, onLogout, shopName }) {
  return (
    <header className="-mt-12 relative z-10 px-5 pt-14 pb-4 flex justify-between items-start flex-shrink-0">
      {/* Wordmark + mode badge */}
      <div>
        <h1
          className="text-[38px] font-bold leading-none tracking-tight mb-2 transition-all duration-500"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#3F2A63",
          }}
        >
          Jugaad
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="pulse-dot w-1.5 h-1.5 rounded-full block transition-colors duration-500"
            style={{ background: 'var(--vendor-dot)' }}
          />
          <span
            className="text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors duration-500"
            style={{ color: 'var(--vendor-text)' }}
          >
            {shopName || 'Vendor Mode'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300"
          style={{
            background: 'var(--header-btn-bg)',
            border: '1px solid var(--header-btn-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'sun' : 'moon'}
              initial={{ rotate: -30, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 30, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
            >
              {isDark
                ? <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
                : <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
              }
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onLogout}
          aria-label="Log out"
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300"
          style={{
            background: 'var(--header-btn-bg)',
            border: '1px solid var(--header-btn-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <LogOut size={18} style={{ color: 'var(--text-secondary)' }} />
        </motion.button>
      </div>
    </header>
  );
}
