/**
 * AddProduct — full-screen slide-in page for listing a new product.
 * Uses only CSS design-system tokens so it is visually seamless with the home page.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImagePlus, X, Tag, Check,
  Lock, Sparkles, Package, Truck,
} from 'lucide-react';

import AmbientOrbs from './AmbientOrbs';
import PageHeader   from './ui/PageHeader';
import FormField    from './ui/FormField';
import GlassInput   from './ui/GlassInput';
import GlassSelect  from './ui/GlassSelect';
import SectionLabel from './ui/SectionLabel';

/* ─── Data ──────────────────────────────────────── */
const CATEGORIES = [
  'Sarees', 'Kurtis', 'Dupattas', 'Lehengas',
  'Bedsheets', 'Ethnic Wear', 'Accessories', 'Other',
];

const DELIVERY_OPTIONS = [
  { label: '3–5 days',   value: '3-5'   },
  { label: '5–7 days',   value: '5-7'   },
  { label: '7–10 days',  value: '7-10'  },
  { label: '10–14 days', value: '10-14' },
];

/* ─── Image upload grid ──────────────────────────── */
function ImageUploader({ images, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    Array.from(e.target.files).forEach((file) => {
      onAdd({ url: URL.createObjectURL(file), name: file.name });
    });
    e.target.value = '';
  };

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {images.map((img, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <X size={10} className="text-white" />
          </button>
          {/* Cover badge on first image */}
          {i === 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] font-bold text-white tracking-widest uppercase"
              style={{ background: 'rgba(124,58,237,0.85)' }}
            >
              Cover
            </div>
          )}
        </div>
      ))}

      {images.length < 6 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-transform duration-150 active:scale-95"
          style={{
            background: 'var(--pill-bg)',
            border: '2px dashed var(--pill-border)',
          }}
        >
          <ImagePlus size={22} style={{ color: 'var(--pill-text)' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'var(--pill-text)' }}>
            {images.length === 0 ? 'Add Photos' : 'Add More'}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}

