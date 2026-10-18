import React from 'react';
import { Check } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/** A full-row switch: 44px target, visible checked state, keyboard friendly. */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center gap-3 min-h-12 px-3.5 py-3 rounded-field border text-start transition-colors disabled:opacity-50 ${
      checked
        ? 'border-accent/30 bg-accent/[0.07]'
        : 'border-line bg-surface hover:bg-surface-2'
    }`}
  >
    {icon && (
      <span
        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
          checked ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-muted'
        }`}
      >
        {icon}
      </span>
    )}
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-ink leading-6">{label}</span>
      {description && (
        <span className="block text-[11px] text-muted leading-5 mt-0.5">{description}</span>
      )}
    </span>
    <span
      className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
        checked ? 'bg-accent border-accent text-accent-fg' : 'border-line text-transparent'
      }`}
    >
      <Check size={14} strokeWidth={3} />
    </span>
  </button>
);
