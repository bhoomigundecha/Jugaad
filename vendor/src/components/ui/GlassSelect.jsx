/**
 * GlassSelect — animated dropdown using the app's glassmorphism card tokens.
 * Controlled: pass value, onChange, options (string[]) and a placeholder string.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function GlassSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[14px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span>{value || placeholder}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute left-0 right-0 z-50 rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: 'var(--nav-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 16px 40px rgba(124,58,237,0.15)',
            }}
          >
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-3 text-[13px] font-medium flex items-center justify-between transition-colors duration-150"
                  style={{
                    color: 'var(--text-primary)',
                    background: value === opt ? 'var(--pill-bg)' : 'transparent',
                  }}
                >
                  {opt}
                  {value === opt && <Check size={13} style={{ color: 'var(--pill-text)' }} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