/* ─── Tag chip input ─────────────────────────────── */
function TagInput({ tags, onAdd, onRemove }) {
  const [val, setVal] = useState('');

  const commit = () => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) onAdd(trimmed);
    setVal('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
  };

  return (
    <div
      className="rounded-2xl p-3 flex flex-wrap gap-2 min-h-[52px] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#7c3aed]/30"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        backdropFilter: 'blur(18px)',
      }}
    >
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: 'var(--pill-bg)',
            border: '1px solid var(--pill-border)',
            color: 'var(--pill-text)',
          }}
        >
          <Tag size={9} />
          {t}
          <button type="button" onClick={() => onRemove(t)} className="ml-0.5">
            <X size={9} />
          </button>
        </span>
      ))}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={tags.length === 0 ? 'Type a tag, press Enter…' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none placeholder:opacity-40"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}

/* ─── Negotiation toggle + floor price section ────── */
function NegotiationSection({ enabled, onToggle, floorPrice, onFloorChange, mrp }) {
  const price = Number(floorPrice);
  const mrpNum = Number(mrp);
  const pct   = mrpNum > 0 && price > 0 ? Math.round((price / mrpNum) * 100) : 0;
  const safe  = price > 0 && mrpNum > 0 && price < mrpNum;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: enabled ? 'var(--floor-bg)' : 'var(--card-bg)',
        border: enabled ? '1px solid var(--floor-border)' : '1px solid var(--card-border)',
        backdropFilter: 'blur(18px)',
      }}
    >
      {/* Toggle header row */}
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: enabled ? 'rgba(124,58,237,0.2)' : 'var(--pill-bg)',
              border: '1px solid var(--floor-border)',
            }}
          >
            <Sparkles size={16} style={{ color: enabled ? 'var(--pill-text)' : 'var(--text-secondary)' }} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>
              Enable Negotiation
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Priya (AI) will bargain on your behalf
            </p>
          </div>
        </div>

        {/* Reusing same toggle style as ProductCard */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-[46px] h-[26px] rounded-full flex-shrink-0"
          style={{
            background: enabled ? 'linear-gradient(90deg, #7c3aed, #9f67ff)' : 'var(--toggle-off)',
            boxShadow: enabled ? '0 0 14px rgba(124,58,237,0.45)' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          <motion.div
            layout
            initial={false}
            animate={{ x: enabled ? 22 : 2, y: 2 }}
            transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            className="absolute w-[22px] h-[22px] rounded-full bg-white shadow-md"
          />
        </div>
      </div>

      {/* Expandable floor price */}
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="floor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Divider */}
              <div className="h-px" style={{ background: 'var(--floor-border)' }} />

              <div className="flex items-center gap-1.5">
                <Lock size={11} style={{ color: 'var(--pill-text)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--pill-text)' }}
                >
                  Jugaad MVP — Minimum Floor Price
                </span>
              </div>

              <GlassInput
                type="number"
                prefix="₹"
                placeholder="e.g. 680"
                value={floorPrice}
                onChange={(e) => onFloorChange(e.target.value)}
                min={0}
              />

              {/* Live progress bar */}
              {price > 0 && mrpNum > 0 && (
                <div className="space-y-1.5">
                  <div
                    className="h-1.5 rounded-full w-full"
                    style={{ background: 'var(--track-bg)' }}
                  >
                    <motion.div
                      className="h-1.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Floor ₹{price}
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: safe ? '#22c55e' : '#ef4444' }}
                    >
                      {pct}% of MRP
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      MRP ₹{mrpNum}
                    </span>
                  </div>
                </div>
              )}

              {/* Tip box — uses stats-bg for the familiar card tint */}
              <div
                className="text-[11px] px-3 py-2.5 rounded-xl leading-relaxed"
                style={{
                  background: 'var(--stats-bg)',
                  border: '1px solid var(--stats-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                💡 Priya will <strong style={{ color: 'var(--text-primary)' }}>never</strong> go
                below this price. Buyers only ever see the MRP.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────── */
export default function AddProduct({ onBack, isDark }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    mrp: '',
    stock: '',
    delivery: '',
    negotiable: false,
    floorPrice: '',
    tags: [],
    images: [],
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /vendor/products
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onBack(); }, 1800);
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
          ? 'linear-gradient(160deg, #0f0a1a 0%, #150d2b 50%, #0d0820 100%)'
          : 'linear-gradient(160deg, #e4d9f5 0%, #ede6fa 50%, #d8cdf0 100%)',
      }}
    >
      {/* Same ambient orbs as home page */}
      <AmbientOrbs />

      {/* Back button + gradient title */}
      <PageHeader
        title="New Listing"
        subtitle="Fill in the details to list your product"
        onBack={onBack}
      />

      {/* Scrollable form body */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-5 py-5 space-y-5"
      >
        {/* ── Product Info ── */}
        <SectionLabel icon={Package} text="Product Info" />

        <FormField label="Product Name" required>
          <GlassInput
            type="text"
            placeholder="e.g. Bandhani Silk Dupatta"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </FormField>

        <FormField label="Category" required>
          <GlassSelect
            options={CATEGORIES}
            value={form.category}
            onChange={(v) => set('category', v)}
            placeholder="Select a category"
          />
        </FormField>

        <FormField label="Description" hint="Shown to buyers">
          <div
            className="rounded-2xl overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-[#7c3aed]/30"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <textarea
              rows={3}
              placeholder="Material, occasion, size range…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full bg-transparent px-4 py-3.5 text-[14px] font-medium outline-none resize-none placeholder:opacity-40"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </FormField>

        <FormField label="Product Tags" hint="Press Enter to add">
          <TagInput
            tags={form.tags}
            onAdd={(t) => set('tags', [...form.tags, t])}
            onRemove={(t) => set('tags', form.tags.filter((x) => x !== t))}
          />
        </FormField>

        {/* ── Photos ── */}
        <SectionLabel icon={ImagePlus} text="Photos" />

        <FormField label="Product Images" hint="Up to 6 · First is cover">
          <ImageUploader
            images={form.images}
            onAdd={(img) => set('images', [...form.images, img])}
            onRemove={(i) => set('images', form.images.filter((_, idx) => idx !== i))}
          />
        </FormField>

        {/* ── Pricing & Stock ── */}
        <SectionLabel icon={Tag} text="Pricing & Stock" />

        <FormField label="MRP (₹)" required hint="Displayed to buyers">
          <GlassInput
            type="number"
            prefix="₹"
            placeholder="0"
            value={form.mrp}
            onChange={(e) => set('mrp', e.target.value)}
            min={0}
            required
          />
        </FormField>

        <FormField label="Stock Quantity" required>
          <GlassInput
            type="number"
            suffix="units"
            placeholder="0"
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
            min={0}
            required
          />
        </FormField>

        {/* ── Delivery ── */}
        <SectionLabel icon={Truck} text="Delivery" />

        <FormField label="Estimated Delivery" required>
          <GlassSelect
            options={DELIVERY_OPTIONS.map((d) => d.label)}
            value={DELIVERY_OPTIONS.find((d) => d.value === form.delivery)?.label || ''}
            onChange={(v) => {
              const opt = DELIVERY_OPTIONS.find((d) => d.label === v);
              set('delivery', opt?.value || '');
            }}
            placeholder="Select delivery window"
          />
        </FormField>

        {/* ── AI Negotiation ── */}
        <SectionLabel icon={Sparkles} text="AI Negotiation" />

        <NegotiationSection
          enabled={form.negotiable}
          onToggle={() => set('negotiable', !form.negotiable)}
          floorPrice={form.floorPrice}
          onFloorChange={(v) => set('floorPrice', v)}
          mrp={form.mrp}
        />

        {/* ── Submit ── */}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={submitted}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white mt-4 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            boxShadow: '0 8px 28px rgba(124,58,237,0.4)',
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
                <Check size={18} /> Product Listed!
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> List Product
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Safe scroll padding */}
        <div className="h-8" />
      </form>
    </motion.div>
  );
}
