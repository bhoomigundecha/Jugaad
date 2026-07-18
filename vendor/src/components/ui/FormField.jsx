/**
 * FormField — labelled wrapper for any form control.
 * Consistent label + optional hint matching the app's type scale.
 */
import { Info } from 'lucide-react';

export default function FormField({ label, hint, required = false, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--pill-text)' }} className="ml-0.5">
              *
            </span>
          )}
        </label>
        {hint && (
          <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Info size={10} />
            <span className="text-[10px]">{hint}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
