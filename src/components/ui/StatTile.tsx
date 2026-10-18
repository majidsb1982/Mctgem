import React from 'react';

type Tone = 'accent' | 'success' | 'warn' | 'danger' | 'neutral';

interface StatTileProps {
  value: React.ReactNode;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
}

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent-ink',
  success: 'bg-success/10 text-success',
  warn: 'bg-warn/12 text-warn',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-surface-2 text-muted',
};

export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  hint,
  icon,
  tone = 'accent',
  onClick,
}) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-start rounded-card bg-surface border border-line p-3.5 transition-all ${
        onClick ? 'hover:border-accent/40 active:scale-[0.98] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONES[tone]}`}>
          {icon}
        </span>
        {hint && <span className="text-[10px] font-semibold text-muted">{hint}</span>}
      </div>
      <div className="text-xl font-extrabold text-ink num leading-7">{value}</div>
      <div className="text-[11px] font-semibold text-muted mt-0.5">{label}</div>
    </Tag>
  );
};
