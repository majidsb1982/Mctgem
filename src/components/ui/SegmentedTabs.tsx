import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
}

interface SegmentedTabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  items,
  value,
  onChange,
  className = '',
}) => (
  <div
    role="tablist"
    className={`flex gap-1 p-1 rounded-field bg-surface-2 border border-line ${className}`}
  >
    {items.map((item) => {
      const active = item.id === value;
      return (
        <button
          key={item.id}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.id)}
          className={`flex-1 min-h-10 px-2 rounded-[0.6rem] text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
            active
              ? 'bg-surface text-accent-ink shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          <span className="truncate">{item.label}</span>
          {typeof item.count === 'number' && (
            <span
              className={`min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center ${
                active ? 'bg-accent/12 text-accent-ink' : 'bg-line/70 text-muted'
              }`}
            >
              {item.count.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
