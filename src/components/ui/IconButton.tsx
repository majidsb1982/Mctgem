import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must be announced. */
  'aria-label': string;
  size?: 'sm' | 'md';
  active?: boolean;
}

/** 44px minimum hit area, one consistent hover/active treatment. */
export const IconButton: React.FC<IconButtonProps> = ({
  size = 'md',
  active = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center rounded-xl transition-colors duration-150 active:scale-95 ${
      size === 'md' ? 'h-11 w-11' : 'h-9 w-9'
    } ${
      active
        ? 'bg-accent/12 text-accent-ink'
        : 'text-muted hover:bg-surface-2 hover:text-ink'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);
