/**
 * SectionLabel — thin horizontal section divider with an icon + text label.
 * Matches the visual rhythm of the home page's stat strip and card layout.
 */
export default function SectionLabel({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon size={13} style={{ color: 'var(--text-secondary)' }} />
      <span
        className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
        style={{ color: 'var(--text-secondary)' }}
      >
        {text}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
    </div>
  );
}
