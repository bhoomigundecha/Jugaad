/**
 * GlassInput — styled text/number input using the app's glassmorphism card tokens.
 * Supports optional prefix (e.g. "₹") and suffix (e.g. "units").
 */
export default function GlassInput({ prefix, suffix, className = '', ...props }) {
  return (
    <div
      className="flex items-center rounded-2xl overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-[#7c3aed]/30"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      {prefix && (
        <span
          className="pl-4 pr-1 font-semibold text-[15px] flex-shrink-0 select-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          {prefix}
        </span>
      )}
      <input
        {...props}
        className={`flex-1 bg-transparent px-4 py-3.5 text-[14px] font-medium outline-none w-full placeholder:opacity-40 ${className}`}
        style={{ color: 'var(--text-primary)' }}
      />
      {suffix && (
        <span
          className="pr-4 text-[12px] font-medium flex-shrink-0 select-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
