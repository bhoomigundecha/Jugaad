/**
 * AddListing — multi-step wizard for listing a new product on Jugaad.
 * 5 steps: Identity → Photos → Pricing → Priya (AI) → Review & Launch
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ImagePlus, X, Check,
  Tag, Lock, Sparkles, Package, Truck,
  ArrowRight, Mic, Star, Zap, Smile, Target, Flame, Link2,
} from 'lucide-react';

import AmbientOrbs  from './AmbientOrbs';
import GlassInput   from './ui/GlassInput';
import GlassSelect  from './ui/GlassSelect';
import FormField    from './ui/FormField';
import { createProduct } from '../lib/api';

/* ─── Constants ──────────────────────────────────── */
const CATEGORIES = [
  'Sarees','Kurtis','Dupattas','Lehengas',
  'Bedsheets','Ethnic Wear','Accessories','Other',
];
const DELIVERY_OPTIONS = [
  { label: '3–5 days', value: '3-5' },
  { label: '5–7 days', value: '5-7' },
  { label: '7–10 days', value: '7-10' },
  { label: '10–14 days', value: '10-14' },
];

const STEPS = [
  { id: 1, label: 'Identity',  icon: Package  },
  { id: 2, label: 'Photo',     icon: ImagePlus },
  { id: 3, label: 'Pricing',   icon: Tag       },
  { id: 4, label: 'Priya AI',  icon: Mic       },
  { id: 5, label: 'Launch',    icon: Zap       },
];

const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';

