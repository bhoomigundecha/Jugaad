import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

import AuthShell from './AuthShell';
import GlassInput from './ui/GlassInput';
import { vendorSignup } from '../lib/api';

/**
 * Signup — creates a real Vendor row via POST /auth/vendor/signup (no
 * mocked/fake flow — a new account genuinely lands in the DB and can list
 * real products afterward). No email verification or password hashing,
 * consistent with the rest of this app's demo-auth approach.
 */
export default function Signup({ onSignedUp, isDark, onSwitchToLogin }) {
  const [name, setName]         = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const vendor = await vendorSignup({ name, email, shop_name: shopName, password });
      onSignedUp(vendor, true);
    } catch (err) {
      setError(err.message || 'Signup failed');
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
        Create your shop
      </h2>
      <p className="text-[13px] mt-1 mb-6" style={{ color: '#8a7aa3' }}>
        Start selling with Priya's AI negotiation
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5b4b6f' }}>
            Your Name
          </label>
          <GlassInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rajesh Kumar"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#5b4b6f' }}>
            Shop Name
          </label>
          <GlassInput
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Rajesh Fashion House"
            autoComplete="organization"
          />
        </div>

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
            autoComplete="new-password"
          />
        </div>

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
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
        </motion.button>
      </form>

      <p className="text-center text-[13px] mt-5" style={{ color: '#5b4b6f' }}>
        Already have a shop?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold"
          style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Log in
        </button>
      </p>
    </AuthShell>
  );
}
