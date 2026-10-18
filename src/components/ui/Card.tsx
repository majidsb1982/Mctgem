import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  padded?: boolean;
  as?: 'section' | 'div' | 'article';
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}) => (
  <Tag
    className={`rounded-card bg-surface border border-line shadow-sm shadow-black/[0.03] ${
      padded ? 'p-4 sm:p-5' : ''
    } ${className}`}
    {...rest}
  >
    {children}
  </Tag>
);

interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-3 ${className}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && (
        <span className="w-9 h-9 shrink-0 rounded-xl bg-accent/10 text-accent-ink flex items-center justify-center">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="font-bold text-sm text-ink leading-6 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5 leading-5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
