/**
 * PageHeader — reusable back-button + title bar used by all sub-pages.
 * Matches the frosted-glass card look from the home page.
 */
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, onBack }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-5 pt-14 pb-4"
      style={{ borderBottom: '1px solid var(--card-border)' }}
    >
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onBack}
        aria-label="Go back"
        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
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
          style={{
            fontFamily: "'Playfair Display', serif",
            background:
              'linear-gradient(135deg, var(--wordmark-from) 0%, var(--wordmark-mid) 55%, var(--wordmark-to) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
