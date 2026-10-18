import React from 'react';

export const fieldClasses =
  'w-full bg-surface-2 border border-line rounded-field px-3.5 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface';

interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-xs font-bold text-muted">{label}</label>}
    {children}
    {hint && <p className="text-[11px] text-muted/90 leading-5">{hint}</p>}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...rest
}) => <input className={`${fieldClasses} h-11 ${className}`} {...rest} />;

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...rest
}) => <textarea className={`${fieldClasses} py-2.5 leading-6 resize-y ${className}`} {...rest} />;

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <select className={`${fieldClasses} h-11 font-semibold ${className}`} {...rest}>
    {children}
  </select>
);
