import React from 'react';

type Tone = 'accent' | 'neutral' | 'success' | 'warn' | 'danger';

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent-ink border-accent/20',
  neutral: 'bg-surface-2 text-muted border-line',
  success: 'bg-success/10 text-success border-success/20',
  warn: 'bg-warn/12 text-warn border-warn/25',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot, className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-5 whitespace-nowrap ${TONES[tone]} ${className}`}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
    {children}
  </span>
);

interface CountBadgeProps {
  count: number;
  tone?: 'danger' | 'accent';
}

/** Nav / tab counters, capped at ۹+. */
export const CountBadge: React.FC<CountBadgeProps> = ({ count, tone = 'danger' }) => {
  if (!count) return null;
  return (
    <span
      className={`absolute -top-1.5 -end-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm ${
        tone === 'danger' ? 'bg-danger' : 'bg-accent'
      }`}
    >
      {count > 9 ? '۹+' : count.toLocaleString('fa-IR')}
    </span>
  );
};