const PRESET_IMAGES = [
  { label: 'Dupatta',  url: `${FRONTEND_BASE_URL}/product/bandhni_silk_dupatta.png` },
  { label: 'Kurti',    url: `${FRONTEND_BASE_URL}/product/lucknow_chikankari_kurti.png` },
  { label: 'Jewellery',url: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600' },
];

const PERSONAS = [
  {
    id: 'soft',
    label: 'Meethi Didi',
    subtitle: 'Sweet Sister',
    desc: 'Friendly, uses your name, concedes in small steps, closes fast.',
    icon: Smile,
  },
  {
    id: 'to_the_point',
    label: 'Vyapari',
    subtitle: 'The Trader',
    desc: 'Near-MRP open, 2–3 counters max, short and firm.',
    icon: Target,
  },
  {
    id: 'haggler',
    label: 'Mol-Bhav Queen',
    subtitle: 'Bargain Queen',
    desc: 'Theatrical flattery + scarcity, big dramatic concessions.',
    icon: Flame,
  },
];

/* ─── Step progress indicator ─────────────────────────
   Slim segmented progress bar — the "Step X of 5 — Label"
   text in the header already names the step, so this just
   needs to read as progress at a glance, not repeat it.
────────────────────────────────────────────────────── */
function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1.5 px-6 pb-4 flex-shrink-0">
      {STEPS.map((step) => {
        const reached = current >= step.id;
        return (
          <div
            key={step.id}
            className="h-[5px] flex-1 rounded-full overflow-hidden"
            style={{ background: 'var(--track-bg)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
              initial={false}
              animate={{ width: reached ? '100%' : '0%' }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Identity ──────────────────────────────
   Name, Category, Description, Tags
────────────────────────────────────────────────────── */
function Step1({ data, set }) {
  const [tagInput, setTagInput] = useState('');

  const commitTag = () => {
    const t = tagInput.trim();
    if (t && !data.tags.includes(t)) set('tags', [...data.tags, t]);
    setTagInput('');
  };

  return (
    <div className="space-y-5">
      <FormField label="Product Name" required>
        <GlassInput
          type="text"
          placeholder="e.g. Bandhani Silk Dupatta"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </FormField>

      <FormField label="Category" required>
        <GlassSelect
          options={CATEGORIES}
          value={data.category}
          onChange={(v) => set('category', v)}
          placeholder="Select a category"
        />
      </FormField>

      <FormField label="Description" hint="What makes it special?">
        <div
          className="rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#7c3aed]/30"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <textarea
            rows={3}
            placeholder="Material, occasion, size range, care instructions…"
            value={data.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full bg-transparent px-4 py-3.5 text-[14px] font-medium outline-none resize-none placeholder:opacity-40"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </FormField>

      {/* Tags */}
      <FormField label="Tags" hint="Press Enter to add">
        <div
          className="rounded-2xl p-3 flex flex-wrap gap-2 min-h-[52px] focus-within:ring-2 focus-within:ring-[#7c3aed]/30"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(18px)',
          }}
        >
          {data.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--pill-bg)', border: '1px solid var(--pill-border)', color: 'var(--pill-text)' }}
            >
              <Tag size={9} />{t}
              <button type="button" onClick={() => set('tags', data.tags.filter((x) => x !== t))}><X size={9} /></button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }}}
            onBlur={commitTag}
            placeholder={data.tags.length === 0 ? 'silk, festive, dupatta…' : ''}
            className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none placeholder:opacity-40"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </FormField>
    </div>
  );
}

/* ─── Step 2: Photo ─────────────────────────────────
   Image URL field + preset picker + live preview
────────────────────────────────────────────────────── */
function Step2({ data, set }) {
  return (
    <div className="space-y-5">
      <div className="text-center py-3">
        <p className="text-[22px] mb-1">📸</p>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Paste an image URL, or pick a preset.
        </p>
      </div>

      <FormField label="Image URL">
        <GlassInput
          type="url"
          prefix={<Link2 size={14} />}
          placeholder="https://…"
          value={data.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
        />
      </FormField>

      {/* Preview */}
      {data.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-28 h-28 mx-auto rounded-2xl overflow-hidden"
          style={{ border: '2px solid #7c3aed', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}
        >
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = 0.15; }} />
        </motion.div>
      )}

      {/* Presets */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
          Or pick a preset
        </p>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_IMAGES.map((preset) => (
            <motion.button
              key={preset.url}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => set('imageUrl', preset.url)}
              className="aspect-square rounded-2xl overflow-hidden relative"
              style={{
                border: data.imageUrl === preset.url ? '2px solid #7c3aed' : '1px solid var(--card-border)',
              }}
            >
              <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 py-1 text-center text-[9px] font-semibold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
                {preset.label}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {!data.imageUrl && (
        <div
          className="text-center text-[12px] py-2 rounded-2xl"
          style={{
            background: 'var(--stats-bg)',
            border: '1px solid var(--stats-border)',
            color: 'var(--text-secondary)',
          }}
        >
          💡 Optional — listings still launch without a photo
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Pricing & Stock ───────────────────────
   Large MRP input + stock + delivery
────────────────────────────────────────────────────── */
function Step3({ data, set }) {
  return (
    <div className="space-y-5">
      {/* Hero price display */}
      <div
        className="rounded-3xl p-6 text-center shimmer"
        style={{ background: 'var(--stats-bg)', border: '1px solid var(--stats-border)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
          Listed Price (MRP)
        </p>
        <div className="flex items-start justify-center gap-1">
          <span className="text-2xl font-bold mt-2" style={{ color: 'var(--text-secondary)' }}>₹</span>
          <span
            className="text-6xl font-bold tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--wordmark-from), var(--wordmark-to))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              minWidth: 80,
            }}
          >
            {data.mrp || '0'}
          </span>
        </div>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Buyers will see this price
        </p>
      </div>

      <FormField label="MRP (₹)" required hint="What buyers see">
        <GlassInput
          type="number"
          prefix="₹"
          placeholder="0"
          value={data.mrp}
          onChange={(e) => set('mrp', e.target.value)}
          min={0}
        />
      </FormField>

      <FormField label="Stock Quantity" required>
        <GlassInput
          type="number"
          suffix="units"
          placeholder="0"
          value={data.stock}
          onChange={(e) => set('stock', e.target.value)}
          min={0}
        />
      </FormField>

      <FormField label="Estimated Delivery" required>
        <GlassSelect
          options={DELIVERY_OPTIONS.map((d) => d.label)}
          value={DELIVERY_OPTIONS.find((d) => d.value === data.delivery)?.label || ''}
          onChange={(v) => {
            const opt = DELIVERY_OPTIONS.find((d) => d.label === v);
            set('delivery', opt?.value || '');
          }}
          placeholder="Select delivery window"
        />
      </FormField>

      {/* Stock urgency hint */}
      {data.stock && Number(data.stock) < 10 && Number(data.stock) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}
        >
          <Star size={13} className="text-yellow-500 flex-shrink-0" />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Low stock (&lt;10) — Priya will use <strong style={{ color: 'var(--text-primary)' }}>scarcity</strong> as a negotiation tactic
          </span>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Step 4: Priya AI Negotiation ──────────────────
   Toggle + floor price + live AI preview chat bubble
────────────────────────────────────────────────────── */
function Step4({ data, set }) {
  const price  = Number(data.floorPrice);
  const mrpNum = Number(data.mrp);
  const pct    = mrpNum > 0 && price > 0 ? Math.round((price / mrpNum) * 100) : 0;
  const safe   = price > 0 && mrpNum > 0 && price < mrpNum;

  // Priya's preview intro based on product info
  const priyaLine = data.name
    ? `Namaste! "${data.name}" ₹${data.mrp} mein milega — bilkul fresh stock hai. Kya aap interested hain?`
    : 'Namaste! Aaj kuch khaas dekhna chahenge aap?';

  return (
    <div className="space-y-5">
      {/* Priya avatar + intro */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'var(--floor-bg)', border: '1px solid var(--floor-border)' }}
      >
        {/* Orb behind avatar */}
        <div
          className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-full opacity-30"
          style={{ background: '#7c3aed', filter: 'blur(40px)' }}
        />

        <div className="flex items-center gap-3 mb-4">
          {/* Priya orb */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shimmer"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#9f67ff)',
              boxShadow: '0 0 20px rgba(124,58,237,0.5)',
            }}
          >
            <Mic size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
              Priya
            </p>
            <p className="text-[11px]" style={{ color: 'var(--pill-text)' }}>
              Your AI Sales Agent
            </p>
          </div>
          <div
            className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
            <span className="text-[10px] font-semibold text-green-600">Ready</span>
          </div>
        </div>

        {/* Preview chat bubble */}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <p className="text-[13px] leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
            "{priyaLine}"
          </p>
        </div>

        <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Preview of how Priya opens a negotiation
        </p>
      </div>

      {/* Toggle row */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: data.negotiable ? 'var(--floor-bg)' : 'var(--card-bg)',
          border: data.negotiable ? '1px solid var(--floor-border)' : '1px solid var(--card-border)',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-4 cursor-pointer select-none"
          onClick={() => set('negotiable', !data.negotiable)}
        >
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
              Enable Negotiation
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Let Priya bargain — you set the limits
            </p>
          </div>
          <div
            className="relative w-[46px] h-[26px] rounded-full flex-shrink-0"
            style={{
              background: data.negotiable ? 'linear-gradient(90deg,#7c3aed,#9f67ff)' : 'var(--toggle-off)',
              boxShadow: data.negotiable ? '0 0 14px rgba(124,58,237,0.45)' : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          >
            <motion.div
              layout initial={false}
              animate={{ x: data.negotiable ? 22 : 2, y: 2 }}
              transition={{ type: 'spring', stiffness: 600, damping: 32 }}
              className="absolute w-[22px] h-[22px] rounded-full bg-white shadow-md"
            />
          </div>
        </div>

        {/* Floor price section */}
        <AnimatePresence initial={false}>
          {data.negotiable && (
            <motion.div
              key="floor"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div className="h-px" style={{ background: 'var(--floor-border)' }} />

                {/* Persona picker */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--pill-text)' }}>
                    Choose Priya's Persona
                  </span>
                  <div className="space-y-2">
                    {PERSONAS.map((persona) => {
                      const Icon = persona.icon;
                      const selected = data.persona === persona.id;
                      return (
                        <motion.button
                          key={persona.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => set('persona', persona.id)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left"
                          style={{
                            background: selected ? 'var(--pill-bg)' : 'var(--card-bg)',
                            border: selected ? '1.5px solid #7c3aed' : '1px solid var(--card-border)',
                            boxShadow: selected ? '0 0 14px rgba(124,58,237,0.25)' : 'none',
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: selected ? 'linear-gradient(135deg,#7c3aed,#9f67ff)' : 'var(--toggle-off)',
                            }}
                          >
                            <Icon size={16} style={{ color: selected ? '#fff' : 'var(--text-muted)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{persona.label}</p>
                              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>· {persona.subtitle}</span>
                            </div>
                            <p className="text-[10.5px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{persona.desc}</p>
                          </div>
                          {selected && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#7c3aed' }}>
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px" style={{ background: 'var(--floor-border)' }} />

                <div className="flex items-center gap-1.5">
                  <Lock size={11} style={{ color: 'var(--pill-text)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--pill-text)' }}>
                    Jugaad MVP — Minimum Floor Price
                  </span>
                </div>

                <GlassInput
                  type="number"
                  prefix="₹"
                  placeholder="e.g. 680"
                  value={data.floorPrice}
                  onChange={(e) => set('floorPrice', e.target.value)}
                  min={0}
                />

                {price > 0 && mrpNum > 0 && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--track-bg)' }}>
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Floor ₹{price}</span>
                      <span className="text-[10px] font-bold" style={{ color: safe ? '#22c55e' : '#ef4444' }}>
                        {pct}% of MRP
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>MRP ₹{mrpNum}</span>
                    </div>
                  </div>
                )}

                {/* Max discount Priya can give */}
                {safe && (
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--stats-bg)', border: '1px solid var(--stats-border)' }}
                  >
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Max discount Priya can offer</span>
                    <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      ₹{mrpNum - price} ({100 - pct}% off)
                    </span>
                  </div>
                )}

                <div
                  className="text-[11px] px-3 py-2.5 rounded-xl leading-relaxed"
                  style={{ background: 'var(--pill-bg)', border: '1px solid var(--pill-border)', color: 'var(--text-secondary)' }}
                >
                  💡 Priya will <strong style={{ color: 'var(--text-primary)' }}>never</strong> go below this. Buyers only see MRP.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Step 5: Review & Launch ───────────────────────
   Preview card + final CTA
────────────────────────────────────────────────────── */
function Step5({ data, onSubmit, submitted, submitError }) {
  const coverImg = data.imageUrl;

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl mb-2"
        >
          🚀
        </motion.div>
        <p className="font-bold text-[16px]" style={{ color: 'var(--text-primary)' }}>
          Ready to launch?
        </p>
        <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          Here's your listing preview
        </p>
      </div>

      {/* Product preview card — exactly like home page */}
      <div
        className="rounded-[22px] overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(24px)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex gap-4 items-start p-4">
          {/* Thumbnail */}
          <div
            className="w-[80px] h-[80px] rounded-[18px] overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: 'var(--pill-bg)', border: '1px solid var(--card-border)' }}
          >
            {coverImg
              ? <img src={coverImg} alt="" className="w-full h-full object-cover" />
              : <Package size={28} style={{ color: 'var(--pill-text)' }} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-1.5">
              <h3 className="font-bold text-[14px] leading-tight flex-1" style={{ color: 'var(--text-primary)' }}>
                {data.name || 'Your Product Name'}
              </h3>
              {data.negotiable && (
                <div
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--pill-bg)', border: '1px solid var(--pill-border)' }}
                >
                  <Sparkles size={9} style={{ color: 'var(--pill-text)' }} />
                  <span className="text-[9px] font-bold" style={{ color: 'var(--pill-text)' }}>AI</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.category && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                  style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)' }}
                >
                  {data.category}
                </span>
              )}
              {data.delivery && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1"
                  style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)' }}
                >
                  <Truck size={9} /> {DELIVERY_OPTIONS.find(d => d.value === data.delivery)?.label}
                </span>
              )}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  MRP <span className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>₹{data.mrp || '—'}</span>
                </p>
                {data.negotiable && data.floorPrice && (
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Floor ₹{data.floorPrice} · {Math.round((data.floorPrice / data.mrp) * 100)}% of MRP
                  </p>
                )}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {data.stock ? `${data.stock} units` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Tags row */}
        {data.tags.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {data.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'var(--pill-bg)', color: 'var(--text-muted)' }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary checklist */}
      {[
        { label: 'Product name', ok: !!data.name },
        { label: 'Category set', ok: !!data.category },
        { label: 'MRP entered', ok: !!data.mrp },
        { label: 'Stock added', ok: !!data.stock },
        { label: 'Image added', ok: !!data.imageUrl },
        { label: 'Delivery selected', ok: !!data.delivery },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: item.ok ? 'rgba(34,197,94,0.15)' : 'var(--pill-bg)',
              border: item.ok ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--pill-border)',
            }}
          >
            {item.ok
              ? <Check size={10} className="text-green-500" />
              : <X size={10} style={{ color: 'var(--text-muted)' }} />
            }
          </div>
          <span className="text-[12px]" style={{ color: item.ok ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {item.label}
          </span>
        </div>
      ))}

      {/* Error */}
      {submitError && (
        <p className="text-[12px] font-medium text-center" style={{ color: '#ef4444' }}>
          {submitError}
        </p>
      )}

      {/* Launch button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={submitted}
        className="w-full py-4 rounded-2xl font-bold text-[16px] text-white relative overflow-hidden mt-2"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          boxShadow: '0 8px 28px rgba(124,58,237,0.45)',
          opacity: submitted ? 0.85 : 1,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Check size={18} /> Listed on Jugaad!
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Zap size={16} /> Launch Listing
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="h-4" />
    </div>
  );
}

/* ─── Slide variants ─────────────────────────────── */
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center:        { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

/* ─── Main AddListing orchestrator ──────────────────
────────────────────────────────────────────────────── */
export default function AddListing({ onBack, onCreated, vendorId, isDark }) {
  const [step, setStep]         = useState(1);
  const [direction, setDir]     = useState(1);  // 1 = forward, -1 = back
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    name: '', category: '', description: '', tags: [],
    imageUrl: '', mrp: '', stock: '', delivery: '',
    negotiable: false, floorPrice: '', persona: 'soft',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const goTo = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const canProceed = () => {
    if (step === 1) return !!form.name && !!form.category;
    if (step === 3) return !!form.mrp && !!form.stock && !!form.delivery;
    if (step === 4) return !form.negotiable || (!!form.floorPrice && Number(form.floorPrice) < Number(form.mrp));
    return true;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const mrp = Number(form.mrp);
    const floorPrice = form.negotiable && form.floorPrice
      ? Number(form.floorPrice)
      : Math.round(mrp * 0.8);

    try {
      await createProduct(vendorId, {
        name: form.name,
        description: form.description || null,
        category: form.category,
        image_url: form.imageUrl || null,
        mrp,
        floor_price: floorPrice,
        stock: Number(form.stock) || 0,
        age_days: 0,
        is_negotiable: form.negotiable,
        persona: form.negotiable ? form.persona : 'soft',
      });
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); onCreated ? onCreated() : onBack(); }, 1800);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create listing');
    }
  };

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

      {/* ── Top bar ── */}
      <div
        className="-mt-10 relative z-10 flex-shrink-0 flex items-center gap-3 px-5 pt-14 pb-2"
        
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={step === 1 ? onBack : () => goTo(step - 1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--header-btn-bg)',
            border: '1px solid var(--header-btn-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <ChevronLeft size={20} style={{ color: 'var(--text-primary)' }} />
        </motion.button>

        <div className="flex-1">
          <h2
            className="text-[25px] font-bold leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg,var(--wordmark-from),var(--wordmark-mid),var(--wordmark-to))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            New Listing
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="relative z-10 flex-shrink-0">
        <StepIndicator current={step} />
      </div>

      {/* ── Step content (animated slide) ── */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 overflow-y-auto hide-scrollbar px-5 py-4"
          >
            {step === 1 && <Step1 data={form} set={set} />}
            {step === 2 && <Step2 data={form} set={set} />}
            {step === 3 && <Step3 data={form} set={set} />}
            {step === 4 && <Step4 data={form} set={set} />}
            {step === 5 && <Step5 data={form} onSubmit={handleSubmit} submitted={submitted} submitError={submitError} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom nav bar (Next / Skip) ── */}
      {step < 5 && (
        <div
          className="relative z-10 flex-shrink-0 px-5 pb-8 pt-3 flex gap-3"
          style={{ borderTop: '1px solid var(--card-border)' }}
        >
          {/* Skip (only on optional steps 2 & 4) */}
          {(step === 2 || step === 4) && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => goTo(step + 1)}
              className="flex-shrink-0 px-5 py-3.5 rounded-2xl font-semibold text-[13px]"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-secondary)',
                backdropFilter: 'blur(18px)',
              }}
            >
              Skip
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => canProceed() && goTo(step + 1)}
            className="flex-1 py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2"
            style={{
              background: canProceed()
                ? 'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)'
                : 'var(--toggle-off)',
              boxShadow: canProceed() ? '0 6px 20px rgba(124,58,237,0.4)' : 'none',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          >
            <span style={{ color: canProceed() ? '#fff' : 'var(--text-muted)' }}>
              {step === 4 ? 'Review Listing' : 'Continue'}
            </span>
            <ArrowRight size={16} style={{ color: canProceed() ? '#fff' : 'var(--text-muted)' }} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
