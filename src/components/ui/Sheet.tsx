import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Max width on desktop. */
  width?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${WIDTHS[width]} max-h-[92dvh] flex flex-col bg-surface border border-line rounded-t-3xl sm:rounded-card shadow-2xl animate-sheet-up overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line shrink-0">
          <div className="min-w-0">
            <div className="mx-auto sm:hidden w-10 h-1 rounded-full bg-line mb-3" />
            {title && <h2 className="font-bold text-base text-ink leading-6">{title}</h2>}
            {subtitle && <p className="text-xs text-muted mt-1 leading-5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="h-9 w-9 shrink-0 rounded-xl text-muted hover:bg-surface-2 hover:text-ink flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto grow">{children}</div>

        {footer && (
          <div className="px-5 py-3 border-t border-line bg-surface-2/50 shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
