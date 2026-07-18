import { motion } from 'framer-motion';
import { Store } from 'lucide-react';

/**
 * AuthShell — shared header/frame for Login and Signup: a gradient
 * "wave" card (Jugaad purple, recolored from the blue sign-in inspo)
 * with soft decorative blobs, giving way to a white sheet below.
 */
export default function AuthShell({ isDark, eyebrow, children }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        width: '100%',
        maxWidth: '430px',
        height: '100dvh',
        maxHeight: '932px',
        background: isDark ? '#0f0a1a' : '#F3EEFA',
      }}
    >
      {/* Gradient header card */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: 240,
          background: 'linear-gradient(160deg, #9f67ff 0%, #7c3aed 45%, #2E1065 100%)',
          borderRadius: '0 0 44px 44px',
        }}
      >
        <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="absolute top-16 -left-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute bottom-0 right-10 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />

        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center shimmer"
            style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <Store size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1
              className="leading-none"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}
            >
              Jugaad
            </h1>
            <p
              className="uppercase mt-1.5"
              style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)' }}
            >
              {eyebrow}
            </p>
          </div>
        </div>
      </div>

      {/* White sheet */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-8 pb-8"
        style={{
          background: '#fff',
          borderRadius: '32px 32px 0 0',
          marginTop: -28,
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 -10px 30px rgba(46,16,101,0.08)',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
