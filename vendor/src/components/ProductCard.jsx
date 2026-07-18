import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Sparkles, Lock, Check, Pencil } from 'lucide-react';

const PERSONAS = [
  { id: 'soft', label: 'Meethi Didi' },
  { id: 'to_the_point', label: 'Vyapari' },
  { id: 'haggler', label: 'Mol-Bhav Queen' },
];

/* ── Toggle Switch ─────────────────────────────── */
function NegotiationToggle({ isOn, onToggle }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      role="switch"
      aria-checked={isOn}
      className="relative w-[46px] h-[26px] rounded-full flex-shrink-0 cursor-pointer transition-all duration-300"
      style={{
        background: isOn
          ? 'linear-gradient(90deg, #7c3aed, #9f67ff)'
          : 'var(--toggle-off)',
        boxShadow: isOn ? '0 0 14px rgba(124,58,237,0.45)' : 'none',
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{ x: isOn ? 22 : 2, y: 2 }}
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className="absolute w-[22px] h-[22px] rounded-full bg-white shadow-md"
      />
    </div>
  );
}

/* ── Unsold Pill ────────────────────────────────── */
function UnsoldPill({ days }) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg mb-2 transition-all duration-500"
      style={{ background: 'var(--pill-bg)', border: '1px solid var(--pill-border)' }}
    >
      <TrendingDown size={10} style={{ color: 'var(--pill-text)' }} />
      <span
        className="text-[10px] font-semibold transition-colors duration-500"
        style={{ color: 'var(--pill-text)' }}
      >
        Unsold • {days} days
      </span>
    </div>
  );
}

/* ── Floor Price Panel ──────────────────────────── */
function FloorPricePanel({ floorPrice, mrp, persona, onUpdateFloor, onUpdatePersona }) {
  const price = floorPrice ?? 680;
  const pct = Math.round((price / mrp) * 100);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(price);

  const commit = () => {
    const val = Number(draft);
    setEditing(false);
    if (val > 0 && val < mrp && val !== price && onUpdateFloor) onUpdateFloor(val);
  };

  return (
    <div
      className="mx-4 mb-4 rounded-2xl p-4 transition-all duration-500"
      style={{
        background: 'var(--floor-bg)',
        border: '1px solid var(--floor-border)',
      }}
    >
      {/* Price row */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Floor Price
          </p>
          <span className="flex items-center gap-0.5 text-[9px]" style={{ color: 'var(--text-muted)' }}>
            <Lock size={9} /> hidden from buyer
          </span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>₹</span>
            <input
              type="number"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commit()}
              onBlur={commit}
              className="font-bold text-2xl tracking-tight bg-transparent outline-none border-b-2 w-24"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--pill-text)' }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDraft(price); setEditing(true); }}
            className="flex items-center gap-2"
          >
            <p
              className="font-bold text-2xl tracking-tight transition-colors duration-500"
              style={{ color: 'var(--text-primary)' }}
            >
              ₹{price}
            </p>
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--pill-bg)', color: 'var(--pill-text)' }}
            >
              <Pencil size={10} /> Edit
            </span>
          </button>
        )}
      </div>

      {/* Progress bar: floor → MRP */}
      <div className="space-y-1 mb-3">
        <div
          className="h-1.5 rounded-full w-full"
          style={{ background: 'var(--track-bg)' }}
        >
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            Floor ₹{price}
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            MRP ₹{mrp}
          </span>
        </div>
      </div>

      {/* Persona picker */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Persona
        </p>
        <div className="flex gap-1.5">
          {PERSONAS.map((p) => {
            const selected = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onUpdatePersona && onUpdatePersona(p.id)}
                className="flex-1 py-2 px-1 rounded-xl text-[10px] font-bold leading-tight transition-all duration-200"
                style={{
                  background: selected ? 'linear-gradient(135deg,#7c3aed,#9f67ff)' : 'var(--card-bg)',
                  color: selected ? '#fff' : 'var(--text-secondary)',
                  border: selected ? '1px solid transparent' : '1px solid var(--card-border)',
                  boxShadow: selected ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Open badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.22)',
        }}
      >
        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check size={11} className="text-green-500" />
        </div>
        <span className="text-green-600 text-[11px] font-semibold">
          Open for Negotiation
        </span>
      </div>
    </div>
  );
}

const PERSONA_LABELS = {
  soft: 'Meethi Didi',
  to_the_point: 'Vyapari',
  haggler: 'Mol-Bhav Queen',
};

/* ── Product Card (main export) ─────────────────── */
export default function ProductCard({ product, index, onToggle, onExpand, onUpdateFloor, onUpdatePersona }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-[22px] overflow-hidden transition-all duration-500"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Top row — tappable to expand */}
      <div
        className="flex gap-4 items-start p-4 cursor-pointer"
        onClick={() => product.isNegotiable && onExpand(product.id)}
      >
        {/* Thumbnail */}
        <div
          className="relative w-[80px] h-[80px] rounded-[18px] overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--pill-bg)' }}
        >
          {product.image
            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            : <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>No image</span>
          }
          <div className="absolute inset-0 rounded-[18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" />
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Name + toggle */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3
              className="font-bold text-[14.5px] leading-tight flex-1 pr-2 transition-colors duration-500"
              style={{ color: 'var(--text-primary)' }}
            >
              {product.name}
            </h3>
            <NegotiationToggle
              isOn={product.isNegotiable}
              onToggle={() => onToggle(product.id)}
            />
          </div>

          <UnsoldPill days={product.daysUnsold} />

          {/* MRP + action */}
          <div className="flex justify-between items-center">
            <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
              MRP{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                ₹{product.mrp}
              </span>
            </p>

            {product.showEnableBtn && !product.isNegotiable && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => { e.stopPropagation(); onToggle(product.id); }}
                className="text-white text-[10px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
                }}
              >
                Enable Negotiation
              </motion.button>
            )}

            {product.isNegotiable && (
              <div className="flex items-center gap-1">
                <Sparkles size={12} style={{ color: 'var(--pill-text)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--pill-text)' }}>
                  {PERSONA_LABELS[product.persona] || 'Active'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable floor price section */}
      <AnimatePresence initial={false}>
        {product.isExpanded && product.isNegotiable && (
          <motion.div
            key="floor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <FloorPricePanel
              floorPrice={product.floorPrice}
              mrp={product.mrp}
              persona={product.persona}
              onUpdateFloor={(val) => onUpdateFloor && onUpdateFloor(product.id, val)}
              onUpdatePersona={(val) => onUpdatePersona && onUpdatePersona(product.id, val)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
