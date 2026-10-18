import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`rounded-card border border-dashed border-line bg-surface/60 px-5 py-9 text-center ${className}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent-ink flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="font-bold text-sm text-ink">{title}</p>
    {description && (
      <p className="text-xs text-muted mt-1.5 leading-6 max-w-xs mx-auto">{description}</p>
    )}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);
