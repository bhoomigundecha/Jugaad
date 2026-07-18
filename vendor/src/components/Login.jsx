import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

import AuthShell from './AuthShell';
import GlassInput from './ui/GlassInput';
import { vendorLogin } from '../lib/api';

/**
 * Login — vendor sign-in. Hardcoded demo credentials AND real signed-up
 * vendors both work (backend/routers/auth.py checks both); this just posts
 * to /auth/vendor/login and hands the resulting vendor session up to App.
 */
export default function Login({ onLogin, isDark, onSwitchToSignup }) {
  const [email, setEmail] = useState('rajesh@jugaad.com');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const vendor = await vendorLogin(email, password);
      onLogin(vendor, remember);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell isDark={isDark} eyebrow="Vendor Portal">
      <h2
        className="leading-tight"
        style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: '#2E1065' }}
      >
        Welcome back
      </h2>
      <p className="text-[13px] mt-1 mb-6" style={{ color: '#8a7aa3' }}>
        Log in to manage your shop
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5b4b6f' }}>
            Email
          </label>
          <GlassInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shop.com"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5b4b6f' }}>
            Password
          </label>
          <GlassInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: '#7c3aed', width: 15, height: 15 }}
          />
          <span className="text-[12.5px] font-medium" style={{ color: '#5b4b6f' }}>
            Remember me on this device
          </span>
        </label>

        {error && (
          <p className="text-[12px] font-medium text-center" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 mt-2"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            boxShadow: '0 8px 28px rgba(124,58,237,0.4)',
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
        </motion.button>
      </form>

      <div className="h-px my-5" style={{ background: '#ECE4F5' }} />

      <p className="text-center text-[11px]" style={{ color: '#b0a3c4' }}>
        Demo: rajesh@jugaad.com / jugaad123
      </p>

      <p className="text-center text-[13px] mt-4" style={{ color: '#5b4b6f' }}>
        Don't have a shop yet?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-bold"
          style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign up
        </button>
      </p>
    </AuthShell>
  );
}
