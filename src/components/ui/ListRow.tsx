import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ListRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  tone?: 'accent' | 'success' | 'warn' | 'danger' | 'neutral';
  className?: string;
}

const TONES = {
  accent: 'bg-accent/10 text-accent-ink',
  success: 'bg-success/10 text-success',
  warn: 'bg-warn/12 text-warn',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-surface-2 text-muted',
};

export const ListRow: React.FC<ListRowProps> = ({
  title,
  description,
  icon,
  trailing,
  onClick,
  tone = 'accent',
  className = '',
}) => {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-field text-start transition-colors ${
        onClick ? 'hover:bg-surface-2 active:bg-line/50' : ''
      } ${className}`}
    >
      {icon && (
        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${TONES[tone]}`}>
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-ink truncate">{title}</span>
        {description && (
          <span className="block text-[11px] text-muted mt-0.5 leading-5 line-clamp-2">
            {description}
          </span>
        )}
      </span>
      {trailing ?? (onClick ? <ChevronLeft size={17} className="text-muted/60 shrink-0" /> : null)}
    </Tag>
  );
};
